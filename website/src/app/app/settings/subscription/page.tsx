'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { PrimaryButton, SecondaryButton } from '@/components/app/form-fields';
import { Badge, LoadingState, Panel, StatCard } from '@/components/app/ui';
import { useAuth } from '@/providers/auth-provider';
import { useToast } from '@/providers/toast-provider';
import { fetchSubscriptionSnapshot } from '@/lib/domain/supabase/subscriptions';
import { subscriptionQueryKeys } from '@/lib/domain/supabase/query-keys';
import { formatDate } from '@/lib/domain/format/date';
import { toUserFacingError } from '@/lib/errors/messages';
import { SUPPORT_EMAIL } from '@/lib/constants';
import {
  confirmSubscriptionCheckout,
  createBillingPortalSession,
  isSubscriptionCheckoutConfigured,
  startWebSubscriptionCheckout,
  type PaidCheckoutPlanId,
} from '@/lib/stripe/subscription-checkout';
import {
  formatPriceHt,
  getInheritLabel,
  SUBSCRIPTION_PLANS,
  type SubscriptionPlan,
  type SubscriptionPlanId,
} from '@/lib/subscription-plans';
import { PLAN_FEATURE_LABELS } from '@/types/subscription';
import { cn } from '@/lib/utils';

const PLAN_RANK: Record<SubscriptionPlanId, number> = {
  micro: 0,
  basique: 1,
  standard: 2,
  pro: 3,
};

const STATUS_LABELS: Record<string, string> = {
  active: 'Actif',
  trialing: 'Essai',
  past_due: 'Paiement en retard',
  canceled: 'Résilié',
  unpaid: 'Impayé',
  incomplete: 'Incomplet',
};

export default function SubscriptionSettingsPage() {
  return (
    <Suspense fallback={<LoadingState message="Chargement de l’abonnement…" />}>
      <SubscriptionSettingsContent />
    </Suspense>
  );
}

function SubscriptionSettingsContent() {
  const { user } = useAuth();
  const { showSuccess, showError, showInfo } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const confirmStarted = useRef(false);
  const [busyPlanId, setBusyPlanId] = useState<string | null>(null);

  const query = useQuery({
    queryKey: subscriptionQueryKeys.snapshot(user?.id ?? ''),
    queryFn: () => fetchSubscriptionSnapshot(user!.id),
    enabled: Boolean(user?.id),
  });

  useEffect(() => {
    const outcome = searchParams.get('subscription');
    const sessionId = searchParams.get('session_id') ?? searchParams.get('sessionId');

    if (!outcome || confirmStarted.current) {
      return;
    }
    confirmStarted.current = true;

    async function finishReturn() {
      try {
        if (outcome === 'canceled') {
          showInfo('Paiement annulé. Vous pouvez réessayer quand vous voulez.');
          return;
        }

        if (outcome === 'success') {
          if (!sessionId) {
            showError('Session Stripe introuvable après le paiement.');
            return;
          }
          await confirmSubscriptionCheckout(sessionId);
          if (user?.id) {
            await queryClient.invalidateQueries({
              queryKey: subscriptionQueryKeys.snapshot(user.id),
            });
          }
          showSuccess('Abonnement activé. Merci !');
        }
      } catch (error) {
        showError(toUserFacingError(error instanceof Error ? error.message : ''));
      } finally {
        router.replace('/app/settings/subscription');
      }
    }

    void finishReturn();
  }, [queryClient, router, searchParams, showError, showInfo, showSuccess, user?.id]);

  async function refreshSnapshot() {
    if (!user?.id) return;
    await queryClient.invalidateQueries({ queryKey: subscriptionQueryKeys.snapshot(user.id) });
    await queryClient.invalidateQueries({ queryKey: subscriptionQueryKeys.plans() });
  }

  async function handleSubscribe(planId: PaidCheckoutPlanId) {
    if (!isSubscriptionCheckoutConfigured()) {
      showError('Paiement Stripe non configuré sur ce site.');
      return;
    }

    setBusyPlanId(planId);
    try {
      const result = await startWebSubscriptionCheckout(planId);
      if (result === 'updated') {
        await refreshSnapshot();
        showSuccess('Offre mise à jour.');
      }
    } catch (error) {
      showError(toUserFacingError(error instanceof Error ? error.message : ''));
    } finally {
      setBusyPlanId(null);
    }
  }

  async function handlePortal() {
    setBusyPlanId('portal');
    try {
      const { portalUrl } = await createBillingPortalSession();
      window.location.assign(portalUrl);
    } catch (error) {
      showError(toUserFacingError(error instanceof Error ? error.message : ''));
      setBusyPlanId(null);
    }
  }

  if (query.isLoading) {
    return <LoadingState message="Chargement de l’abonnement…" />;
  }

  if (query.error || !query.data) {
    return (
      <div className="mx-auto max-w-[960px] p-5 sm:p-6">
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
  const currentPlanId = (plan.id as SubscriptionPlanId) || subscription.effectivePlanId;
  const hasStripeBilling = Boolean(subscription.stripeCustomerId);
  const paidWithoutStripe =
    currentPlanId !== 'micro' &&
    !subscription.stripeSubscriptionId &&
    (subscription.status === 'active' || subscription.status === 'trialing');

  return (
    <div className="mx-auto max-w-[960px] space-y-4 p-5 sm:p-6">
      <div>
        <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-app-text">
          Offre et paiement
        </h2>
        <p className="mt-1 text-[13px] text-app-muted">
          Choisissez une offre et payez en ligne par carte (Stripe). Abonnement mensuel, sans
          engagement. Sur iPhone, les abonnements de l’app passent uniquement par l’App Store.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard accent="primary" label="Offre actuelle" value={plan.displayName} />
        <StatCard
          accent="muted"
          label="Statut"
          trend={subscription.cancelAtPeriodEnd ? 'Résiliation programmée' : undefined}
          value={STATUS_LABELS[subscription.status] ?? subscription.status}
        />
        <StatCard
          accent="success"
          label="Prochain renouvellement"
          value={subscription.currentPeriodEnd ? formatDate(subscription.currentPeriodEnd) : '—'}
        />
      </div>

      {paidWithoutStripe ? (
        <Panel>
          <p className="text-[13px] text-app-text-2">
            Cette offre n’est pas facturée via Stripe (souvent un abonnement App Store). Ne payez
            pas une seconde fois sur le web tant que l’abonnement iOS est actif.
          </p>
        </Panel>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {SUBSCRIPTION_PLANS.map((offer) => (
          <OfferCard
            busy={busyPlanId === offer.id}
            currentPlanId={currentPlanId}
            disabled={Boolean(busyPlanId)}
            key={offer.id}
            offer={offer}
            onSubscribe={() => {
              if (offer.id === 'micro') return;
              void handleSubscribe(offer.id);
            }}
          />
        ))}
      </div>

      <Panel title="Utilisation">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <UsageBar current={usage.documents} label="Documents ce mois-ci" max={plan.maxDocumentsPerMonth} />
          <UsageBar
            current={usage.sirenSearches}
            label="Recherches SIREN"
            max={plan.maxSirenSearchesPerMonth}
          />
          <UsageBar current={usage.companies} label="Entreprises" max={plan.maxCompanies} />
          <UsageBar current={usage.clients} label="Clients" max={plan.maxClients} />
          <UsageBar current={usage.quotes} label="Devis" max={plan.maxQuotes} />
          <UsageBar current={usage.invoices} label="Factures" max={plan.maxInvoices} />
        </div>
      </Panel>

      <Panel title="Fonctionnalités incluses">
        <ul className="grid gap-2 sm:grid-cols-2">
          {Object.entries(plan.features).map(([key, enabled]) => (
            <li className="flex items-center gap-2 text-[13px] text-app-text-2" key={key}>
              <Badge variant={enabled ? 'success' : 'default'}>{enabled ? '✓' : '—'}</Badge>
              {PLAN_FEATURE_LABELS[key as keyof typeof PLAN_FEATURE_LABELS] ?? key}
            </li>
          ))}
        </ul>
      </Panel>

      <Panel>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[13px] text-app-text-2">
            Carte, factures Stripe et résiliation se gèrent dans le portail de paiement. Besoin
            d’aide ?{' '}
            <a className="font-medium text-app-accent hover:underline" href={`mailto:${SUPPORT_EMAIL}`}>
              {SUPPORT_EMAIL}
            </a>
          </p>
          {hasStripeBilling ? (
            <SecondaryButton disabled={Boolean(busyPlanId)} onClick={() => void handlePortal()}>
              {busyPlanId === 'portal' ? 'Ouverture…' : 'Gérer la facturation'}
            </SecondaryButton>
          ) : null}
        </div>
      </Panel>
    </div>
  );
}

function OfferCard({
  offer,
  currentPlanId,
  busy,
  disabled,
  onSubscribe,
}: {
  offer: SubscriptionPlan;
  currentPlanId: SubscriptionPlanId | string;
  busy: boolean;
  disabled: boolean;
  onSubscribe: () => void;
}) {
  const isCurrent = offer.id === currentPlanId;
  const inheritLabel = getInheritLabel(offer);
  const currentRank = PLAN_RANK[currentPlanId as SubscriptionPlanId] ?? 0;
  const targetRank = PLAN_RANK[offer.id];
  const paid = offer.id !== 'micro';

  let cta = offer.cta;
  if (isCurrent) {
    cta = 'Offre actuelle';
  } else if (offer.id === 'micro') {
    cta = 'Offre gratuite';
  } else if (targetRank > currentRank) {
    cta = `Passer à ${offer.name}`;
  } else {
    cta = `Revenir à ${offer.name}`;
  }

  return (
    <div
      className={cn(
        'flex h-full flex-col rounded-[14px] border bg-app-surface p-4',
        isCurrent ? 'border-app-accent ring-1 ring-app-accent/20' : 'border-app-border',
      )}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-[14.5px] font-semibold text-app-text">{offer.name}</h3>
          <p className="mt-1 text-[12.5px] leading-relaxed text-app-muted">{offer.description}</p>
        </div>
        {isCurrent ? <Badge variant="success">Actuelle</Badge> : null}
      </div>

      <p className="mt-4 text-[22px] font-semibold tracking-[-0.03em] text-app-text">
        {formatPriceHt(offer.priceMonthlyHt).replace(' HT', '')}
        <span className="ml-1 text-[12px] font-medium text-app-muted">/ mois HT</span>
      </p>

      <ul className="mt-4 flex flex-1 flex-col gap-1.5 text-[12.5px] text-app-text-2">
        {inheritLabel ? <li className="font-medium text-app-text">{inheritLabel} +</li> : null}
        {offer.features.slice(0, 4).map((feature) => (
          <li key={feature.id}>{feature.label}</li>
        ))}
      </ul>

      <div className="mt-4">
        {paid && !isCurrent ? (
          <PrimaryButton
            className="w-full"
            disabled={disabled}
            onClick={onSubscribe}
            type="button">
            {busy ? 'Redirection…' : cta}
          </PrimaryButton>
        ) : (
          <SecondaryButton className="w-full" disabled type="button">
            {cta}
          </SecondaryButton>
        )}
      </div>
    </div>
  );
}

function UsageBar({ label, current, max }: { label: string; current: number; max: number | null }) {
  const unlimited = max === null;
  const disabled = max === 0;
  const percent = unlimited || disabled ? 0 : Math.min(100, (current / Math.max(max, 1)) * 100);

  return (
    <div className="rounded-[12px] border border-app-border p-4">
      <div className="flex items-center justify-between text-[13px]">
        <span className="font-medium text-app-text-2">{label}</span>
        <span className="app-num text-app-muted">
          {disabled ? 'Non inclus' : unlimited ? `${current}` : `${current} / ${max}`}
        </span>
      </div>
      {unlimited ? (
        <p className="mt-2 text-[12px] text-app-success-text">Illimité</p>
      ) : disabled ? (
        <p className="mt-2 text-[12px] text-app-muted">Passez à une offre supérieure</p>
      ) : (
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-app-border-soft">
          <div className="h-full rounded-full bg-app-accent" style={{ width: `${percent}%` }} />
        </div>
      )}
    </div>
  );
}
