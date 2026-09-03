'use client';

import type { LucideIcon } from 'lucide-react';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText,
  Hourglass,
  Package,
  Plus,
  Receipt,
  TrendingUp,
  UserPlus,
  Wallet,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { AppTopBar } from '@/components/app/app-shell';
import {
  DashboardActivityFeed,
  DashboardTaskRow,
  DashboardTips,
  type DashboardTone,
} from '@/components/app/dashboard-activity';
import { EmptyState } from '@/components/app/empty-state';
import { PrimaryLink, SecondaryLink } from '@/components/app/form-fields';
import { Skeleton } from '@/components/app/skeleton';
import { Panel, StatCard } from '@/components/app/ui';
import { useDashboard } from '@/hooks/use-dashboard';
import { useSubscription } from '@/hooks/use-subscription';
import { formatCurrency } from '@/lib/domain/format/currency';
import { formatDate } from '@/lib/domain/format/date';
import type { DashboardStats, Invoice, MonthlyRevenue } from '@/types/dashboard';
import { cn } from '@/lib/utils';

const MAX_TASKS = 6;
const CHART_HEIGHT = 148;

const TWO_THIRDS_GRID = 'grid items-start gap-3.5 lg:grid-cols-[minmax(0,1.62fr)_minmax(0,1fr)]';

const PANEL_ACTION =
  'text-[12.5px] font-semibold text-app-muted transition-colors duration-150 hover:text-app-accent';

const CREATE_TILES: { href: string; label: string; icon: LucideIcon; iconClass: string }[] = [
  { href: '/app/quotes?create=1', label: 'Devis', icon: FileText, iconClass: 'text-app-accent-violet' },
  { href: '/app/invoices?create=1', label: 'Facture', icon: Receipt, iconClass: 'text-app-accent' },
  { href: '/app/clients/new', label: 'Client', icon: UserPlus, iconClass: 'text-app-accent' },
  { href: '/app/products', label: 'Produit', icon: Package, iconClass: 'text-app-accent' },
];

const CHART_RANGES = [
  { id: '12m', label: '12 mois', caption: '12 derniers mois' },
  { id: '6m', label: '6 mois', caption: '6 derniers mois' },
  { id: 'year', label: 'Année', caption: 'Année en cours' },
] as const;

type ChartRangeId = (typeof CHART_RANGES)[number]['id'];

type DashboardTask = {
  id: string;
  icon: LucideIcon;
  tone: DashboardTone;
  title: string;
  meta: string;
  amount?: string;
  actionLabel: string;
  href: string;
};

function plural(count: number) {
  return count > 1 ? 's' : '';
}

/** Compare le dernier mois de `revenueByMonth` au précédent : aucune requête supplémentaire. */
function computeMonthlyTrend(months: MonthlyRevenue[]) {
  if (months.length < 2) return null;

  const current = months[months.length - 1];
  const previous = months[months.length - 2];

  if (previous.amount <= 0) return null;

  return {
    percent: Math.round(((current.amount - previous.amount) / previous.amount) * 100),
    previousLabel: previous.month.replace(/\.$/, ''),
  };
}

/**
 * File de tâches déduite des seules données déjà chargées par `useDashboard()`.
 * Les devis n'étant pas exposés ligne à ligne, ils sont agrégés via `stats.pendingQuotes`.
 */
function buildTasks(invoices: Invoice[], stats: DashboardStats): DashboardTask[] {
  const tasks: DashboardTask[] = [];
  const overdue = invoices.filter((invoice) => invoice.status === 'overdue');

  for (const invoice of overdue) {
    tasks.push({
      id: `overdue-${invoice.id}`,
      icon: AlertCircle,
      tone: 'danger',
      title: `Facture ${invoice.number} en retard`,
      meta: `${invoice.clientName} · émise le ${formatDate(invoice.issuedAt)}`,
      amount: formatCurrency(invoice.amount),
      actionLabel: 'Relancer',
      href: `/app/invoices?selected=${invoice.id}`,
    });
  }

  const remainingLate = Math.max(0, stats.lateInvoices - overdue.length);

  if (remainingLate > 0) {
    tasks.push({
      id: 'late-invoices',
      icon: AlertCircle,
      tone: 'danger',
      title:
        overdue.length > 0
          ? `${remainingLate} autre${plural(remainingLate)} facture${plural(remainingLate)} en retard`
          : `${remainingLate} facture${plural(remainingLate)} en retard de paiement`,
      meta: 'Paiement attendu au-delà de l’échéance.',
      actionLabel: 'Traiter',
      href: '/app/invoices?status=overdue',
    });
  }

  if (stats.pendingQuotes > 0) {
    tasks.push({
      id: 'pending-quotes',
      icon: Clock,
      tone: 'violet',
      title: `${stats.pendingQuotes} devis en attente de réponse`,
      meta: 'Une relance accélère la signature avant expiration.',
      actionLabel: 'Relancer',
      href: '/app/quotes',
    });
  }

  for (const invoice of invoices.filter((entry) => entry.status === 'draft')) {
    tasks.push({
      id: `draft-${invoice.id}`,
      icon: FileText,
      tone: 'neutral',
      title: `Brouillon ${invoice.number} à finaliser`,
      meta: `${invoice.clientName} · ${formatDate(invoice.issuedAt)}`,
      amount: formatCurrency(invoice.amount),
      actionLabel: 'Reprendre',
      href: `/app/invoices?selected=${invoice.id}`,
    });
  }

  return tasks;
}

function MetricRow({ label, hint, value }: { label: string; hint?: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-app-border-soft py-[9px] first:pt-0 last:border-b-0 last:pb-0">
      <span className="min-w-0">
        <span className="block text-[13px] text-app-muted">{label}</span>
        {hint ? <span className="app-num block text-[11.5px] text-app-muted-2">{hint}</span> : null}
      </span>
      <span className="app-num max-w-[58%] truncate text-[13.5px] font-semibold text-app-text">
        {value}
      </span>
    </div>
  );
}

function CreatePanel() {
  return (
    <Panel title="Créer">
      <div className="grid grid-cols-2 gap-2">
        {CREATE_TILES.map((tile) => {
          const Icon = tile.icon;
          return (
            <Link
              className="flex flex-col gap-2 rounded-app-control border border-app-border bg-app-surface p-3 transition-colors duration-150 hover:border-app-accent-border hover:bg-app-accent-soft"
              href={tile.href}
              key={tile.href}>
              <Icon className={tile.iconClass} size={17} strokeWidth={1.75} />
              <span className="text-[13px] font-semibold text-app-text">{tile.label}</span>
            </Link>
          );
        })}
      </div>
    </Panel>
  );
}

function RevenueChart({ months }: { months: MonthlyRevenue[] }) {
  const [range, setRange] = useState<ChartRangeId>('12m');

  const visible =
    range === '6m'
      ? months.slice(-6)
      : range === 'year'
        ? months.slice(-(new Date().getMonth() + 1))
        : months;

  const total = visible.reduce((sum, month) => sum + month.amount, 0);
  const max = Math.max(...visible.map((month) => month.amount), 1);
  const caption = CHART_RANGES.find((item) => item.id === range)!.caption;

  return (
    <Panel
      action={
        <div className="flex gap-1 rounded-app-field bg-app-border-soft p-[3px]">
          {CHART_RANGES.map((item) => (
            <button
              className={cn(
                'rounded-[7px] px-2.5 py-[5px] text-[12px] font-semibold transition-colors duration-150',
                item.id === range
                  ? 'bg-app-surface text-app-text'
                  : 'text-app-muted-2 hover:text-app-text-2',
              )}
              key={item.id}
              onClick={() => setRange(item.id)}
              type="button">
              {item.label}
            </button>
          ))}
        </div>
      }
      title="Chiffre d’affaires encaissé">
      <p className="app-num text-[12.5px] text-app-muted">
        {caption} · {formatCurrency(total)} au total
      </p>
      {total <= 0 ? (
        <EmptyState
          action={<PrimaryLink href="/app/invoices?create=1">Créer une facture</PrimaryLink>}
          className="mt-4"
          description="Les factures payées alimentent ce graphique, mois par mois."
          icon={TrendingUp}
          title="Aucun encaissement à afficher"
        />
      ) : (
        <div className="mt-[18px] flex h-[172px] items-end gap-2.5">
          {visible.map((month, index) => (
            <div
              className="flex min-w-0 flex-1 flex-col items-center gap-[7px]"
              key={`${month.month}-${index}`}>
              <div
                className={cn(
                  'w-full rounded-b-[3px] rounded-t-md',
                  index === visible.length - 1
                    ? 'bg-[linear-gradient(180deg,var(--app-accent-violet),var(--app-accent))]'
                    : 'bg-app-chart-bar',
                )}
                style={{ height: `${Math.max(6, Math.round((month.amount / max) * CHART_HEIGHT))}px` }}
                title={`${month.month} · ${formatCurrency(month.amount)}`}
              />
              <span className="w-full truncate text-center text-[10.5px] font-medium text-app-faint">
                {month.month}
              </span>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <header className="shrink-0 border-b border-app-border bg-app-surface px-4 py-[19px] sm:px-6">
        <Skeleton className="h-[19px] w-48" />
        <Skeleton className="mt-2 h-3.5 w-64" />
      </header>

      <div className="sb flex-1 overflow-y-auto bg-app-canvas p-4 lg:px-6 lg:pb-8 lg:pt-5">
        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              className="rounded-app-card border border-app-border bg-app-surface px-[18px] py-4"
              key={index}>
              <div className="flex items-center gap-2">
                <Skeleton className="h-[26px] w-[26px] rounded-app-icon" />
                <Skeleton className="h-3 w-28" />
              </div>
              <Skeleton className="mt-3.5 h-7 w-36" />
              <Skeleton className="mt-2.5 h-3 w-44" />
            </div>
          ))}
        </div>

        <div className={cn(TWO_THIRDS_GRID, 'mt-3.5')}>
          <Panel bodyClassName="p-0" title="À traiter aujourd’hui">
            <ul>
              {Array.from({ length: 4 }).map((_, index) => (
                <li
                  className="flex items-center gap-3 border-b border-app-border-soft px-[18px] py-3 last:border-b-0"
                  key={index}>
                  <Skeleton className="h-[30px] w-[30px] rounded-app-field" />
                  <div className="min-w-0 flex-1">
                    <Skeleton className="h-3 w-2/3" />
                    <Skeleton className="mt-2 h-[11px] w-1/2" />
                  </div>
                  <Skeleton className="h-[30px] w-[74px] rounded-app-field" />
                </li>
              ))}
            </ul>
          </Panel>

          <div className="flex flex-col gap-3.5">
            <CreatePanel />
            <Panel title="Vos indicateurs">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  className="flex items-center justify-between gap-3 border-b border-app-border-soft py-[11px] first:pt-0 last:border-b-0 last:pb-0"
                  key={index}>
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-3 w-16" />
                </div>
              ))}
            </Panel>
          </div>
        </div>

        <div className={cn(TWO_THIRDS_GRID, 'mt-3.5')}>
          <Panel title="Chiffre d’affaires encaissé">
            <div className="flex h-[172px] items-end gap-2.5">
              {Array.from({ length: 12 }).map((_, index) => (
                <Skeleton
                  className="flex-1 rounded-b-[3px] rounded-t-md"
                  key={index}
                  style={{ height: `${40 + ((index * 37) % 100)}px` }}
                />
              ))}
            </div>
          </Panel>
          <Panel bodyClassName="p-0" title="Activité récente">
            <ul>
              {Array.from({ length: 5 }).map((_, index) => (
                <li
                  className="flex items-center gap-[11px] border-b border-app-border-soft px-[18px] py-[13px] last:border-b-0"
                  key={index}>
                  <Skeleton className="h-7 w-7 rounded-full" />
                  <div className="min-w-0 flex-1">
                    <Skeleton className="h-3 w-3/4" />
                    <Skeleton className="mt-2 h-[10px] w-1/3" />
                  </div>
                  <Skeleton className="h-3 w-14" />
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { firstName, companyName, stats, recentInvoices, extended, loading } = useDashboard();
  const { hasFeature } = useSubscription();
  const advancedStatsLocked = !hasFeature('advanced_stats');

  if (loading) {
    return <DashboardSkeleton />;
  }

  const tasks = buildTasks(recentInvoices, stats);
  const visibleTasks = tasks.slice(0, MAX_TASKS);
  const topClient = extended.topClients[0] ?? null;
  const trend = computeMonthlyTrend(extended.revenueByMonth);
  const invoiceCount = stats.paidInvoices + stats.unpaidInvoices;
  const todayLabel = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date());

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <AppTopBar
        subtitle={`${companyName ?? 'Vue d’ensemble de votre activité'} · ${todayLabel}`}
        title={firstName ? `Bonjour, ${firstName}` : 'Tableau de bord'}>
        <SecondaryLink href="/app/quotes?create=1">
          <FileText className="text-app-accent-violet" size={15} strokeWidth={1.75} />
          <span className="max-sm:hidden">Nouveau devis</span>
          <span className="sm:hidden">Devis</span>
        </SecondaryLink>
        <PrimaryLink href="/app/invoices?create=1">
          <Plus size={15} strokeWidth={2.25} />
          <span className="max-sm:hidden">Nouvelle facture</span>
          <span className="sm:hidden">Facture</span>
        </PrimaryLink>
      </AppTopBar>

      <div className="sb flex-1 overflow-y-auto bg-app-canvas p-4 lg:px-6 lg:pb-8 lg:pt-5">
        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            accent="success"
            icon={Wallet}
            label="Encaissé ce mois"
            trend={
              trend ? (
                <>
                  <span
                    className={cn(
                      'font-semibold',
                      trend.percent < 0 ? 'text-app-danger-text' : 'text-app-success-text',
                    )}>
                    {trend.percent > 0 ? '+' : ''}
                    {trend.percent} %
                  </span>{' '}
                  vs {trend.previousLabel}
                </>
              ) : (
                'Factures payées depuis le 1er du mois'
              )
            }
            value={formatCurrency(stats.monthlyRevenue)}
          />
          <StatCard
            accent="primary"
            icon={Hourglass}
            label="En attente de paiement"
            trend={`${stats.outstandingInvoices} facture${plural(stats.outstandingInvoices)} envoyée${plural(stats.outstandingInvoices)}${
              stats.averagePaymentDelayDays > 0
                ? ` · délai moyen ${stats.averagePaymentDelayDays} j`
                : ''
            }`}
            value={formatCurrency(stats.outstandingAmount)}
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
            label="Factures en retard"
            tone={stats.lateInvoices > 0 ? 'danger' : 'default'}
            trend={
              stats.lateInvoices > 0
                ? `${stats.lateInvoices} facture${plural(stats.lateInvoices)} à relancer en priorité`
                : 'Aucun retard de paiement'
            }
            value={String(stats.lateInvoices)}
          />
        </div>

        <div className={cn(TWO_THIRDS_GRID, 'mt-3.5')}>
          <Panel
            action={
              <div className="flex items-center gap-2.5">
                {tasks.length > 0 ? (
                  <span className="app-num rounded-app-chip bg-app-accent-tint px-2 py-0.5 text-[11px] font-bold text-app-accent">
                    {tasks.length}
                  </span>
                ) : null}
                <Link className={PANEL_ACTION} href="/app/invoices">
                  Tout voir
                </Link>
              </div>
            }
            bodyClassName="p-0"
            title="À traiter aujourd’hui">
            {tasks.length === 0 ? (
              <DashboardTips
                invoiceCount={invoiceCount}
                topClient={topClient}
                totalClients={stats.totalClients}
              />
            ) : (
              <>
                <ul>
                  {visibleTasks.map((task) => (
                    <DashboardTaskRow
                      actionLabel={task.actionLabel}
                      amount={task.amount}
                      href={task.href}
                      icon={task.icon}
                      key={task.id}
                      meta={task.meta}
                      title={task.title}
                      tone={task.tone}
                    />
                  ))}
                </ul>
                <p className="px-[18px] py-[11px] text-[12.5px] text-app-muted-2">
                  {tasks.length > MAX_TASKS
                    ? `${tasks.length - MAX_TASKS} autre${plural(tasks.length - MAX_TASKS)} élément${plural(tasks.length - MAX_TASKS)} à traiter dans vos listes.`
                    : 'Tout est à jour au-delà de ces éléments.'}
                </p>
              </>
            )}
          </Panel>

          <div className="flex flex-col gap-3.5">
            <CreatePanel />
            {advancedStatsLocked ? (
              <Panel title="Vos indicateurs">
                <MetricRow label="Devis en attente" value={String(stats.pendingQuotes)} />
                <p className="mt-3 text-[13px] text-app-text-2">
                  Revenu annuel, panier moyen et meilleur client sont réservés à l’offre Max —
                  comme sur l’application mobile.
                </p>
                <Link
                  className="mt-3 inline-flex text-[13px] font-semibold text-app-accent hover:underline"
                  href="/app/settings/subscription">
                  Voir les offres
                </Link>
              </Panel>
            ) : (
              <Panel title="Vos indicateurs">
                <MetricRow
                  label="Encaissé cette année"
                  value={formatCurrency(stats.yearlyRevenue)}
                />
                <MetricRow label="Devis en attente" value={String(stats.pendingQuotes)} />
                <MetricRow
                  label="Panier moyen"
                  value={formatCurrency(stats.averageInvoiceAmount)}
                />
                <MetricRow
                  hint={topClient ? formatCurrency(topClient.revenue) : undefined}
                  label="Meilleur client"
                  value={topClient?.name ?? '—'}
                />
              </Panel>
            )}
          </div>
        </div>

        {advancedStatsLocked ? (
          <div className="mt-3.5">
            <Panel title="Statistiques avancées">
              <p className="text-[13px] text-app-text-2">
                Graphique de revenu et activité détaillée : identiques à l’app, disponibles avec
                Max.
              </p>
              <Link
                className="mt-3 inline-flex text-[13px] font-semibold text-app-accent hover:underline"
                href="/app/settings/subscription">
                Voir les offres
              </Link>
            </Panel>
          </div>
        ) : (
          <div className={cn(TWO_THIRDS_GRID, 'mt-3.5')}>
            <RevenueChart months={extended.revenueByMonth} />
            <DashboardActivityFeed activity={extended.recentActivity} invoices={recentInvoices} />
          </div>
        )}
      </div>
    </div>
  );
}
