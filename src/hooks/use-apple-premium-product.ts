import { useQuery } from '@tanstack/react-query';
import { Platform } from 'react-native';

import {
  fetchApplePremiumProduct,
  type ApplePremiumProductInfo,
} from '@/lib/iap/apple-subscription';

export function useApplePremiumProduct() {
  const enabled = Platform.OS === 'ios';

  const query = useQuery({
    queryKey: ['apple-premium-product'],
    queryFn: fetchApplePremiumProduct,
    enabled,
    staleTime: 5 * 60_000,
    retry: 1,
  });

  return {
    product: (query.data ?? null) as ApplePremiumProductInfo | null,
    isLoading: enabled && query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
