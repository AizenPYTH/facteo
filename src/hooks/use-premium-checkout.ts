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

export function usePremiumCheckout() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const subscribe = useMutation({
    mutationFn: (input?: string | { planId?: PaidPlanId; interval?: BillingInterval; promotionCode?: string }) => {
      if (typeof input === 'string' || input === undefined) {
        return startSubscriptionCheckoutFlow('pro', { promotionCode: input });
      }
      return startSubscriptionCheckoutFlow(input.planId ?? 'pro', {
        interval: input.interval,
        promotionCode: input.promotionCode,
      });
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

  async function startCheckout(
    planOrCode?: PaidPlanId | string,
    options?: { interval?: BillingInterval; promotionCode?: string },
  ): Promise<boolean> {
    const paidPlans: PaidPlanId[] = ['basique', 'standard', 'pro', 'max'];
    const isPlan = typeof planOrCode === 'string' && paidPlans.includes(planOrCode as PaidPlanId);
    const planId = (isPlan ? planOrCode : 'pro') as PaidPlanId;
    const promotionCode = isPlan ? options?.promotionCode : planOrCode;

    try {
      await subscribe.mutateAsync({
        planId,
        interval: options?.interval,
        promotionCode,
      });
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
