import { useQuery } from '@tanstack/react-query';
import { Platform } from 'react-native';

import {
  fetchAppleStoreProducts,
  type AppleStoreProductInfo,
} from '@/lib/iap/apple-subscription';

export function useAppleStoreProducts() {
  const enabled = Platform.OS === 'ios';

  const query = useQuery({
    queryKey: ['apple-store-products'],
    queryFn: fetchAppleStoreProducts,
    enabled,
    staleTime: 5 * 60_000,
    retry: 1,
  });

  const products = (query.data ?? []) as AppleStoreProductInfo[];
  const byPlanId = Object.fromEntries(products.map((product) => [product.planId, product])) as Partial<
    Record<AppleStoreProductInfo['planId'], AppleStoreProductInfo>
  >;

  return {
    products,
    byPlanId,
    isLoading: enabled && query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
