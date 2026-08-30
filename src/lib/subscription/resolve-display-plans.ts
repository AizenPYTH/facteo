import type { SubscriptionPlan } from '@/types/subscription';

/**
 * Catalogue actif : micro / basique / standard / pro / max.
 * Les lignes legacy (free / premium / …) restent en lecture pour migrations.
 */
export function resolveCatalogPlans(plans: SubscriptionPlan[]): SubscriptionPlan[] {
  const order = ['micro', 'basique', 'standard', 'pro', 'max'] as const;
  const byId = new Map(plans.map((plan) => [plan.id, plan]));
  return order
    .map((id) => byId.get(id))
    .filter((plan): plan is SubscriptionPlan => Boolean(plan?.isActive));
}

/** @deprecated Préférer resolveCatalogPlans — micro gratuit. */
export function resolveStandardPlan(plans: SubscriptionPlan[]): SubscriptionPlan | undefined {
  return (
    plans.find((plan) => plan.id === 'micro') ??
    plans.find((plan) => plan.id === 'free') ??
    plans.find((plan) => plan.id === 'basique')
  );
}

/** @deprecated Préférer le plan courant via effectivePlanId. */
export function resolvePremiumPlan(plans: SubscriptionPlan[]): SubscriptionPlan | undefined {
  return (
    plans.find((plan) => plan.id === 'pro') ??
    plans.find((plan) => plan.id === 'max') ??
    plans.find((plan) => plan.id === 'standard') ??
    plans.find((plan) => Boolean(plan.appStoreProductId))
  );
}
