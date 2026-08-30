/**
 * @deprecated Préférer `usePlanCheckout` + `useAppleStoreProducts`.
 * Pont de compatibilité vers le pipeline multi-plan.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Platform } from 'react-native';

import type { ApplePaidPlanId } from '@/constants/iap';
import { planIdFromAppleProductId } from '@/constants/iap';
import { useAuth } from '@/hooks/use-auth';
import { useAppleStoreProducts } from '@/hooks/use-apple-store-products';
import {
  isAppleSubscriptionConfirmConfigured,
  restoreApplePlanPurchases,
  startApplePlanPurchase,
} from '@/lib/iap/apple-subscription';
import { subscriptionQueryKeys } from '@/lib/supabase/query-keys';

export function useApplePremiumPurchase() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const products = useAppleStoreProducts();

  async function invalidateSubscriptionQueries() {
    if (!user?.id) return;
    await queryClient.invalidateQueries({
      queryKey: subscriptionQueryKeys.snapshot(user.id),
    });
    await queryClient.invalidateQueries({
      queryKey: subscriptionQueryKeys.plans(),
    });
  }

  const purchase = useMutation({
    mutationFn: async (appStoreProductId: string | null) => {
      const planId =
        (appStoreProductId ? planIdFromAppleProductId(appStoreProductId) : null) ??
        ('pro' as ApplePaidPlanId);
      return startApplePlanPurchase(planId);
    },
    onSuccess: invalidateSubscriptionQueries,
  });

  const restore = useMutation({
    mutationFn: () => restoreApplePlanPurchases(),
    onSuccess: invalidateSubscriptionQueries,
  });

  return {
    isConfigured: Platform.OS === 'ios' && isAppleSubscriptionConfirmConfigured(),
    products,
    purchase,
    restore,
  };
}
