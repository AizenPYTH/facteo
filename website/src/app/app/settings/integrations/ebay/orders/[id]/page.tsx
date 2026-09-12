'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import { ClientPicker } from '@/components/app/client-picker';
import { PrimaryButton, SecondaryButton } from '@/components/app/form-fields';
import { LoadingState, Panel } from '@/components/app/ui';
import { useInfiniteClients } from '@/hooks/use-clients';
import { createClient } from '@/lib/domain/supabase/clients';
import { createInvoice } from '@/lib/domain/supabase/invoices';
import { requireScope } from '@/lib/domain/tenant/scope';
import { fetchEbayOrderById, linkOrderToInvoice } from '@/lib/integrations/ebay/api';
import { integrationsQueryKeys } from '@/lib/integrations/query-keys';
import { formatMoney } from '@/lib/integrations/money';
import {
  buildClientFormFromBuyer,
  buildOrderInvoiceDraft,
  draftTotalMismatch,
} from '@/lib/integrations/ebay/order-to-invoice';
import { useTenant } from '@/providers/company-provider';
import {
  describeFulfillmentStatus,
  describePaymentStatus,
  type ExternalOrder,
} from '@/types/integrations';

function formatDate(value: string | null): string {
  if (!value) return '—';
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? new Date(timestamp).toLocaleDateString('fr-FR') : '—';
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-app-border-soft py-2 last:border-b-0">
      <span className="text-[13px] text-app-muted">{label}</span>
      <span className="whitespace-pre-line text-right text-[13.5px] font-medium text-app-text">
        {value}
      </span>
    </div>
  );
}

function Notice({
  tone,
  children,
}: {
  tone: 'warning' | 'danger' | 'info';
  children: React.ReactNode;
}) {
  const palette =
    tone === 'danger'
      ? 'border-l-red-500 bg-red-50 text-red-900'
      : tone === 'warning'
        ? 'border-l-amber-500 bg-amber-50 text-amber-900'
        : 'border-l-indigo-500 bg-indigo-50 text-indigo-900';
  return (
    <div className={`rounded-[10px] border-l-[3px] px-4 py-3 text-[13.5px] leading-relaxed ${palette}`}>
      {children}
    </div>
  );
}

/**
 * Détail d'une commande eBay et création MANUELLE d'une facture INVEQ.
 * La commande n'est qu'une source de données : la facture est produite par
 * `createInvoice()`, le moteur existant, après validation explicite.
 */
export default function EbayOrderPage() {
  const params = useParams<{ id: string }>();
  const orderId = typeof params.id === 'string' ? params.id : '';
  const router = useRouter();
  const { scope } = useTenant();

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [acknowledged, setAcknowledged] = useState(false);

  const clientsQuery = useInfiniteClients('');
  const clients = useMemo(
    () => clientsQuery.data?.pages.flatMap((page) => page.clients) ?? [],
    [clientsQuery.data?.pages],
  );

  const orderQuery = useQuery({
    queryKey: integrationsQueryKeys.orderDetail(scope?.companyId ?? '', orderId),
    queryFn: () => fetchEbayOrderById(scope as NonNullable<typeof scope>, orderId),
    enabled: Boolean(scope?.companyId && orderId),
  });

  const order: ExternalOrder | null = orderQuery.data ?? null;
  const loading = orderQuery.isLoading;

  const draft = useMemo(() => (order ? buildOrderInvoiceDraft(order) : null), [order]);
  const mismatch = useMemo(
    () => (order && draft ? draftTotalMismatch(order, draft.lines) : null),
    [draft, order],
  );

  const createClientMutation = useMutation({
    mutationFn: () =>
      createClient(
        requireScope(scope),
        buildClientFormFromBuyer((order as ExternalOrder).buyer),
      ),
    onMutate: () => setError(null),
    onSuccess: async (created) => {
      setSelectedClientId(created.id);
      await clientsQuery.refetch();
    },
    onError: (err) =>
      setError(err instanceof Error ? err.message : 'Création du client impossible.'),
  });

  async function handleCreateInvoice() {
    if (!order || !draft || !selectedClientId || !scope) return;
    setBusy(true);
    setError(null);
    try {
      const invoice = await createInvoice(requireScope(scope), {
        clientId: selectedClientId,
        lines: draft.lines,
        notes: draft.notes,
      });
      // La base refuse tout second rattachement pour la même commande.
      await linkOrderToInvoice(order.id, invoice.id);
      router.push(`/app/invoices/${invoice.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Création de la facture impossible.');
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl p-4 min-[900px]:p-6">
        <LoadingState />
      </div>
    );
  }

  if (!order || !draft) {
    return (
      <div className="mx-auto max-w-3xl p-4 min-[900px]:p-6">
        <Panel title="Commande eBay">
          <p className="text-[13.5px] text-app-muted">
            Cette commande n’existe pas ou n’appartient pas à l’entreprise sélectionnée.
          </p>
        </Panel>
      </div>
    );
  }

  const alreadyInvoiced = Boolean(order.invoiceId);
  const blocking = draft.warnings.filter((warning) => warning.level === 'blocking');
  const canSubmit =
    !alreadyInvoiced && Boolean(selectedClientId) && (blocking.length === 0 || acknowledged);

  const buyerAddress = order.buyer.address
    ? [
        order.buyer.address.addressLine1,
        order.buyer.address.addressLine2,
        [order.buyer.address.postalCode, order.buyer.address.city].filter(Boolean).join(' '),
        order.buyer.address.countryCode,
      ]
        .filter(Boolean)
        .join('\n')
    : 'Non communiquée';

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 p-4 min-[900px]:p-6">
      <Panel
        action={
          <Link
            className="text-[13px] font-medium text-app-accent hover:underline"
            href="/app/settings/integrations/ebay/orders">
            ← Toutes les commandes
          </Link>
        }
        title={`Commande ${order.externalOrderId}`}>
        <Row label="Numéro eBay" value={order.externalOrderId} />
        {order.orderReference ? (
          <Row label="Référence des ventes" value={order.orderReference} />
        ) : null}
        <Row label="Passée le" value={formatDate(order.orderCreatedAt)} />
        <Row label="Paiement" value={describePaymentStatus(order.paymentStatus)} />
        <Row label="Expédition" value={describeFulfillmentStatus(order.fulfillmentStatus)} />
        <Row
          label="Sous-total articles"
          value={formatMoney(order.subtotalAmount, order.currency)}
        />
        <Row label="Livraison" value={formatMoney(order.shippingAmount, order.currency)} />
        <Row label="Total eBay" value={formatMoney(order.totalAmount, order.currency)} />
        {order.collectAndRemit ? (
          <Row
            label="Dont taxe collectée par eBay"
            value={formatMoney(order.marketplaceTaxAmount, order.currency)}
          />
        ) : null}
        {order.environment === 'sandbox' ? <Row label="Environnement" value="Sandbox (test)" /> : null}
      </Panel>

      <Panel title="Acheteur">
        <Row
          label="Nom"
          value={order.buyer.fullName ?? order.buyer.companyName ?? 'Non communiqué'}
        />
        <Row label="Pseudo eBay" value={order.buyerUsername ?? '—'} />
        <Row label="E-mail" value={order.buyer.email ?? 'Non communiqué'} />
        <Row label="Adresse" value={buyerAddress} />
      </Panel>

      {draft.warnings.length > 0 ? (
        <Panel title="À vérifier">
          <div className="flex flex-col gap-2">
            {draft.warnings.map((warning) => (
              <Notice key={warning.code} tone={warning.level === 'blocking' ? 'warning' : 'info'}>
                {warning.message}
              </Notice>
            ))}
            {mismatch ? (
              <Notice tone="info">
                {`Le brouillon diffère du total eBay hors taxe marketplace de ${mismatch} ${order.currency ?? ''}. Vérifiez les lignes avant validation.`}
              </Notice>
            ) : null}
          </div>
        </Panel>
      ) : null}

      <Panel title="Lignes proposées">
        <ul className="flex flex-col">
          {draft.lines.map((line) => (
            <li className="border-b border-app-border-soft py-2.5 last:border-b-0" key={line.id}>
              <p className="whitespace-pre-line text-[13.5px] font-medium text-app-text">
                {line.description}
              </p>
              <p className="mt-0.5 text-[12.5px] text-app-muted">
                {line.quantity} × {formatMoney(line.unitPrice, order.currency)} · TVA à renseigner
              </p>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[12.5px] leading-relaxed text-app-muted">
          Les taux de TVA sont volontairement vides. Vous les renseignerez dans la facture, qui
          reste modifiable tant qu’elle est en brouillon.
        </p>
      </Panel>

      {alreadyInvoiced ? (
        <Panel title="Facturation">
          <Notice tone="info">
            Cette commande a déjà donné lieu à une facture INVEQ. Une commande ne peut être
            facturée qu’une seule fois.
          </Notice>
          <Link
            className="mt-3 inline-flex items-center rounded-[9px] border border-app-border bg-app-surface px-[14px] py-[9px] text-[13.5px] font-medium text-app-text-2 transition hover:bg-app-hover"
            href={`/app/invoices/${order.invoiceId}`}>
            Ouvrir la facture
          </Link>
        </Panel>
      ) : (
        <>
          <Panel title="Client de la facture">
            <ClientPicker
              clients={clients}
              loading={clientsQuery.isLoading}
              onChange={setSelectedClientId}
              value={selectedClientId}
            />
            <div className="mt-3">
              <SecondaryButton
                disabled={busy || createClientMutation.isPending || (!order.buyer.fullName && !order.buyer.companyName)}
                onClick={() => createClientMutation.mutate()}>
                Créer le client depuis eBay
              </SecondaryButton>
            </div>
          </Panel>

          <Panel title="Validation">
            {blocking.length > 0 ? (
              <label className="mb-3 flex cursor-pointer items-start gap-2.5">
                <input
                  checked={acknowledged}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--app-accent,#4f46e5)]"
                  onChange={(event) => setAcknowledged(event.target.checked)}
                  type="checkbox"
                />
                <span className="text-[13.5px] leading-relaxed text-app-text">
                  J’ai lu les {blocking.length} point(s) à vérifier ci-dessus et je confirme
                  vouloir créer la facture.
                </span>
              </label>
            ) : null}

            {error ? <Notice tone="danger">{error}</Notice> : null}

            <div className="mt-3">
              <PrimaryButton disabled={!canSubmit || busy} onClick={() => void handleCreateInvoice()}>
                {busy ? 'Création…' : 'Créer la facture INVEQ'}
              </PrimaryButton>
            </div>
            {!selectedClientId ? (
              <p className="mt-2 text-[12.5px] text-app-muted">
                Sélectionnez ou créez un client pour continuer.
              </p>
            ) : null}
          </Panel>
        </>
      )}
    </div>
  );
}
