import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { CheckoutPlanId } from '@/lib/stripe/subscription-checkout';
import { useAuth } from '@/hooks/use-auth';
import {
  isBillingPortalConfigured,
  isSubscriptionCheckoutCanceledError,
  isSubscriptionCheckoutConfigured,
  openBillingPortal,
  startPremiumCheckoutFlow,
} from '@/lib/stripe/subscription-checkout';
import { subscriptionQueryKeys } from '@/lib/supabase/query-keys';

export function usePremiumCheckout() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  async function invalidateSubscription() {
    if (!user?.id) {
      return;
    }

    await queryClient.invalidateQueries({
      queryKey: subscriptionQueryKeys.snapshot(user.id),
    });
    await queryClient.invalidateQueries({
      queryKey: subscriptionQueryKeys.plans(),
    });
  }

  const subscribe = useMutation({
    mutationFn: (planId: CheckoutPlanId) => startPremiumCheckoutFlow(planId),
    onSuccess: async () => {
      await invalidateSubscription();
    },
  });

  const portal = useMutation({
    mutationFn: () => openBillingPortal(),
    onSuccess: async () => {
      await invalidateSubscription();
    },
  });

  async function startCheckout(planId: CheckoutPlanId): Promise<boolean> {
    try {
      await subscribe.mutateAsync(planId);
      return true;
    } catch (error) {
      if (isSubscriptionCheckoutCanceledError(error)) {
        return false;
      }

      throw error;
    }
  }

  async function manageSubscription(): Promise<void> {
    await portal.mutateAsync();
  }

  return {
    isConfigured: isSubscriptionCheckoutConfigured(),
    isPortalConfigured: isBillingPortalConfigured(),
    subscribe,
    portal,
    startCheckout,
    manageSubscription,
    isSubscriptionCheckoutCanceledError,
  };
}
