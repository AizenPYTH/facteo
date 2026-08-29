import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/hooks/use-auth';
import {
  isAppleIapConfigured,
  purchasePremium,
  restorePurchases,
} from '@/lib/iap/apple-iap';
import { subscriptionQueryKeys } from '@/lib/supabase/query-keys';

/**
 * Pont React Query pour l'achat / la restauration Apple IAP — voir
 * `src/lib/iap/apple-iap.ts` pour l'état d'intégration StoreKit (open item).
 */
export function useApplePremiumPurchase() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  async function invalidateSubscriptionQueries() {
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

  const purchase = useMutation({
    mutationFn: (appStoreProductId: string | null) => purchasePremium(appStoreProductId),
    onSuccess: invalidateSubscriptionQueries,
  });

  const restore = useMutation({
    mutationFn: () => restorePurchases(),
    onSuccess: invalidateSubscriptionQueries,
  });

  return {
    isConfigured: isAppleIapConfigured(),
    purchase,
    restore,
  };
}
