import type { SubscriptionPlan } from '@/types/subscription';

/**
 * Le catalogue actif expose micro / basique / standard / pro.
 * L’écran Abonnement compare « Standard » (gratuit) et « Premium » (payant).
 * Les lignes legacy `free` / `premium` sont désactivées (`is_active = false`)
 * et n’apparaissent plus dans `fetchSubscriptionPlans()`.
 */
export function resolveStandardPlan(plans: SubscriptionPlan[]): SubscriptionPlan | undefined {
  return (
    plans.find((plan) => plan.id === 'micro') ??
    plans.find((plan) => plan.id === 'free') ??
    plans.find((plan) => plan.id === 'basique' && !plan.appStoreProductId)
  );
}

export function resolvePremiumPlan(plans: SubscriptionPlan[]): SubscriptionPlan | undefined {
  return (
    plans.find((plan) => plan.id === 'premium') ??
    plans.find((plan) => plan.id === 'pro') ??
    plans.find((plan) => plan.id === 'standard') ??
    plans.find((plan) => Boolean(plan.appStoreProductId))
  );
}
