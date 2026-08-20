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

/**
 * Identité 1:1 vers le catalogue canonique.
 * Legacy (free/starter/premium/enterprise) uniquement pour lignes non migrées.
 */
export function resolveEffectivePlanId(plan: SubscriptionPlanId | string): EffectivePlanId {
  switch (plan) {
    case 'micro':
      return 'micro';
    case 'basique':
      return 'basique';
    case 'standard':
      return 'standard';
    case 'pro':
      return 'pro';
    case 'max':
      return 'max';
    case 'free':
      return 'micro';
    case 'starter':
      return 'basique';
    case 'premium':
      return 'pro';
    case 'enterprise':
      return 'max';
    default:
      return 'micro';
  }
}

export function getEffectivePlanDisplayName(
  plan: SubscriptionPlanId | EffectivePlanId | string,
): string {
  switch (resolveEffectivePlanId(plan)) {
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

export const PLAN_RANK: Record<EffectivePlanId, number> = {
  micro: 0,
  basique: 1,
  standard: 2,
  pro: 3,
  max: 4,
};

export function isPlanAtLeast(
  current: EffectivePlanId | string,
  required: EffectivePlanId,
): boolean {
  return PLAN_RANK[resolveEffectivePlanId(current)] >= PLAN_RANK[required];
}
