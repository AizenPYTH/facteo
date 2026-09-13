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
import { addInvoicePayment, createInvoice } from '@/lib/domain/supabase/invoices';
import { requireScope } from '@/lib/domain/tenant/scope';
import { fetchEbayOrderById, linkOrderToInvoice } from '@/lib/integrations/ebay/api';
import { integrationsQueryKeys } from '@/lib/integrations/query-keys';
import { centsToDecimalString, formatMoney } from '@/lib/integrations/money';
import {
  DEFAULT_EBAY_VAT_RATE,
  buildClientFormFromBuyer,
  buildOrderInvoiceDraft,
  draftLinesTotalTtcCents,
  draftTotalMismatch,
} from '@/lib/integrations/ebay/order-to-invoice';
import { orderPrimaryLabel } from '@/lib/integrations/ebay/order-display';
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
  const [vatRate, setVatRate] = useState(DEFAULT_EBAY_VAT_RATE);

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

  const draft = useMemo(
    () => (order ? buildOrderInvoiceDraft(order, vatRate) : null),
    [order, vatRate],
  );
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

    // L'acheteur a réglé sur eBay au moment de la commande : la facture est un
    // justificatif produit après coup, pas une demande de paiement. Aucune
    // échéance future ne doit donc apparaître.
    const settledAt = order.orderCreatedAt;

    let invoice;
    try {
      invoice = await createInvoice(requireScope(scope), {
        clientId: selectedClientId,
        lines: draft.lines,
        notes: draft.notes,
        dueAt: settledAt,
      });
      // La base refuse tout second rattachement pour la même commande.
      await linkOrderToInvoice(order.id, invoice.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Création de la facture impossible.');
      setBusy(false);
      return;
    }

    // Encaissement enregistré tout de suite, avec la date et la référence eBay :
    // sans lui la facture apparaîtrait « à encaisser » et son PDF réclamerait un
    // virement pour de l'argent déjà reçu.
    try {
      if (invoice.totalTtc > 0) {
        await addInvoicePayment(requireScope(scope), invoice.id, {
          amount: invoice.totalTtc,
          paidAt: settledAt ?? undefined,
          paymentMethod: 'Paiement eBay',
          paymentReference: `Commande eBay ${order.externalOrderId}`,
        });
      }
    } catch (err) {
      const reason = err instanceof Error ? err.message : 'raison inconnue';
      setError(
        `La facture ${invoice.number} a bien été créée et rattachée à la commande, ` +
          `mais l'encaissement eBay n'a pas pu être enregistré (${reason}). ` +
          'Ouvrez la facture et enregistrez le paiement à la main avant de l’envoyer.',
      );
      setBusy(false);
      return;
    }

    router.push(`/app/invoices?selected=${invoice.id}`);
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
        title={orderPrimaryLabel(order)}>
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
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <label className="text-[13px] text-app-muted" htmlFor="ebay-vat-rate">
            Taux de TVA appliqué
          </label>
          <div className="flex items-center gap-1.5">
            <input
              className="w-[84px] rounded-[9px] border border-app-border bg-app-surface px-3 py-[7px] text-[13.5px] text-app-text outline-none focus:border-app-accent"
              id="ebay-vat-rate"
              inputMode="decimal"
              onChange={(event) => setVatRate(event.target.value)}
              value={vatRate}
            />
            <span className="text-[13px] text-app-muted">%</span>
          </div>
          {[0, 5.5, 10, 20].map((rate) => (
            <button
              className="rounded-full bg-app-subtle px-2.5 py-1 text-[12px] font-medium text-app-muted transition hover:bg-app-hover"
              key={rate}
              onClick={() => setVatRate(String(rate).replace('.', '.'))}
              type="button">
              {String(rate).replace('.', ',')} %
            </button>
          ))}
        </div>

        <ul className="flex flex-col">
          {draft.lines.map((line) => (
            <li className="border-b border-app-border-soft py-2.5 last:border-b-0" key={line.id}>
              <p className="whitespace-pre-line text-[13.5px] font-medium text-app-text">
                {line.description}
              </p>
              <p className="mt-0.5 text-[12.5px] text-app-muted">
                {line.quantity} × {formatMoney(line.unitPrice, order.currency)} HT ·{' '}
                {line.vatRate ? `TVA ${line.vatRate} %` : 'TVA à renseigner'}
              </p>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex items-baseline justify-between gap-4 rounded-[9px] bg-app-subtle px-3 py-2">
          <span className="text-[13px] text-app-muted">Total TTC de la facture</span>
          <span className="text-[14px] font-semibold text-app-text">
            {formatMoney(centsToDecimalString(draftLinesTotalTtcCents(draft.lines)), order.currency)}
          </span>
        </div>

        <p className="mt-3 text-[12.5px] leading-relaxed text-app-muted">
          {order.collectAndRemit
            ? 'Aucun taux n’est pré-rempli : eBay a déjà collecté la taxe sur cette commande. Renseignez la TVA vous-même après avoir vérifié le traitement applicable.'
            : 'Les prix eBay sont TTC : ils sont convertis en HT au taux ci-dessus, pour que le total de la facture corresponde à ce que l’acheteur a payé. Ce taux est une valeur par défaut, pas une donnée eBay. La facture reste modifiable tant qu’elle est en brouillon.'}
        </p>
      </Panel>

      {alreadyInvoiced ? (
        <Panel title="Facturation">
          <Notice tone="info">
            Cette commande a déjà donné lieu à une facture INVEQ. Une commande ne peut donner
            lieu qu’à une seule facture.
          </Notice>
          <Link
            className="mt-3 inline-flex items-center rounded-[9px] border border-app-border bg-app-surface px-[14px] py-[9px] text-[13.5px] font-medium text-app-text-2 transition hover:bg-app-hover"
            href={`/app/invoices?selected=${order.invoiceId}`}>
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

            <p className="mb-3 text-[12.5px] leading-relaxed text-app-muted">
              La facture sera créée <strong>acquittée</strong> : le paiement eBay
              {order.orderCreatedAt ? ` du ${formatDate(order.orderCreatedAt)}` : ''} y est
              enregistré, avec le numéro de commande en référence. Elle ne réclamera donc ni
              échéance, ni virement, ni QR de paiement.
            </p>

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
