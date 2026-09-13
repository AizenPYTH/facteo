'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';

import { PrimaryButton, SecondaryButton } from '@/components/app/form-fields';
import { Badge, LoadingState, Panel } from '@/components/app/ui';
import {
  EBAY_PROVIDER,
  fetchEbayIntegration,
  fetchEbayOrders,
  syncEbayOrders,
  type ExternalOrderFilter,
} from '@/lib/integrations/ebay/api';
import { integrationsQueryKeys } from '@/lib/integrations/query-keys';
import {
  filterOrdersBySearch,
  orderBuyerLabel,
  orderPrimaryLabel,
} from '@/lib/integrations/ebay/order-display';
import { formatMoney } from '@/lib/integrations/money';
import { useTenant } from '@/providers/company-provider';
import { describeFulfillmentStatus, describePaymentStatus } from '@/types/integrations';
import { cn } from '@/lib/utils';

const FILTERS: { key: ExternalOrderFilter; label: string }[] = [
  { key: 'pending', label: 'À facturer' },
  { key: 'invoiced', label: 'Facturées' },
  { key: 'all', label: 'Toutes' },
];

function formatDate(value: string | null): string {
  if (!value) return '—';
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? new Date(timestamp).toLocaleDateString('fr-FR') : '—';
}

/** E-commerce → eBay → Commandes. N'affiche que des commandes réellement importées. */
export default function EbayOrdersPage() {
  const { scope } = useTenant();
  const companyId = scope?.companyId ?? null;

  const [filter, setFilter] = useState<ExternalOrderFilter>('pending');
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const integrationQuery = useQuery({
    queryKey: integrationsQueryKeys.status(companyId ?? '', EBAY_PROVIDER),
    queryFn: () => fetchEbayIntegration(companyId as string),
    enabled: Boolean(companyId),
    staleTime: 15_000,
  });

  const ordersQuery = useQuery({
    queryKey: integrationsQueryKeys.orderList(companyId ?? '', EBAY_PROVIDER, filter),
    queryFn: () => fetchEbayOrders(scope as NonNullable<typeof scope>, filter),
    enabled: Boolean(companyId),
    staleTime: 15_000,
  });

  const sync = useMutation({
    mutationFn: () => syncEbayOrders(companyId as string),
    onMutate: () => {
      setMessage(null);
      setActionError(null);
    },
    onSuccess: (result) => {
      setMessage(
        result.fetched === 0
          ? 'Aucune nouvelle commande eBay.'
          : `${result.imported} commande(s) importée(s).`,
      );
      void queryClient.invalidateQueries({ queryKey: integrationsQueryKeys.all });
    },
    onError: (err) =>
      setActionError(err instanceof Error ? err.message : 'Synchronisation impossible.'),
  });

  // Filtrage local : la liste est déjà bornée côté base, une requête par
  // frappe n'apporterait rien.
  const orders = useMemo(
    () => filterOrdersBySearch(ordersQuery.data ?? [], search),
    [ordersQuery.data, search],
  );
  const loading = ordersQuery.isLoading || integrationQuery.isLoading;
  const busy = sync.isPending;
  const connected = integrationQuery.data ? integrationQuery.data.status === 'connected' : null;
  const error =
    actionError ??
    (ordersQuery.error instanceof Error ? ordersQuery.error.message : null);

  if (integrationQuery.isSuccess && connected === false) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col gap-4 p-4 min-[900px]:p-6">
        <Panel title="Commandes eBay">
          <p className="mb-4 text-[13.5px] text-app-muted">
            Aucun compte eBay connecté. Connectez votre compte pour importer vos commandes.
          </p>
          <Link
            className="inline-flex items-center rounded-[9px] bg-app-accent px-[14px] py-[9px] text-[13.5px] font-medium text-white"
            href="/app/settings/integrations/ebay">
            Connecter eBay
          </Link>
        </Panel>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 p-4 min-[900px]:p-6">
      <Panel
        action={
          <SecondaryButton disabled={busy} onClick={() => sync.mutate()}>
            {busy ? 'Synchronisation…' : 'Synchroniser'}
          </SecondaryButton>
        }
        title="Commandes eBay">
        <div className="mb-4 flex gap-2">
          {FILTERS.map((entry) => (
            <button
              className={cn(
                'rounded-full px-3 py-1.5 text-[12.5px] font-medium transition',
                entry.key === filter
                  ? 'bg-app-accent text-white'
                  : 'bg-app-subtle text-app-muted hover:bg-app-hover',
              )}
              key={entry.key}
              onClick={() => setFilter(entry.key)}
              type="button">
              {entry.label}
            </button>
          ))}
        </div>

        <div className="relative mb-4">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-app-muted-2" />
          <input
            className="w-full rounded-[9px] border border-app-border bg-app-surface py-[9px] pl-9 pr-3 text-[13.5px] text-app-text outline-none placeholder:text-app-muted-2 focus:border-app-accent"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Rechercher un objet, un acheteur, un numéro de commande…"
            type="search"
            value={search}
          />
        </div>

        {error ? <p className="mb-3 text-[13px] text-red-600">{error}</p> : null}
        {message ? <p className="mb-3 text-[13px] text-app-muted">{message}</p> : null}

        {loading ? (
          <LoadingState />
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <p className="text-[14px] font-semibold text-app-text">
              {search ? 'Aucun résultat' : 'Aucune commande importée'}
            </p>
            <p className="max-w-md text-[13.5px] leading-relaxed text-app-muted">
              {search
                ? `Aucune commande ne correspond à « ${search} ».`
                : filter === 'pending'
                ? 'Aucune commande eBay en attente de facturation. Lancez une synchronisation pour récupérer les dernières commandes.'
                : filter === 'invoiced'
                  ? 'Aucune commande eBay n’a encore donné lieu à une facture.'
                  : 'Lancez une synchronisation pour importer vos commandes eBay.'}
            </p>
            <PrimaryButton disabled={busy} onClick={() => sync.mutate()}>
              Synchroniser maintenant
            </PrimaryButton>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {orders.map((order) => (
              <li key={order.id}>
                <Link
                  className="flex flex-col gap-1.5 rounded-[10px] border border-app-border px-4 py-3 transition hover:bg-app-hover"
                  href={`/app/settings/integrations/ebay/orders/${order.id}`}>
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="truncate text-[14px] font-semibold text-app-text">
                      {orderPrimaryLabel(order)}
                    </span>
                    <span className="shrink-0 text-[14px] font-semibold text-app-text">
                      {formatMoney(order.totalAmount, order.currency)}
                    </span>
                  </span>
                  <span className="truncate text-[12.5px] text-app-muted">
                    {orderBuyerLabel(order)} · {formatDate(order.orderCreatedAt)}
                  </span>
                  <span className="truncate text-[11.5px] text-app-muted-2">
                    Commande {order.externalOrderId}
                  </span>
                  <span className="flex flex-wrap items-center gap-1.5">
                    <Badge variant={order.paymentStatus === 'PAID' ? 'success' : 'default'}>
                      {describePaymentStatus(order.paymentStatus)}
                    </Badge>
                    <Badge>{describeFulfillmentStatus(order.fulfillmentStatus)}</Badge>
                    {order.environment === 'sandbox' ? <Badge variant="info">Sandbox</Badge> : null}
                    {order.collectAndRemit ? (
                      <Badge variant="warning">TVA collectée par eBay</Badge>
                    ) : null}
                    {order.invoiceId ? (
                      <Badge variant="success">Facture créée</Badge>
                    ) : (
                      <Badge>Pas encore facturée</Badge>
                    )}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
