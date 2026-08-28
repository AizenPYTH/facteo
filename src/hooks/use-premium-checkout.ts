import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Platform } from 'react-native';

import { useAuth } from '@/hooks/use-auth';
import {
  isApplePurchaseCanceledError,
  isAppleSubscriptionConfirmConfigured,
  restoreApplePremiumPurchases,
  startApplePremiumPurchase,
} from '@/lib/iap/apple-subscription';
import {
  isSubscriptionCheckoutCanceledError,
  isSubscriptionCheckoutConfigured,
  startPremiumCheckoutFlow,
} from '@/lib/stripe/subscription-checkout';
import { subscriptionQueryKeys } from '@/lib/supabase/query-keys';

export function usePremiumCheckout() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const usesAppleIap = Platform.OS === 'ios';

  const subscribe = useMutation({
    mutationFn: async () => {
      if (usesAppleIap) {
        return startApplePremiumPurchase();
      }

      return startPremiumCheckoutFlow('premium');
    },
    onSuccess: async () => {
      if (!user?.id) {
        return;
      }

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
      if (!usesAppleIap) {
        return null;
      }

      return restoreApplePremiumPurchases();
    },
    onSuccess: async (result) => {
      if (!result || !user?.id) {
        return;
      }

      await queryClient.invalidateQueries({
        queryKey: subscriptionQueryKeys.snapshot(user.id),
      });
      await queryClient.invalidateQueries({
        queryKey: subscriptionQueryKeys.plans(),
      });
    },
  });

  async function startCheckout(): Promise<boolean> {
    try {
      await subscribe.mutateAsync();
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
