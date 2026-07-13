import { DEFAULT_PLAN_FEATURES } from '@/lib/subscription/plans';
import type { SubscriptionPlan, SubscriptionSnapshot, UserSubscription } from '@/types/subscription';

export function applyDeveloperModeUnlock(
  snapshot: SubscriptionSnapshot,
  plans: SubscriptionPlan[],
): SubscriptionSnapshot {
  const premiumPlan =
    plans.find((entry) => entry.id === 'premium') ??
    ({
      ...snapshot.plan,
      id: 'premium',
      displayName: 'FACTEO Premium',
    } as SubscriptionPlan);

  const subscription: UserSubscription = {
    ...snapshot.subscription,
    effectivePlanId: 'premium',
    plan: 'premium',
    status: 'active',
  };

  const plan: SubscriptionPlan = {
    ...premiumPlan,
    maxClients: null,
    maxQuotes: null,
    maxInvoices: null,
    features: {
      ...DEFAULT_PLAN_FEATURES.premium,
      ...premiumPlan.features,
    },
  };

  return {
    subscription,
    plan,
    usage: snapshot.usage,
  };
}
