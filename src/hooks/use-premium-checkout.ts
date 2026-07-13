import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/hooks/use-auth';
import {
  isSubscriptionCheckoutCanceledError,
  isSubscriptionCheckoutConfigured,
  startPremiumCheckoutFlow,
} from '@/lib/stripe/subscription-checkout';
import { subscriptionQueryKeys } from '@/lib/supabase/query-keys';

export function usePremiumCheckout() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const subscribe = useMutation({
    mutationFn: () => startPremiumCheckoutFlow('premium'),
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

  async function startCheckout(): Promise<boolean> {
    try {
      await subscribe.mutateAsync();
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
