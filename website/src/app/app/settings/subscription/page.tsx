'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { Badge, LoadingState, Panel, StatCard } from '@/components/app/ui';
import { useAuth } from '@/providers/auth-provider';
import { fetchSubscriptionSnapshot } from '@/lib/domain/supabase/subscriptions';
import { subscriptionQueryKeys } from '@/lib/domain/supabase/query-keys';
import { formatDate } from '@/lib/domain/format/date';
import { SUPPORT_EMAIL } from '@/lib/constants';
import {
  confirmWebSubscriptionCheckout,
  createWebBillingPortal,
  createWebSubscriptionCheckout,
  getWebSubscriptionReturnUrl,
  isAppleManagedSubscription,
  type PaidCatalogPlanId,
} from '@/lib/domain/stripe/subscription-checkout';
import {
  getEffectivePlanDisplayName,
  PLAN_RANK,
  resolveEffectivePlanId,
} from '@/lib/subscription/plans';
import { SUBSCRIPTION_PLANS, formatPriceHt } from '@/lib/subscription-plans';
import type { EffectivePlanId } from '@/types/subscription';

const PAID_PLANS: PaidCatalogPlanId[] = ['basique', 'standard', 'pro', 'max'];

const PLAN_COPY: Record<
  PaidCatalogPlanId,
  { name: string; price: string; description: string }
> = {
  basique: {
    name: 'Basique',
    price: formatPriceHt(6.82),
    description: 'Documents illimités, modèles et recherche SIREN.',
  },
  standard: {
    name: 'Standard',
    price: formatPriceHt(16.21),
    description: 'Signature électronique et jusqu’à 3 entreprises.',
  },
  pro: {
    name: 'Pro',
    price: formatPriceHt(27.3),
    description: 'Recherche SIREN et entreprises illimitées.',
  },
  max: {
    name: 'Max',
    price: formatPriceHt(63.98),
    description: 'Statistiques avancées, paiements Stripe et assistant IA.',
  },
};

export default function SubscriptionSettingsRoute() {
  return (
    <Suspense fallback={<LoadingState message="Chargement de l’abonnement…" />}>
      <SubscriptionSettingsPage />
    </Suspense>
  );
}

function SubscriptionSettingsPage() {
  const { user, session } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [busyPlan, setBusyPlan] = useState<PaidCatalogPlanId | 'portal' | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const query = useQuery({
    queryKey: subscriptionQueryKeys.snapshot(user?.id ?? ''),
    queryFn: () => fetchSubscriptionSnapshot(user!.id),
    enabled: Boolean(user?.id),
  });

  useEffect(() => {
    const status = searchParams.get('subscription');
    const sessionId = searchParams.get('session_id') ?? searchParams.get('sessionId');
    if (status !== 'success' || !sessionId || !session?.access_token) {
      return;
    }

    let cancelled = false;
    void confirmWebSubscriptionCheckout(session.access_token, sessionId)
      .then(async (result) => {
        if (cancelled) return;
        await queryClient.invalidateQueries({
          queryKey: subscriptionQueryKeys.snapshot(user?.id ?? ''),
        });
        setActionSuccess(`INVEQ ${getEffectivePlanDisplayName(result.planId)} est activé.`);
        router.replace('/app/settings/subscription');
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setActionError(error instanceof Error ? error.message : 'Confirmation Stripe impossible.');
      });

    return () => {
      cancelled = true;
    };
  }, [queryClient, router, searchParams, session?.access_token, user?.id]);

  const currentPlanId = useMemo<EffectivePlanId>(
    () => resolveEffectivePlanId(query.data?.subscription.effectivePlanId ?? 'micro'),
    [query.data?.subscription.effectivePlanId],
  );
  const appleManaged = isAppleManagedSubscription(query.data?.subscription.stripeSubscriptionId);
  const hasStripeCustomer = Boolean(query.data?.subscription.stripeCustomerId) && !appleManaged;

  async function startCheckout(planId: PaidCatalogPlanId) {
    if (!session?.access_token) {
      setActionError('Session expirée. Reconnectez-vous.');
      return;
    }
    setActionError(null);
    setActionSuccess(null);
    setBusyPlan(planId);
    try {
      const checkout = await createWebSubscriptionCheckout(
        session.access_token,
        planId,
        getWebSubscriptionReturnUrl(),
      );
      window.location.assign(checkout.checkoutUrl);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Impossible de démarrer le paiement.');
      setBusyPlan(null);
    }
  }

  async function openPortal() {
    if (!session?.access_token) {
      setActionError('Session expirée. Reconnectez-vous.');
      return;
    }
    setActionError(null);
    setBusyPlan('portal');
    try {
      const portal = await createWebBillingPortal(session.access_token, getWebSubscriptionReturnUrl());
      window.location.assign(portal.portalUrl);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Impossible d’ouvrir le portail Stripe.');
      setBusyPlan(null);
    }
  }

  if (query.isLoading) {
    return <LoadingState message="Chargement de l’abonnement…" />;
  }

  if (query.error || !query.data) {
    return (
      <div className="mx-auto max-w-[720px] p-5 sm:p-6">
        <Panel>
          <p className="text-[13px] text-app-text-2">
            Impossible de charger les informations d’abonnement. Réessayez plus tard ou contactez{' '}
            <a className="text-app-accent hover:underline" href={`mailto:${SUPPORT_EMAIL}`}>
              {SUPPORT_EMAIL}
            </a>
            .
          </p>
        </Panel>
      </div>
    );
  }

  const { subscription, plan, usage } = query.data;

  return (
    <div className="mx-auto max-w-[720px] space-y-4 p-5 sm:p-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard accent="primary" label="Plan" value={plan.displayName} />
        <StatCard
          accent="muted"
          label="Statut"
          trend={
            appleManaged
              ? 'Géré via l’App Store'
              : subscription.cancelAtPeriodEnd
                ? 'Résiliation programmée'
                : undefined
          }
          value={subscription.status}
        />
        <StatCard
          accent="success"
          label="Renouvellement"
          value={subscription.currentPeriodEnd ? formatDate(subscription.currentPeriodEnd) : '—'}
        />
      </div>

      {actionError ? (
        <Panel>
          <p className="text-[13px] text-app-danger-text">{actionError}</p>
        </Panel>
      ) : null}
      {actionSuccess ? (
        <Panel>
          <p className="text-[13px] text-app-success-text">{actionSuccess}</p>
        </Panel>
      ) : null}

      <Panel title="Utilisation">
        <div className="grid gap-4 sm:grid-cols-3">
          <UsageBar
            current={usage.documents}
            label="Documents ce mois"
            max={plan.maxDocumentsPerMonth}
          />
          <UsageBar
            current={usage.sirenSearches}
            label="Recherches SIREN"
            max={plan.maxSirenSearchesPerMonth}
          />
          <UsageBar current={usage.companies} label="Entreprises" max={plan.maxCompanies} />
        </div>
      </Panel>

      <Panel title="Fonctionnalités incluses">
        <ul className="grid gap-2 sm:grid-cols-2">
          {Object.entries(plan.features).map(([key, enabled]) => (
            <li className="flex items-center gap-2 text-[13px] text-app-text-2" key={key}>
              <Badge variant={enabled ? 'success' : 'default'}>{enabled ? '✓' : '—'}</Badge>
              {formatFeatureLabel(key)}
            </li>
          ))}
        </ul>
      </Panel>

      <Panel title="Changer d’offre">
        {appleManaged ? (
          <p className="text-[13px] text-app-text-2">
            Votre abonnement a été souscrit sur iPhone. Pour changer d’offre ou le résilier, ouvrez
            Réglages → Apple ID → Abonnements. Le compte INVEQ reste le même sur le web et l’app.
          </p>
        ) : (
          <div className="grid gap-3">
            {PAID_PLANS.map((planId) => {
              const copy = PLAN_COPY[planId];
              const marketing = SUBSCRIPTION_PLANS.find((entry) => entry.id === planId);
              const current = planId === currentPlanId;
              const isUpgrade = PLAN_RANK[planId] > PLAN_RANK[currentPlanId];
              return (
                <div
                  className="flex flex-col gap-3 rounded-[12px] border border-app-border p-4 sm:flex-row sm:items-center sm:justify-between"
                  key={planId}>
                  <div>
                    <p className="text-[14px] font-semibold text-app-text">
                      {copy.name}
                      {current ? (
                        <span className="ml-2 text-[12px] font-medium text-app-accent">Offre actuelle</span>
                      ) : null}
                    </p>
                    <p className="mt-1 text-[13px] text-app-text-2">{copy.description}</p>
                    <p className="app-num mt-1 text-[13px] text-app-muted">
                      {marketing ? `${formatPriceHt(marketing.priceMonthlyHt)} / mois` : copy.price}
                    </p>
                  </div>
                  <button
                    className="shrink-0 rounded-xl bg-app-accent px-4 py-2 text-[13px] font-semibold text-white disabled:opacity-50"
                    disabled={current || busyPlan !== null}
                    onClick={() => void startCheckout(planId)}
                    type="button">
                    {busyPlan === planId
                      ? 'Redirection…'
                      : current
                        ? 'Actif'
                        : isUpgrade
                          ? `Passer à ${copy.name}`
                          : `Choisir ${copy.name}`}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </Panel>

      <Panel title="Gérer l’abonnement">
        {appleManaged ? (
          <p className="text-[13px] text-app-text-2">
            La facturation Apple se gère uniquement depuis l’iPhone, pas depuis Stripe.
          </p>
        ) : (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[13px] text-app-text-2">
              Cartes, factures Stripe, résiliation et codes promo : portail de paiement sécurisé.
            </p>
            <button
              className="shrink-0 rounded-xl border border-app-border px-4 py-2 text-[13px] font-semibold text-app-text disabled:opacity-50"
              disabled={!hasStripeCustomer || busyPlan !== null}
              onClick={() => void openPortal()}
              type="button">
              {busyPlan === 'portal' ? 'Ouverture…' : 'Gérer mon abonnement'}
            </button>
          </div>
        )}
        <p className="mt-3 text-[12.5px] text-app-muted">
          Voir aussi la page{' '}
          <Link className="font-medium text-app-accent hover:underline" href="/tarifs">
            tarifs
          </Link>
          . Support :{' '}
          <a className="font-medium text-app-accent hover:underline" href={`mailto:${SUPPORT_EMAIL}`}>
            {SUPPORT_EMAIL}
          </a>
          .
        </p>
      </Panel>
    </div>
  );
}

function UsageBar({ label, current, max }: { label: string; current: number; max: number | null }) {
  const unlimited = max === null;
  const percent = unlimited ? 0 : Math.min(100, (current / Math.max(max, 1)) * 100);

  return (
    <div className="rounded-[12px] border border-app-border p-4">
      <div className="flex items-center justify-between text-[13px]">
        <span className="font-medium text-app-text-2">{label}</span>
        <span className="app-num text-app-muted">
          {current}
          {unlimited ? '' : ` / ${max}`}
        </span>
      </div>
      {!unlimited ? (
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-app-border-soft">
          <div className="h-full rounded-full bg-app-accent" style={{ width: `${percent}%` }} />
        </div>
      ) : (
        <p className="mt-2 text-[12px] text-app-success-text">Illimité</p>
      )}
    </div>
  );
}

function formatFeatureLabel(key: string): string {
  const labels: Record<string, string> = {
    custom_logo: 'Logo personnalisé',
    company_signature: 'Signature entreprise',
    client_signature: 'Signature client',
    stripe_payments: 'Paiements Stripe',
    ai_assistant: 'Assistant IA',
    advanced_stats: 'Statistiques avancées',
    siren_search: 'Recherche SIREN',
    pdf_templates: 'Modèles PDF',
  };
  return labels[key] ?? key;
}
