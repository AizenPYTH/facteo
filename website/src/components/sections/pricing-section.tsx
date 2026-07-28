'use client';

import { useEffect, useMemo, useState, type ElementType } from 'react';
import {
  Archive,
  BarChart3,
  Building2,
  Check,
  FileStack,
  FileText,
  LayoutTemplate,
  Mail,
  Package,
  PenLine,
  RefreshCw,
  Search,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Stagger, StaggerItem } from '@/components/ui/fade-in';
import { APP_LOGIN_URL, APP_REGISTER_URL } from '@/lib/constants';
import { cn } from '@/lib/utils';
import {
  formatPriceHt,
  getInheritLabel,
  getMaxYearlySavingsPercent,
  getPlanPrice,
  getYearlySavingsPercent,
  SUBSCRIPTION_PLANS,
  SUBSCRIPTION_PRICING_COPY,
  type BillingInterval,
  type PlanFeatureIcon,
  type SubscriptionPlan,
  type SubscriptionPlanId,
} from '@/lib/subscription-plans';
import {
  fetchStripeSubscriptionPrices,
  isSubscriptionCheckoutConfigured,
  startSubscriptionCheckoutRedirect,
  type PaidPlanId,
} from '@/lib/stripe/subscription-checkout';
import { useAuth } from '@/providers/auth-provider';

const FEATURE_ICONS: Record<PlanFeatureIcon, ElementType> = {
  file: FileText,
  catalog: Package,
  users: Users,
  tracking: FileStack,
  mail: Mail,
  chart: BarChart3,
  pdf: FileText,
  templates: LayoutTemplate,
  company: Building2,
  signature: PenLine,
  stats: TrendingUp,
  building: Building2,
  recurring: RefreshCw,
  archive: Archive,
  ai: Sparkles,
  search: Search,
  check: Check,
};

function BillingToggle({
  interval,
  onChange,
  savingsPercent,
}: {
  interval: BillingInterval;
  onChange: (value: BillingInterval) => void;
  savingsPercent: number;
}) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="relative grid w-full max-w-md grid-cols-2 rounded-full border border-border bg-slate-100/80 p-1 shadow-inner"
        role="group"
        aria-label="Périodicité de facturation">
        <motion.span
          aria-hidden
          className="absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-full bg-white shadow-sm"
          initial={false}
          animate={{ left: interval === 'monthly' ? 4 : '50%' }}
          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
        />
        <button
          type="button"
          className={cn(
            'relative z-10 rounded-full px-4 py-2.5 text-sm font-semibold transition-colors',
            interval === 'monthly' ? 'text-foreground' : 'text-muted hover:text-foreground',
          )}
          onClick={() => onChange('monthly')}
          aria-pressed={interval === 'monthly'}>
          {SUBSCRIPTION_PRICING_COPY.monthlyLabel}
        </button>
        <button
          type="button"
          className={cn(
            'relative z-10 flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition-colors',
            interval === 'yearly' ? 'text-foreground' : 'text-muted hover:text-foreground',
          )}
          onClick={() => onChange('yearly')}
          aria-pressed={interval === 'yearly'}>
          {SUBSCRIPTION_PRICING_COPY.yearlyLabel}
          {savingsPercent > 0 ? (
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
              −{savingsPercent} %
            </span>
          ) : null}
        </button>
      </div>
      <AnimatePresence mode="wait">
        {interval === 'yearly' && savingsPercent > 0 ? (
          <motion.p
            key="yearly-hint"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="text-sm text-emerald-700">
            Économisez jusqu’à {savingsPercent}&nbsp;% avec l’abonnement annuel
          </motion.p>
        ) : (
          <motion.p
            key="monthly-hint"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="text-sm text-muted">
            {SUBSCRIPTION_PRICING_COPY.vatNote}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

function centsToEuros(cents: number): number {
  return cents / 100;
}

function PlanPrice({
  plan,
  interval,
  stripeAmount,
}: {
  plan: SubscriptionPlan;
  interval: BillingInterval;
  stripeAmount: number | null;
}) {
  const fallback = getPlanPrice(plan, interval);
  const amount = stripeAmount ?? fallback;
  const showYearly = interval === 'yearly' && plan.priceYearlyMonthlyHt != null;
  const savings = getYearlySavingsPercent(plan);
  const fromStripe = stripeAmount != null;

  return (
    <div className="mt-5 min-h-[5.5rem]">
      <AnimatePresence mode="wait">
        <motion.div
          key={`${plan.id}-${interval}-${amount}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}>
          <div className="flex items-baseline gap-1.5">
            <span className="text-4xl font-bold tracking-tight text-foreground">
              {formatPriceHt(amount).replace(' HT', '')}
            </span>
            <span className="text-sm text-muted">
              {SUBSCRIPTION_PRICING_COPY.perMonthLabel} HT
            </span>
          </div>
          {showYearly ? (
            <p className="mt-1.5 text-xs text-muted">
              {SUBSCRIPTION_PRICING_COPY.yearlyBilledHint}
              {savings ? (
                <span className="ml-1.5 font-medium text-emerald-700">· −{savings}&nbsp;%</span>
              ) : null}
            </p>
          ) : plan.priceMonthlyHt === 0 ? (
            <p className="mt-1.5 text-xs text-muted">Sans carte bancaire</p>
          ) : (
            <p className="mt-1.5 text-xs text-muted">
              {fromStripe ? 'Prix Stripe' : 'Facturation mensuelle'}
            </p>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function PlanCard({
  plan,
  interval,
  stripeAmount,
  loadingPlanId,
  onSelect,
  promotionCode,
}: {
  plan: SubscriptionPlan;
  interval: BillingInterval;
  stripeAmount: number | null;
  loadingPlanId: string | null;
  onSelect: (planId: SubscriptionPlanId) => void;
  promotionCode: string;
}) {
  const inheritLabel = getInheritLabel(plan);
  const badge = plan.badge ?? (plan.highlighted ? SUBSCRIPTION_PRICING_COPY.popularBadge : null);
  const isPaid = plan.id !== 'micro';
  const loading = loadingPlanId === plan.id;

  return (
    <div
      className={cn(
        'card-hover relative flex h-full flex-col rounded-2xl border bg-surface p-6 lg:p-7',
        plan.highlighted
          ? 'border-primary shadow-xl shadow-primary/15 ring-1 ring-primary/20 lg:-mt-2 lg:mb-2 lg:scale-[1.02]'
          : 'border-border shadow-sm shadow-slate-900/5',
      )}>
      {badge ? (
        <span className="absolute -top-3 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white shadow-md shadow-primary/25">
          {badge}
        </span>
      ) : null}

      <div>
        <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-muted">{plan.description}</p>
      </div>

      <PlanPrice interval={interval} plan={plan} stripeAmount={stripeAmount} />

      <div className="mt-6 w-full">
        {isPaid ? (
          <button
            className={cn(
              'inline-flex w-full items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold transition disabled:opacity-60',
              plan.highlighted
                ? 'bg-primary text-white shadow-lg shadow-primary/25 hover:bg-primary-dark'
                : 'border border-border bg-white text-foreground hover:border-primary/40',
            )}
            disabled={loading}
            onClick={() => onSelect(plan.id)}
            type="button">
            {loading ? 'Redirection Stripe…' : plan.cta}
          </button>
        ) : (
          <Button href={APP_REGISTER_URL} variant="secondary">
            {plan.cta}
          </Button>
        )}
      </div>

      {isPaid && promotionCode ? (
        <p className="mt-2 text-center text-[11px] text-muted">Code promo : {promotionCode}</p>
      ) : null}

      <ul className="mt-6 flex flex-1 flex-col gap-3 border-t border-border pt-6">
        {inheritLabel ? (
          <li className="flex items-start gap-2.5 text-sm font-medium text-foreground">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Check size={12} strokeWidth={3} />
            </span>
            <span>{inheritLabel} +</span>
          </li>
        ) : null}
        {plan.features.map((feature) => {
          const Icon = FEATURE_ICONS[feature.icon] ?? Check;
          return (
            <li className="flex items-start gap-2.5 text-sm text-foreground" key={feature.id}>
              <span
                className={cn(
                  'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full',
                  feature.comingSoon ? 'bg-slate-100 text-muted' : 'bg-primary/10 text-primary',
                )}>
                <Icon size={12} strokeWidth={2.5} />
              </span>
              <span className="flex flex-wrap items-center gap-2">
                {feature.label}
                {feature.comingSoon ? (
                  <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
                    {SUBSCRIPTION_PRICING_COPY.comingSoonBadge}
                  </span>
                ) : null}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

type PricingSectionProps = {
  showHeader?: boolean;
};

export function PricingSection({ showHeader = false }: PricingSectionProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [billingInterval, setBillingInterval] = useState<BillingInterval>('monthly');
  const [promotionCode, setPromotionCode] = useState('');
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stripeAmounts, setStripeAmounts] = useState<
    Partial<Record<PaidPlanId, { monthly: number | null; yearly: number | null }>>
  >({});
  const maxSavings = getMaxYearlySavingsPercent();
  const checkoutReady = isSubscriptionCheckoutConfigured();

  useEffect(() => {
    void (async () => {
      const payload = await fetchStripeSubscriptionPrices();
      if (!payload) return;
      const next: Partial<Record<PaidPlanId, { monthly: number | null; yearly: number | null }>> =
        {};
      for (const plan of payload.plans) {
        next[plan.planId] = {
          monthly: plan.monthly ? centsToEuros(plan.monthly.unitAmount) : null,
          yearly: plan.yearly?.monthlyEquivalentAmount
            ? centsToEuros(plan.yearly.monthlyEquivalentAmount)
            : null,
        };
      }
      setStripeAmounts(next);
    })();
  }, []);

  async function handleSelect(planId: SubscriptionPlanId) {
    setError(null);
    if (planId === 'micro') {
      router.push(APP_REGISTER_URL);
      return;
    }

    if (!user) {
      router.push(
        `${APP_LOGIN_URL}?redirect=${encodeURIComponent(`/tarifs?plan=${planId}&interval=${billingInterval}`)}`,
      );
      return;
    }

    if (!checkoutReady) {
      setError('Le paiement n’est pas encore disponible. Réessayez plus tard.');
      return;
    }

    setLoadingPlanId(planId);
    try {
      await startSubscriptionCheckoutRedirect(planId as PaidPlanId, {
        interval: billingInterval,
        promotionCode: promotionCode.trim() || undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.');
      setLoadingPlanId(null);
    }
  }

  const stripeHint = useMemo(
    () => Object.keys(stripeAmounts).length > 0,
    [stripeAmounts],
  );

  return (
    <div className="w-full">
      {showHeader ? (
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold text-foreground">{SUBSCRIPTION_PRICING_COPY.title}</h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted">{SUBSCRIPTION_PRICING_COPY.subtitle}</p>
        </div>
      ) : null}

      <div className="mb-6 flex justify-center">
        <BillingToggle
          interval={billingInterval}
          onChange={setBillingInterval}
          savingsPercent={maxSavings}
        />
      </div>

      <div className="mx-auto mb-8 max-w-md">
        <label className="mb-1.5 block text-sm font-medium text-foreground" htmlFor="promo-code">
          Code promotionnel Stripe
        </label>
        <input
          className="w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          id="promo-code"
          onChange={(e) => setPromotionCode(e.target.value.toUpperCase())}
          placeholder="Ex. WELCOME20 — ou saisissez-le aussi sur Stripe Checkout"
          type="text"
          value={promotionCode}
        />
        <p className="mt-1.5 text-xs text-muted">
          Les codes créés dans Stripe (Promotion codes) sont acceptés ici et sur la page Checkout.
        </p>
      </div>

      {stripeHint ? (
        <p className="mb-6 text-center text-xs text-muted">Montants synchronisés depuis Stripe.</p>
      ) : null}

      {error ? (
        <p className="mb-6 text-center text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      <Stagger className="mx-auto grid max-w-7xl gap-5 sm:grid-cols-2 xl:grid-cols-5">
        {SUBSCRIPTION_PLANS.map((plan) => {
          const paidId = plan.id as PaidPlanId;
          const stripeAmount =
            plan.id === 'micro'
              ? 0
              : billingInterval === 'yearly'
                ? (stripeAmounts[paidId]?.yearly ?? null)
                : (stripeAmounts[paidId]?.monthly ?? null);

          return (
            <StaggerItem key={plan.id}>
              <PlanCard
                interval={billingInterval}
                loadingPlanId={loadingPlanId}
                onSelect={handleSelect}
                plan={plan}
                promotionCode={promotionCode}
                stripeAmount={stripeAmount}
              />
            </StaggerItem>
          );
        })}
      </Stagger>
    </div>
  );
}
