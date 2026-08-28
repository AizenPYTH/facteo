'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { AppTopBar } from '@/components/app/app-shell';
import { Badge, LoadingState, Panel, StatCard } from '@/components/app/ui';
import { PricingSection } from '@/components/sections/pricing-section';
import { useAuth } from '@/providers/auth-provider';
import { fetchSubscriptionSnapshot } from '@/lib/domain/supabase/subscriptions';
import { subscriptionQueryKeys } from '@/lib/domain/supabase/query-keys';
import { formatDate } from '@/lib/domain/format/date';
import { SUPPORT_EMAIL } from '@/lib/constants';
import { getPlanDisplayName } from '@/lib/domain/subscription/plans';
import {
  confirmSubscriptionCheckout,
  isSubscriptionCheckoutConfigured,
  startBillingPortalRedirect,
} from '@/lib/stripe/subscription-checkout';
import type { SubscriptionStatus } from '@/types/subscription';

function formatStatusLabel(status: SubscriptionStatus, cancelAtPeriodEnd: boolean): string {
  if (cancelAtPeriodEnd) return 'Résiliation';
  switch (status) {
    case 'active':
      return 'Actif';
    case 'trialing':
      return 'Essai';
    case 'past_due':
      return 'En retard';
    case 'canceled':
    case 'unpaid':
      return 'Expiré';
    case 'incomplete':
      return 'Incomplet';
    default:
      return status;
  }
}

export default function SubscriptionSettingsContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const confirmStarted = useRef(false);
  const [confirmMessage, setConfirmMessage] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  const query = useQuery({
    queryKey: subscriptionQueryKeys.snapshot(user?.id ?? ''),
    queryFn: () => fetchSubscriptionSnapshot(user!.id),
    enabled: Boolean(user?.id),
  });

  useEffect(() => {
    const subscription = searchParams.get('subscription');
    const sessionId = searchParams.get('session_id') ?? searchParams.get('sessionId');

    if (subscription === 'canceled') {
      setConfirmMessage('Paiement annulé. Vous pouvez réessayer quand vous voulez.');
      return;
    }

    if (subscription !== 'success' || !sessionId || confirmStarted.current) {
      return;
    }

    confirmStarted.current = true;

    void (async () => {
      try {
        const result = await confirmSubscriptionCheckout(sessionId);
        if (user?.id) {
          await queryClient.invalidateQueries({
            queryKey: subscriptionQueryKeys.snapshot(user.id),
          });
        }
        const planName = getPlanDisplayName(result.planId);
        setConfirmMessage(
          result.isPaid || result.isPremium
            ? `Offre ${planName} activée. Merci !`
            : 'Paiement reçu. L’activation peut prendre quelques instants.',
        );
        router.replace('/app/settings/subscription');
      } catch (error) {
        setCheckoutError(
          error instanceof Error ? error.message : 'Impossible de confirmer le paiement.',
        );
      }
    })();
  }, [queryClient, router, searchParams, user?.id]);

  if (query.isLoading) {
    return <LoadingState message="Chargement de l’abonnement…" />;
  }

  if (query.error || !query.data) {
    return (
      <>
        <AppTopBar subtitle="Gérez votre plan" title="Abonnement">
          <Link className="text-sm font-medium text-primary hover:underline" href="/app/settings">
            ← Paramètres
          </Link>
        </AppTopBar>
        <div className="flex-1 p-8">
          <Panel>
            <p className="text-sm text-slate-600">
              Impossible de charger les informations d’abonnement. Réessayez plus tard ou contactez{' '}
              <a className="text-primary hover:underline" href={`mailto:${SUPPORT_EMAIL}`}>
                {SUPPORT_EMAIL}
              </a>
              .
            </p>
            <Link className="mt-4 inline-block font-medium text-primary hover:underline" href="/tarifs">
              Voir les tarifs
            </Link>
          </Panel>
        </div>
      </>
    );
  }

  const { subscription, plan, usage } = query.data;
  const isPaid = subscription.effectivePlanId !== 'micro' && subscription.plan !== 'free';
  const statusLabel = formatStatusLabel(subscription.status, subscription.cancelAtPeriodEnd);

  function openPortal() {
    setPortalLoading(true);
    setCheckoutError(null);
    void startBillingPortalRedirect().catch((error) => {
      setCheckoutError(error instanceof Error ? error.message : 'Impossible d’ouvrir le portail.');
      setPortalLoading(false);
    });
  }

  return (
    <>
      <AppTopBar subtitle="Plan actuel et utilisation" title="Abonnement">
        <Link className="text-sm font-medium text-primary hover:underline" href="/app/settings">
          ← Paramètres
        </Link>
      </AppTopBar>
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 xl:p-8">
        <div className="mx-auto max-w-7xl space-y-8">
          {confirmMessage ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
              {confirmMessage}
            </div>
          ) : null}
          {checkoutError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {checkoutError}
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard accent="primary" label="Plan" value={plan.displayName} />
            <StatCard
              accent="muted"
              label="Statut"
              trend={subscription.cancelAtPeriodEnd ? 'Fin de période programmée' : undefined}
              value={statusLabel}
            />
            <StatCard
              accent="success"
              label="Renouvellement"
              value={
                subscription.currentPeriodEnd
                  ? formatDate(subscription.currentPeriodEnd)
                  : '—'
              }
            />
          </div>

          <Panel title={isPaid ? `Offre ${plan.displayName} active` : 'Choisir une offre'}>
            <div className="space-y-5">
              <p className="max-w-3xl text-sm leading-relaxed text-slate-600">
                {isPaid
                  ? 'Changez d’offre, passez en annuel/mensuel ou résiliez via le portail Stripe sécurisé.'
                  : isSubscriptionCheckoutConfigured()
                    ? 'Sélectionnez Basique, Standard, Pro ou Max. Un champ code promo est disponible au-dessus des cartes.'
                    : 'Le paiement n’est pas encore disponible.'}
              </p>
              {isPaid ? (
                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <button
                    className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-dark disabled:opacity-60"
                    disabled={portalLoading}
                    onClick={openPortal}
                    type="button">
                    {portalLoading ? 'Ouverture du portail…' : 'Changer d’offre'}
                  </button>
                  <button
                    className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-primary/30 hover:bg-blue-50/40 disabled:opacity-60"
                    disabled={portalLoading}
                    onClick={openPortal}
                    type="button">
                    Passer à l’annuel / Revenir au mensuel
                  </button>
                  <button
                    className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-primary/30 hover:bg-blue-50/40 disabled:opacity-60"
                    disabled={portalLoading}
                    onClick={openPortal}
                    type="button">
                    {portalLoading ? 'Ouverture du portail…' : 'Gérer mon abonnement'}
                  </button>
                </div>
              ) : null}
            </div>
          </Panel>

          <section aria-label="Offres disponibles" className="space-y-4">
            <div className="px-1">
              <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                {isPaid ? 'Comparer les offres' : 'Nos formules'}
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Prix HT. Choisissez mensuel ou annuel — les montants viennent de Stripe.
              </p>
            </div>
            <PricingSection />
          </section>

          <Panel title="Utilisation">
            <div className="grid gap-4 sm:grid-cols-3">
              <UsageBar
                current={usage.documents}
                label="Documents / mois"
                max={plan.maxDocumentsPerMonth}
              />
              <UsageBar
                current={usage.sirenSearches}
                label="SIREN / mois"
                max={plan.maxSirenSearchesPerMonth}
              />
              <UsageBar current={usage.companies} label="Entreprises" max={plan.maxCompanies} />
            </div>
          </Panel>

          <Panel title="Fonctionnalités incluses">
            <ul className="grid gap-2 sm:grid-cols-2">
              {Object.entries(plan.features).map(([key, enabled]) => (
                <li className="flex items-center gap-2 text-sm text-slate-700" key={key}>
                  <Badge variant={enabled ? 'success' : 'default'}>
                    {enabled ? '✓' : '—'}
                  </Badge>
                  {formatFeatureLabel(key)}
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </>
  );
}

function UsageBar({ label, current, max }: { label: string; current: number; max: number | null }) {
  const unlimited = max === null;
  const percent = unlimited ? 0 : Math.min(100, (current / Math.max(max, 1)) * 100);

  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-slate-700">{label}</span>
        <span className="text-slate-500">
          {current}
          {unlimited ? '' : ` / ${max}`}
          {unlimited ? ' · ∞' : ''}
        </span>
      </div>
      {!unlimited ? (
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
        </div>
      ) : null}
    </div>
  );
}

function formatFeatureLabel(key: string): string {
  const labels: Record<string, string> = {
    custom_logo: 'Logo personnalisé',
    company_signature: 'Signature entreprise',
    client_signature: 'Signature client',
    pdf_templates: 'Modèles PDF',
    stripe_payments: 'Paiements Stripe',
    ai_assistant: 'Assistant IA',
    advanced_stats: 'Statistiques avancées',
    siren_search: 'Recherche SIREN / SIRET',
  };
  return labels[key] ?? key;
}
