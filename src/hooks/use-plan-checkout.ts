import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Platform } from 'react-native';

import type { ApplePaidPlanId } from '@/constants/iap';
import { PAID_CATALOG_PLAN_IDS, type CatalogPlanId } from '@/constants/subscription-catalog';
import { useAuth } from '@/hooks/use-auth';
import {
  isApplePurchaseCanceledError,
  isAppleSubscriptionConfirmConfigured,
  restoreApplePlanPurchases,
  startApplePlanPurchase,
} from '@/lib/iap/apple-subscription';
import {
  isSubscriptionCheckoutCanceledError,
  isSubscriptionCheckoutConfigured,
  startPlanCheckoutFlow,
} from '@/lib/stripe/subscription-checkout';
import { subscriptionQueryKeys } from '@/lib/supabase/query-keys';

function isApplePaidPlan(planId: CatalogPlanId): planId is ApplePaidPlanId {
  return (PAID_CATALOG_PLAN_IDS as string[]).includes(planId);
}

export function usePlanCheckout() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const usesAppleIap = Platform.OS === 'ios';

  const subscribe = useMutation({
    mutationFn: async (planId: CatalogPlanId) => {
      if (planId === 'micro') {
        throw new Error('Le plan Micro est gratuit.');
      }

      if (usesAppleIap) {
        if (!isApplePaidPlan(planId)) {
          throw new Error(`Plan Apple invalide: ${planId}`);
        }
        return startApplePlanPurchase(planId);
      }

      return startPlanCheckoutFlow(planId);
    },
    onSuccess: async () => {
      if (!user?.id) return;
      await queryClient.invalidateQueries({
        queryKey: subscriptionQueryKeys.snapshot(user.id),
      });
      await queryClient.invalidateQueries({
        queryKey: subscriptionQueryKeys.plans(),
      });
    },
  });

  const restore = useMutation({
    mutationFn: async () => {
      if (!usesAppleIap) return null;
      return restoreApplePlanPurchases();
    },
    onSuccess: async (result) => {
      if (!result || !user?.id) return;
      await queryClient.invalidateQueries({
        queryKey: subscriptionQueryKeys.snapshot(user.id),
      });
      await queryClient.invalidateQueries({
        queryKey: subscriptionQueryKeys.plans(),
      });
    },
  });

  async function startCheckout(planId: CatalogPlanId): Promise<boolean> {
    try {
      await subscribe.mutateAsync(planId);
      return true;
    } catch (error) {
      if (isSubscriptionCheckoutCanceledError(error) || isApplePurchaseCanceledError(error)) {
        return false;
      }
      throw error;
    }
  }

  async function restorePurchases(): Promise<boolean> {
    const result = await restore.mutateAsync();
    return Boolean(result?.isPremium);
  }

  return {
    usesAppleIap,
    isConfigured: usesAppleIap
      ? isAppleSubscriptionConfirmConfigured()
      : isSubscriptionCheckoutConfigured(),
    subscribe,
    restore,
    startCheckout,
    restorePurchases,
    isSubscriptionCheckoutCanceledError,
    isApplePurchaseCanceledError,
  };
}

/** @deprecated Utiliser usePlanCheckout */
export function usePremiumCheckout() {
  const checkout = usePlanCheckout();
  return {
    ...checkout,
    startCheckout: async () => checkout.startCheckout('pro'),
  };
}
