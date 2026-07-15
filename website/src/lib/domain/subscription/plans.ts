import type { PlanFeatureKey, PlanFeatures, SubscriptionPlanId } from '@/types/subscription';

export const DEFAULT_PLAN_FEATURES: Record<'free' | 'premium', PlanFeatures> = {
  free: {
    custom_logo: false,
    company_signature: false,
    client_signature: false,
    stripe_payments: false,
    ai_assistant: false,
    advanced_stats: false,
    siren_search: false,
  },
  premium: {
    custom_logo: true,
    company_signature: true,
    client_signature: true,
    stripe_payments: true,
    ai_assistant: true,
    advanced_stats: true,
    siren_search: true,
  },
};

export function resolveEffectivePlanId(plan: SubscriptionPlanId): 'free' | 'premium' {
  return plan === 'free' ? 'free' : 'premium';
}

export function isPremiumPlan(plan: SubscriptionPlanId): boolean {
  return resolveEffectivePlanId(plan) === 'premium';
}

export function hasPlanFeature(
  features: PlanFeatures | undefined,
  feature: PlanFeatureKey,
  effectivePlanId: 'free' | 'premium' = 'free',
): boolean {
  if (features && feature in features) {
    return Boolean(features[feature]);
  }

  return DEFAULT_PLAN_FEATURES[effectivePlanId][feature];
}

export function formatPlanLimit(limit: number | null): string {
  return limit === null ? 'Illimité' : String(limit);
}
