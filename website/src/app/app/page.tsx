'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, FileText, Plus, TrendingUp, Users } from 'lucide-react';

import { AppTopBar } from '@/components/app/app-shell';
import { Badge, Panel, StatCard } from '@/components/app/ui';
import { Skeleton } from '@/components/app/skeleton';
import { useDashboard } from '@/hooks/use-dashboard';
import { formatCurrency } from '@/lib/domain/format/currency';
import { formatDate } from '@/lib/domain/format/date';

export default function DashboardPage() {
  const { firstName, companyName, stats, recentInvoices, extended, loading } = useDashboard();
  const router = useRouter();

  if (loading) {
    return (
      <div className="flex h-full flex-col overflow-hidden">
        <div className="border-b border-slate-200 bg-white px-8 py-5">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="mt-2 h-4 w-40" />
        </div>
        <div className="grid gap-4 p-8 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton className="h-28 rounded-2xl" key={i} />
          ))}
        </div>
      </div>
    );
  }

  const maxRevenue = Math.max(...extended.revenueByMonth.map((m) => m.amount), 1);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <AppTopBar
        subtitle={companyName ?? 'Vue d’ensemble de votre activité'}
        title={firstName ? `Bonjour, ${firstName}` : 'Tableau de bord'}>
        <Link
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-primary/25 hover:bg-primary-dark"
          href="/app/invoices?create=1">
          <Plus size={16} />
          Nouvelle facture
        </Link>
      </AppTopBar>

      <div className="flex-1 overflow-y-auto">
        <div className="grid gap-3 p-4 lg:grid-cols-5 lg:gap-4 lg:p-6 xl:p-6">
          <StatCard accent="primary" label="Chiffre d'affaires" trend="Ce mois" value={formatCurrency(stats.monthlyRevenue)} />
          <StatCard accent="warning" label="Factures impayées" trend={formatCurrency(stats.outstandingAmount)} value={String(stats.unpaidInvoices)} />
          <StatCard accent="success" label="Factures payées" value={String(stats.paidInvoices)} />
          <StatCard accent="muted" label="Devis en attente" value={String(stats.pendingQuotes)} />
          <StatCard accent="primary" label="Clients actifs" value={String(stats.totalClients)} />
        </div>

        <div className="grid gap-4 px-4 pb-6 lg:grid-cols-3 xl:px-6">
          <Panel className="xl:col-span-2" title="Évolution du chiffre d'affaires">
            <div className="flex h-48 items-end gap-2">
              {extended.revenueByMonth.map((month) => (
                <div className="flex flex-1 flex-col items-center gap-2" key={month.month}>
                  <div
                    className="w-full rounded-t-lg bg-gradient-to-t from-primary to-blue-400 transition-all hover:from-primary-dark"
                    style={{ height: `${Math.max(8, (month.amount / maxRevenue) * 160)}px` }}
                    title={formatCurrency(month.amount)}
                  />
                  <span className="text-[10px] text-slate-400">{month.month}</span>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Raccourcis">
            <div className="space-y-2">
              {[
                { href: '/app/quotes?create=1', icon: FileText, label: 'Créer un devis' },
                { href: '/app/clients/new', icon: Users, label: 'Ajouter un client' },
                { href: '/app/invoices', icon: TrendingUp, label: 'Voir les factures' },
              ].map((item) => (
                <Link
                  className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-800 transition hover:border-primary/30 hover:bg-blue-50/40"
                  href={item.href}
                  key={item.href}>
                  <span className="flex items-center gap-2">
                    <item.icon size={16} className="text-primary" />
                    {item.label}
                  </span>
                  <ArrowRight size={14} className="text-slate-400" />
                </Link>
              ))}
            </div>
          </Panel>
        </div>

        <div className="grid gap-4 px-4 pb-6 xl:grid-cols-2 xl:px-6">
          <Panel title="Dernières factures">
            {recentInvoices.length === 0 ? (
              <p className="text-sm text-slate-500">Aucune facture récente.</p>
            ) : (
              <div className="space-y-1">
                {recentInvoices.map((invoice) => (
                  <button
                    className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-left transition hover:bg-slate-50"
                    key={invoice.id}
                    onClick={() => router.push(`/app/invoices?selected=${invoice.id}`)}
                    type="button">
                    <div>
                      <p className="font-medium text-slate-900">{invoice.number}</p>
                      <p className="text-sm text-slate-500">{invoice.clientName}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-900">{formatCurrency(invoice.amount)}</p>
                      <p className="text-xs text-slate-400">{formatDate(invoice.issuedAt)}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </Panel>

          <Panel title="Activité récente">
            {extended.recentActivity.length === 0 ? (
              <p className="text-sm text-slate-500">Aucune activité récente.</p>
            ) : (
              <ul className="space-y-3">
                {extended.recentActivity.slice(0, 6).map((item) => (
                  <li className="flex items-center justify-between text-sm" key={item.id}>
                    <div>
                      <p className="font-medium text-slate-800">{item.label}</p>
                      <p className="text-slate-500">{formatDate(item.date)}</p>
                    </div>
                    <Badge variant="info">{item.type === 'invoice' ? 'Facture' : 'Devis'}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
