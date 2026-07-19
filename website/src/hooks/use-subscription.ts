'use client';

import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/providers/auth-provider';
import { hasPlanFeature } from '@/lib/subscription/plans';
import {
  fetchSubscriptionPlans,
  fetchSubscriptionSnapshot,
} from '@/lib/domain/supabase/subscriptions';
import { subscriptionQueryKeys } from '@/lib/domain/supabase/query-keys';
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

  const snapshot = snapshotQuery.data;
  const subscription = snapshot?.subscription ?? null;
  const plan = snapshot?.plan ?? null;
  const usage = snapshot?.usage ?? null;
  const isPremium = Boolean(subscription && subscription.effectivePlanId !== 'micro');

  function hasFeature(feature: PlanFeatureKey): boolean {
    if (!subscription || !plan) {
      return false;
    }

    return hasPlanFeature(plan.features, feature, subscription.effectivePlanId);
  }

  function getLimit(resource: PlanResource): number | null {
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
      case 'documents':
        return plan.maxDocumentsPerMonth;
      case 'companies':
        return plan.maxCompanies;
      case 'siren_searches':
        return plan.maxSirenSearchesPerMonth;
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
    hasFeature,
    getLimit,
    refresh: snapshotQuery.refetch,
  };
}
