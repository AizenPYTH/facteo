import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/hooks/use-auth';
import { useDeveloperMode } from '@/providers/developer-mode-provider';
import { applyDeveloperModeUnlock } from '@/lib/dev/apply-subscription-override';
import { hasPlanFeature } from '@/lib/subscription/plans';
import {
  fetchSubscriptionPlans,
  fetchSubscriptionSnapshot,
} from '@/lib/supabase/subscriptions';
import { subscriptionQueryKeys } from '@/lib/supabase/query-keys';
import type { PlanFeatureKey, PlanResource } from '@/types/subscription';

export function useSubscriptionSnapshot() {
  const { user } = useAuth();

  return useQuery({
    queryKey: subscriptionQueryKeys.snapshot(user?.id ?? 'anonymous'),
    queryFn: () => {
      if (!user?.id) {
        throw new Error('User must be authenticated.');
      }

      return fetchSubscriptionSnapshot(user.id);
    },
    enabled: Boolean(user?.id),
    staleTime: 30_000,
  });
}

export function useSubscriptionPlans() {
  return useQuery({
    queryKey: subscriptionQueryKeys.plans(),
    queryFn: fetchSubscriptionPlans,
    staleTime: 5 * 60_000,
  });
}

export function useSubscription() {
  const snapshotQuery = useSubscriptionSnapshot();
  const plansQuery = useSubscriptionPlans();
  const { isEnabled: isDeveloperModeEnabled } = useDeveloperMode();

  const snapshot = snapshotQuery.data;
  const isDevUnlocked = isDeveloperModeEnabled && Boolean(snapshot);

  const effectiveSnapshot =
    isDevUnlocked && plansQuery.data
      ? applyDeveloperModeUnlock(snapshot!, plansQuery.data)
      : isDevUnlocked
        ? applyDeveloperModeUnlock(snapshot!, snapshot!.plan ? [snapshot!.plan] : [])
        : snapshot;

  const subscription = effectiveSnapshot?.subscription ?? null;
  const plan = effectiveSnapshot?.plan ?? null;
  const usage = effectiveSnapshot?.usage ?? null;
  const isPremium = isDevUnlocked || subscription?.effectivePlanId === 'premium';

  function hasFeature(feature: PlanFeatureKey): boolean {
    if (isDevUnlocked) {
      return true;
    }

    if (!subscription || !plan) {
      return false;
    }

    return hasPlanFeature(plan.features, feature, subscription.effectivePlanId);
  }

  function getLimit(resource: PlanResource): number | null {
    if (isDevUnlocked) {
      return null;
    }

    if (!plan) {
      return null;
    }

    switch (resource) {
      case 'clients':
        return plan.maxClients;
      case 'quotes':
        return plan.maxQuotes;
      case 'invoices':
        return plan.maxInvoices;
      default:
        return null;
    }
  }

  return {
    ...snapshotQuery,
    subscription,
    plan,
    usage,
    isPremium,
    isDeveloperModeEnabled: isDevUnlocked,
    hasFeature,
    getLimit,
    refresh: snapshotQuery.refetch,
  };
}
