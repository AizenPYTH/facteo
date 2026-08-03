import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/hooks/use-auth';
import {
  isSubscriptionCheckoutCanceledError,
  isSubscriptionCheckoutConfigured,
  startSubscriptionCheckoutFlow,
  type BillingInterval,
  type PaidPlanId,
} from '@/lib/stripe/subscription-checkout';
import { subscriptionQueryKeys } from '@/lib/supabase/query-keys';

export function useSubscriptionCheckout() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const subscribe = useMutation({
    mutationFn: (input: {
      planId: PaidPlanId;
      interval?: BillingInterval;
      promotionCode?: string;
    }) =>
      startSubscriptionCheckoutFlow(input.planId, {
        interval: input.interval,
        promotionCode: input.promotionCode,
      }),
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

  async function startCheckout(input: {
    planId: PaidPlanId;
    interval?: BillingInterval;
    promotionCode?: string;
  }): Promise<boolean> {
    try {
      await subscribe.mutateAsync(input);
      return true;
    } catch (error) {
      if (isSubscriptionCheckoutCanceledError(error)) {
        return false;
      }

      throw error;
    }
  }

  return {
    isConfigured: isSubscriptionCheckoutConfigured(),
    subscribe,
    startCheckout,
    isSubscriptionCheckoutCanceledError,
  };
}

/** @deprecated Prefer useSubscriptionCheckout */
export function usePremiumCheckout() {
  const checkout = useSubscriptionCheckout();
  return {
    ...checkout,
    startCheckout: (promotionCode?: string) =>
      checkout.startCheckout({ planId: 'pro', promotionCode }),
  };
}
