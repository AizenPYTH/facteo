'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, Hourglass, Plus, Wallet } from 'lucide-react';

import { AppTopBar } from '@/components/app/app-shell';
import { EmptyState } from '@/components/app/empty-state';
import { PrimaryLink, SecondaryButton } from '@/components/app/form-fields';
import { TableSkeleton } from '@/components/app/skeleton';
import { StatusBadge } from '@/components/app/status-badge';
import { DataTable, Panel, StatCard } from '@/components/app/ui';
import { useDashboard } from '@/hooks/use-dashboard';
import { useInfiniteInvoices } from '@/hooks/use-invoices';
import { formatCurrency } from '@/lib/domain/format/currency';
import { formatDate } from '@/lib/domain/format/date';
import { isPaymentMethodId, PAYMENT_METHOD_LABELS } from '@inveq/types/payment-methods';
import { cn } from '@/lib/utils';

type PeriodId = 'month' | 'quarter' | 'year';

const PERIODS: { id: PeriodId; label: string; caption: string }[] = [
  { id: 'month', label: 'Ce mois', caption: 'mois en cours' },
  { id: 'quarter', label: 'Trimestre', caption: 'trimestre en cours' },
  { id: 'year', label: 'Année', caption: 'année en cours' },
];

function plural(count: number) {
  return count > 1 ? 's' : '';
}

function periodStart(period: PeriodId): Date {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  if (period === 'month') {
    start.setDate(1);
  } else if (period === 'quarter') {
    start.setMonth(Math.floor(start.getMonth() / 3) * 3, 1);
  } else {
    start.setMonth(0, 1);
  }

  return start;
}

function paymentMethodLabel(method: string | null): string {
  if (!method) return '—';
  return isPaymentMethodId(method) ? PAYMENT_METHOD_LABELS[method] : method;
}

export default function PaymentsPage() {
  const [period, setPeriod] = useState<PeriodId>('month');
  const { stats, loading: dashboardLoading } = useDashboard();
  const query = useInfiniteInvoices('', 'paid');

  const invoices = useMemo(
    () => query.data?.pages.flatMap((page) => page.invoices) ?? [],
    [query.data],
  );

  const totalCount = query.data?.pages[0]?.totalCount ?? null;

  /** Le sélecteur de période filtre les encaissements déjà chargés : aucune requête supplémentaire. */
  const visible = useMemo(() => {
    const start = periodStart(period).getTime();
    return invoices.filter((invoice) => {
      const reference = invoice.paidAt ?? invoice.issuedAt;
      if (!reference) return false;
      const time = new Date(reference).getTime();
      return Number.isFinite(time) && time >= start;
    });
  }, [invoices, period]);

  const caption = PERIODS.find((item) => item.id === period)!.caption;

  const rows = visible.map((invoice) => ({
    id: invoice.id,
    date: (
      <span className="app-num text-app-muted">{formatDate(invoice.paidAt ?? invoice.issuedAt)}</span>
    ),
    number: (
      <Link
        className="app-num font-semibold text-app-text transition-colors duration-150 hover:text-app-accent"
        href={`/app/invoices?selected=${invoice.id}`}>
        {invoice.number}
      </Link>
    ),
    client: <span className="block truncate">{invoice.clientName}</span>,
    method: <span className="text-app-muted">{paymentMethodLabel(invoice.paymentMethod)}</span>,
    amount: formatCurrency(invoice.totalTtc),
    status: <StatusBadge kind="invoice" status={invoice.status} />,
  }));

  return (
    <>
      <AppTopBar
        count={
          totalCount !== null
            ? `${totalCount} encaissement${plural(totalCount)}`
            : null
        }
        subtitle="Factures réglées et suivi des montants attendus"
        title="Paiements">
        <PrimaryLink href="/app/invoices?status=sent">
          <Plus size={16} />
          Enregistrer un paiement
        </PrimaryLink>
      </AppTopBar>

      <div className="sb flex-1 overflow-y-auto bg-app-canvas p-4 lg:px-6 lg:pb-8 lg:pt-5">
        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            accent="success"
            icon={Wallet}
            label="Encaissé ce mois"
            trend="Factures payées depuis le 1er du mois"
            value={dashboardLoading ? '—' : formatCurrency(stats.monthlyRevenue)}
          />
          <StatCard
            accent="primary"
            icon={Hourglass}
            label="En attente de paiement"
            trend={
              dashboardLoading
                ? 'Chargement…'
                : `${stats.outstandingInvoices} facture${plural(stats.outstandingInvoices)} envoyée${plural(stats.outstandingInvoices)}${
                    stats.averagePaymentDelayDays > 0
                      ? ` · délai moyen ${stats.averagePaymentDelayDays} j`
                      : ''
                  }`
            }
            value={dashboardLoading ? '—' : formatCurrency(stats.outstandingAmount)}
          />
          <StatCard
            accent="success"
            action={
              stats.lateInvoices > 0 ? (
                <Link
                  className="text-[12px] font-semibold text-app-danger transition-colors duration-150 hover:text-app-danger-text"
                  href="/app/invoices?status=overdue">
                  Traiter
                </Link>
              ) : null
            }
            icon={stats.lateInvoices > 0 ? AlertCircle : CheckCircle2}
            label="Impayés à relancer"
            tone={stats.lateInvoices > 0 ? 'danger' : 'default'}
            trend={
              dashboardLoading
                ? 'Chargement…'
                : stats.lateInvoices > 0
                  ? `Facture${plural(stats.lateInvoices)} en retard à relancer en priorité`
                  : 'Aucun retard de paiement'
            }
            value={dashboardLoading ? '—' : String(stats.lateInvoices)}
          />
        </div>

        <Panel
          action={
            <div className="flex gap-1 rounded-app-field bg-app-border-soft p-[3px]">
              {PERIODS.map((item) => (
                <button
                  aria-pressed={item.id === period}
                  className={cn(
                    'rounded-[7px] px-2.5 py-[5px] text-[12px] font-semibold transition-colors duration-150',
                    item.id === period
                      ? 'bg-app-surface text-app-text'
                      : 'text-app-muted-2 hover:text-app-text-2',
                  )}
                  key={item.id}
                  onClick={() => setPeriod(item.id)}
                  type="button">
                  {item.label}
                </button>
              ))}
            </div>
          }
          bodyClassName="p-0"
          className="mt-3.5"
          title="Encaissements">
          {query.isLoading ? (
            <div className="p-[18px]">
              <TableSkeleton rows={6} />
            </div>
          ) : visible.length === 0 ? (
            <div className="p-[18px]">
              <EmptyState
                action={
                  invoices.length > 0 && period !== 'year' ? (
                    <SecondaryButton onClick={() => setPeriod('year')}>
                      Voir l’année entière
                    </SecondaryButton>
                  ) : (
                    <PrimaryLink href="/app/invoices?status=sent">
                      Voir les factures en attente
                    </PrimaryLink>
                  )
                }
                description={
                  invoices.length > 0
                    ? `Aucune facture réglée sur le ${caption}.`
                    : 'Une facture marquée comme payée apparaît ici avec son moyen de paiement.'
                }
                icon={Wallet}
                title="Aucun encaissement à afficher"
              />
            </div>
          ) : (
            <>
              <DataTable
                className="rounded-none border-0 border-t border-app-border-soft max-[899px]:hidden"
                columns={[
                  { key: 'date', label: 'Date' },
                  { key: 'number', label: 'Facture' },
                  { key: 'client', label: 'Client' },
                  { key: 'method', label: 'Moyen', className: 'max-lg:hidden' },
                  { key: 'amount', label: 'Montant', align: 'right' },
                  { key: 'status', label: 'Statut' },
                ]}
                rows={rows}
              />

              <ul className="divide-y divide-app-border-soft min-[900px]:hidden">
                {visible.map((invoice) => (
                  <li key={invoice.id}>
                    <Link
                      className="flex min-h-11 items-center gap-3 px-4 py-3"
                      href={`/app/invoices?selected=${invoice.id}`}>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13.5px] font-semibold text-app-text">
                          {invoice.number}
                        </span>
                        <span className="block truncate text-[12px] text-app-muted-2">
                          {invoice.clientName}
                        </span>
                      </span>
                      <span className="app-num shrink-0 text-[13px] font-semibold text-app-text">
                        {formatCurrency(invoice.totalTtc)}
                      </span>
                      <StatusBadge kind="invoice" status={invoice.status} />
                    </Link>
                  </li>
                ))}
              </ul>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-app-border-soft px-6 py-3.5">
                <p className="app-num text-[12.5px] text-app-muted-2">
                  {`${visible.length} encaissement${plural(visible.length)} sur le ${caption}`}
                  {totalCount !== null ? ` · ${totalCount} au total` : ''}
                </p>
                {query.hasNextPage ? (
                  <SecondaryButton
                    className="text-app-accent hover:border-app-accent-border hover:bg-app-accent-soft"
                    disabled={query.isFetchingNextPage}
                    onClick={() => void query.fetchNextPage()}>
                    {query.isFetchingNextPage
                      ? 'Chargement…'
                      : totalCount !== null
                        ? `Charger ${Math.max(totalCount - invoices.length, 0)} de plus`
                        : 'Charger plus'}
                  </SecondaryButton>
                ) : null}
              </div>
            </>
          )}
        </Panel>
      </div>
    </>
  );
}
