import type {
  EffectivePlanId,
  PlanFeatureKey,
  PlanFeatures,
  SubscriptionPlanId,
} from '@/types/subscription';

export const DEFAULT_PLAN_FEATURES: Record<EffectivePlanId, PlanFeatures> = {
  micro: {
    custom_logo: false,
    company_signature: false,
    client_signature: false,
    pdf_templates: false,
    stripe_payments: false,
    ai_assistant: false,
    advanced_stats: false,
    siren_search: false,
  },
  basique: {
    custom_logo: true,
    company_signature: true,
    client_signature: false,
    pdf_templates: true,
    stripe_payments: false,
    ai_assistant: false,
    advanced_stats: false,
    siren_search: true,
  },
  standard: {
    custom_logo: true,
    company_signature: true,
    client_signature: true,
    pdf_templates: true,
    stripe_payments: false,
    ai_assistant: false,
    advanced_stats: false,
    siren_search: true,
  },
  pro: {
    custom_logo: true,
    company_signature: true,
    client_signature: true,
    pdf_templates: true,
    stripe_payments: false,
    ai_assistant: false,
    advanced_stats: false,
    siren_search: true,
  },
  max: {
    custom_logo: true,
    company_signature: true,
    client_signature: true,
    pdf_templates: true,
    stripe_payments: true,
    ai_assistant: true,
    advanced_stats: true,
    siren_search: true,
  },
};

/** Mappe l’enum legacy subscriptions.plan vers le catalogue actif. */
export function resolveEffectivePlanId(plan: SubscriptionPlanId | string): EffectivePlanId {
  if (plan === 'free' || plan === 'micro') return 'micro';
  if (plan === 'basique') return 'basique';
  if (plan === 'standard') return 'standard';
  if (plan === 'max') return 'max';
  if (plan === 'pro' || plan === 'premium' || plan === 'starter' || plan === 'enterprise') {
    return 'pro';
  }
  return 'micro';
}

export function getEffectivePlanDisplayName(planId: EffectivePlanId | string): string {
  switch (resolveEffectivePlanId(planId)) {
    case 'basique':
      return 'Basique';
    case 'standard':
      return 'Standard';
    case 'pro':
      return 'Pro';
    case 'max':
      return 'Max';
    default:
      return 'Micro';
  }
}

export function isPaidPlan(plan: SubscriptionPlanId | EffectivePlanId | string): boolean {
  return resolveEffectivePlanId(plan) !== 'micro';
}

/** @deprecated Préférer isPaidPlan */
export function isPremiumPlan(plan: SubscriptionPlanId): boolean {
  return isPaidPlan(plan);
}

export function hasPlanFeature(
  features: PlanFeatures | undefined,
  feature: PlanFeatureKey,
  effectivePlanId: EffectivePlanId = 'micro',
): boolean {
  if (features && feature in features) {
    return Boolean(features[feature]);
  }

  return DEFAULT_PLAN_FEATURES[effectivePlanId][feature];
}

export function formatPlanLimit(limit: number | null): string {
  return limit === null ? 'Illimité' : String(limit);
}
