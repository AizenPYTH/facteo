'use client';

import Link from 'next/link';
import { ArrowRight, CreditCard } from 'lucide-react';

import { Badge } from '@/components/app/ui';
import { Skeleton } from '@/components/app/skeleton';
import { useSubscription } from '@/hooks/use-subscription';
import { formatDate } from '@/lib/domain/format/date';
import { getPlanDisplayName } from '@/lib/domain/subscription/plans';
import type { SubscriptionStatus } from '@/types/subscription';

function statusPresentation(status: SubscriptionStatus | undefined, cancelAtPeriodEnd: boolean): {
  label: string;
  variant: 'default' | 'success' | 'warning' | 'danger' | 'info';
} {
  if (cancelAtPeriodEnd) {
    return { label: 'Résiliation', variant: 'warning' };
  }

  switch (status) {
    case 'active':
      return { label: 'Actif', variant: 'success' };
    case 'trialing':
      return { label: 'Essai', variant: 'info' };
    case 'past_due':
      return { label: 'En retard', variant: 'warning' };
    case 'canceled':
    case 'unpaid':
      return { label: 'Expiré', variant: 'danger' };
    case 'incomplete':
      return { label: 'Incomplet', variant: 'warning' };
    default:
      return { label: 'Actif', variant: 'success' };
  }
}

/** Carte abonnement proéminente pour le tableau de bord. */
export function DashboardSubscriptionCard() {
  const { subscription, plan, isLoading, isPremium } = useSubscription();

  if (isLoading) {
    return <Skeleton className="h-[7.5rem] w-full rounded-2xl" />;
  }

  const planName =
    plan?.displayName ??
    getPlanDisplayName(subscription?.effectivePlanId ?? subscription?.plan ?? 'micro');
  const { label: statusLabel, variant: statusVariant } = statusPresentation(
    subscription?.status,
    Boolean(subscription?.cancelAtPeriodEnd),
  );

  const renewal =
    subscription?.currentPeriodEnd && isPremium
      ? subscription.cancelAtPeriodEnd
        ? `Se termine le ${formatDate(subscription.currentPeriodEnd)}`
        : `Renouvellement le ${formatDate(subscription.currentPeriodEnd)}`
      : isPremium
        ? 'Offre payante active'
        : 'Offre gratuite — passez à Basique, Standard, Pro ou Max';

  return (
    <section
      aria-label="Abonnement"
      className="relative overflow-hidden rounded-2xl border border-blue-100/90 bg-gradient-to-br from-blue-50/95 via-white to-white p-5 shadow-[0_1px_0_rgba(37,99,235,0.06),0_12px_32px_-24px_rgba(37,99,235,0.35)] sm:p-6">
      <div className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full bg-primary/10 blur-2xl" />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 space-y-2.5">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15">
              <CreditCard size={18} />
            </span>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
              Abonnement
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
              {planName}
            </h2>
            <Badge variant={statusVariant}>{statusLabel}</Badge>
          </div>

          <p className="max-w-xl text-sm leading-relaxed text-slate-600">{renewal}</p>
        </div>

        <Link
          className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-[0_10px_24px_-12px_rgba(37,99,235,0.7)] transition duration-150 hover:-translate-y-0.5 hover:bg-primary-dark sm:self-center"
          href="/app/settings/subscription">
          Gérer mon abonnement
          <ArrowRight size={15} />
        </Link>
      </div>
    </section>
  );
}
