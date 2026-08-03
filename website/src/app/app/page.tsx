'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, FileText, Plus, Send, TrendingUp, Users, Wallet } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';

import { AppTopBar } from '@/components/app/app-shell';
import {
  DashboardActivityFeed,
  DashboardTips,
} from '@/components/app/dashboard-activity';
import { DashboardSubscriptionCard } from '@/components/app/dashboard-subscription-card';
import { Panel, StatCard } from '@/components/app/ui';
import { Skeleton } from '@/components/app/skeleton';
import { useDashboard } from '@/hooks/use-dashboard';
import { formatCurrency } from '@/lib/domain/format/currency';
import { formatDate } from '@/lib/domain/format/date';

export default function DashboardPage() {
  const { firstName, companyName, stats, recentInvoices, extended, loading } = useDashboard();
  const router = useRouter();
  const reduceMotion = useReducedMotion();

  if (loading) {
    return (
      <div className="flex h-full flex-col overflow-hidden">
        <div className="border-b border-slate-200/90 bg-white px-6 py-5 sm:px-8">
          <Skeleton className="h-8 w-64 rounded-xl" />
          <Skeleton className="mt-2 h-4 w-40" />
        </div>
        <div className="grid gap-4 p-4 sm:p-6 lg:grid-cols-4 xl:p-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton className="h-28 rounded-2xl" key={i} />
          ))}
        </div>
        <div className="grid gap-4 px-4 sm:px-6 lg:grid-cols-3 xl:px-8">
          <Skeleton className="h-56 rounded-2xl lg:col-span-2" />
          <Skeleton className="h-56 rounded-2xl" />
        </div>
      </div>
    );
  }

  const maxRevenue = Math.max(...extended.revenueByMonth.map((m) => m.amount), 1);
  const topClient = extended.topClients[0] ?? null;
  const sentOrOpen =
    stats.unpaidInvoices + stats.paidInvoices > 0
      ? stats.unpaidInvoices + stats.paidInvoices
      : recentInvoices.filter((i) => i.status !== 'draft' && i.status !== 'canceled').length;
  const invoiceCount = stats.paidInvoices + stats.unpaidInvoices;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <AppTopBar
        subtitle={companyName ?? 'Vue d’ensemble de votre activité'}
        title={firstName ? `Bonjour, ${firstName}` : 'Tableau de bord'}>
        <Link
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_24px_-10px_rgba(37,99,235,0.65)] transition duration-150 hover:-translate-y-0.5 hover:bg-primary-dark"
          href="/app/invoices?create=1">
          <Plus size={16} />
          <span className="hidden sm:inline">Nouvelle facture</span>
          <span className="sm:hidden">Facture</span>
        </Link>
      </AppTopBar>

      <div className="flex-1 overflow-y-auto bg-[linear-gradient(180deg,#f8fafc_0%,#f1f5f9_100%)]">
        <div className="space-y-3 p-4 lg:space-y-4 lg:p-6 xl:px-6">
          <DashboardTips
            invoiceCount={invoiceCount}
            topClient={topClient}
            totalClients={stats.totalClients}
          />

          <DashboardSubscriptionCard />

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
            <StatCard
              accent="primary"
              label="Chiffre d'affaires"
              trend="Ce mois"
              value={formatCurrency(stats.monthlyRevenue)}
            />
            <StatCard
              accent="info"
              label="Factures envoyées"
              trend="Payées + en cours"
              value={String(sentOrOpen)}
            />
            <StatCard
              accent="warning"
              label="Paiements en attente"
              trend={formatCurrency(stats.outstandingAmount)}
              value={String(stats.unpaidInvoices)}
            />
            <StatCard
              accent="success"
              label="Meilleur client"
              trend={topClient ? formatCurrency(topClient.revenue) : 'Ce mois'}
              value={topClient?.name ?? '—'}
            />
          </div>
        </div>

        <div className="grid gap-4 px-4 pb-6 lg:grid-cols-3 xl:px-6">
          <Panel className="lg:col-span-2" title="Évolution du chiffre d'affaires">
            {extended.revenueByMonth.every((m) => m.amount === 0) ? (
              <div className="flex h-48 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/60 text-center">
                <p className="text-sm font-medium text-slate-700">Pas encore de CA à afficher</p>
                <p className="mt-1 max-w-xs text-xs text-slate-500">
                  Les factures payées apparaîtront ici mois par mois.
                </p>
              </div>
            ) : (
              <div className="flex h-48 items-end gap-2.5">
                {extended.revenueByMonth.map((month, index) => (
                  <div className="flex flex-1 flex-col items-center gap-2" key={month.month}>
                    <motion.div
                      animate={
                        reduceMotion
                          ? undefined
                          : { height: Math.max(8, (month.amount / maxRevenue) * 160) }
                      }
                      className="w-full rounded-t-lg bg-gradient-to-t from-primary to-blue-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] transition hover:from-primary-dark"
                      initial={reduceMotion ? false : { height: 8 }}
                      title={formatCurrency(month.amount)}
                      transition={{
                        duration: 0.45,
                        delay: index * 0.03,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                    />
                    <span className="text-[10px] font-medium text-slate-400">{month.month}</span>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          <Panel title="Raccourcis">
            <div className="space-y-2">
              {[
                { href: '/app/quotes?create=1', icon: FileText, label: 'Créer un devis' },
                { href: '/app/clients/new', icon: Users, label: 'Ajouter un client' },
                { href: '/app/invoices', icon: TrendingUp, label: 'Voir les factures' },
                { href: '/app/payments', icon: Wallet, label: 'Suivre les paiements' },
              ].map((item) => (
                <Link
                  className="group flex items-center justify-between rounded-xl border border-slate-200/90 bg-white px-4 py-3 text-sm font-medium text-slate-800 shadow-[0_1px_2px_rgba(15,23,42,0.03)] transition duration-150 hover:-translate-y-0.5 hover:border-primary/25 hover:bg-blue-50/40"
                  href={item.href}
                  key={item.href}>
                  <span className="flex min-w-0 items-center gap-2.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-primary ring-1 ring-blue-100">
                      <item.icon size={15} />
                    </span>
                    <span className="truncate">{item.label}</span>
                  </span>
                  <ArrowRight
                    className="shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-primary"
                    size={14}
                  />
                </Link>
              ))}
            </div>
          </Panel>
        </div>

        <div className="grid gap-4 px-4 pb-8 xl:grid-cols-2 xl:px-6">
          <Panel title="Dernières factures">
            {recentInvoices.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-8 text-center">
                <Send className="mx-auto text-slate-300" size={22} />
                <p className="mt-2 text-sm font-medium text-slate-700">Aucune facture récente</p>
                <Link
                  className="mt-3 inline-flex text-sm font-semibold text-primary hover:underline"
                  href="/app/invoices?create=1">
                  Créer la première
                </Link>
              </div>
            ) : (
              <div className="space-y-1">
                {recentInvoices.map((invoice) => (
                  <button
                    className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-3 text-left transition duration-150 hover:bg-slate-50"
                    key={invoice.id}
                    onClick={() => router.push(`/app/invoices?selected=${invoice.id}`)}
                    type="button">
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-semibold tracking-tight text-slate-900">
                        {invoice.number}
                      </p>
                      <p className="mt-0.5 truncate text-sm text-slate-500">{invoice.clientName}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-semibold tabular-nums text-slate-900">
                        {formatCurrency(invoice.amount)}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-400">{formatDate(invoice.issuedAt)}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </Panel>

          <DashboardActivityFeed activity={extended.recentActivity} invoices={recentInvoices} />
        </div>
      </div>
    </div>
  );
}
