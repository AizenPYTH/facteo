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
    ai_assistant: true,
    advanced_stats: false,
    siren_search: true,
  },
  standard: {
    custom_logo: true,
    company_signature: true,
    client_signature: true,
    pdf_templates: true,
    stripe_payments: true,
    ai_assistant: true,
    advanced_stats: true,
    siren_search: true,
  },
  pro: {
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
  if (plan === 'pro' || plan === 'premium' || plan === 'starter' || plan === 'enterprise') {
    return 'pro';
  }
  return 'micro';
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
  const defaults = DEFAULT_PLAN_FEATURES[effectivePlanId];

  // Les plans payés débloquent Photo IA / assistant même si la ligne DB
  // `four_plans` a laissé `ai_assistant: false` par erreur.
  if (feature === 'ai_assistant' && effectivePlanId !== 'micro') {
    return true;
  }

  if (features && feature in features) {
    const fromDb = Boolean(features[feature]);
    // Ne pas laisser un `false` DB écraser un droit payant attendu côté app.
    if (!fromDb && defaults[feature]) {
      return true;
    }
    return fromDb;
  }

  return defaults[feature];
}

export function formatPlanLimit(limit: number | null): string {
  return limit === null ? 'Illimité' : String(limit);
}
