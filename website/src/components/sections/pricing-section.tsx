'use client';

import { useState, type ElementType } from 'react';
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

import { Button } from '@/components/ui/button';
import { Stagger, StaggerItem } from '@/components/ui/fade-in';
import { APP_REGISTER_URL } from '@/lib/constants';
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
} from '@/lib/subscription-plans';

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

function PlanPrice({ plan, interval }: { plan: SubscriptionPlan; interval: BillingInterval }) {
  const price = getPlanPrice(plan, interval);
  const showYearly = interval === 'yearly' && plan.priceYearlyMonthlyHt != null;
  const savings = getYearlySavingsPercent(plan);

  return (
    <div className="mt-5 min-h-[5.5rem]">
      <AnimatePresence mode="wait">
        <motion.div
          key={`${plan.id}-${interval}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}>
          <div className="flex items-baseline gap-1.5">
            <span className="text-4xl font-bold tracking-tight text-foreground">
              {formatPriceHt(price).replace(' HT', '')}
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
            <p className="mt-1.5 text-xs text-muted">Facturation mensuelle</p>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function PlanCard({ plan, interval }: { plan: SubscriptionPlan; interval: BillingInterval }) {
  const inheritLabel = getInheritLabel(plan);
  const badge = plan.badge ?? (plan.highlighted ? SUBSCRIPTION_PRICING_COPY.popularBadge : null);

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

      <PlanPrice interval={interval} plan={plan} />

      <div className="mt-6 w-full [&_a]:w-full [&_div]:w-full">
        <Button
          href={APP_REGISTER_URL}
          variant={plan.highlighted ? 'primary' : 'secondary'}>
          {plan.cta}
        </Button>
      </div>

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
  const [billingInterval, setBillingInterval] = useState<BillingInterval>('monthly');
  const maxSavings = getMaxYearlySavingsPercent();

  return (
    <div className="w-full">
      {showHeader ? (
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold text-foreground">{SUBSCRIPTION_PRICING_COPY.title}</h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted">{SUBSCRIPTION_PRICING_COPY.subtitle}</p>
        </div>
      ) : null}

      <div className="mb-10 flex justify-center">
        <BillingToggle
          interval={billingInterval}
          onChange={setBillingInterval}
          savingsPercent={maxSavings}
        />
      </div>

      <Stagger className="mx-auto grid max-w-6xl gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {SUBSCRIPTION_PLANS.map((plan) => (
          <StaggerItem key={plan.id}>
            <PlanCard interval={billingInterval} plan={plan} />
          </StaggerItem>
        ))}
      </Stagger>
    </div>
  );
}
