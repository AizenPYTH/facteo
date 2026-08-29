import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Platform } from 'react-native';

import { useAuth } from '@/hooks/use-auth';
import {
  fetchAppleStoreProducts,
  isAppleIapConfigured,
  purchasePremium,
  restorePurchases,
} from '@/lib/iap/apple-iap';
import { subscriptionQueryKeys } from '@/lib/supabase/query-keys';

/** Pont React Query pour le catalogue, l'achat et la restauration StoreKit. */
export function useApplePremiumPurchase() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const products = useQuery({
    queryKey: ['apple-store-products'],
    queryFn: fetchAppleStoreProducts,
    enabled: Platform.OS === 'ios',
    staleTime: 5 * 60_000,
    retry: 1,
  });

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
    products,
    purchase,
    restore,
  };
}
