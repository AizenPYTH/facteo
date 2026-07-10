import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { useAuth } from '@/hooks/use-auth';
import { fetchProductsPage } from '@/lib/supabase/products';
import { productsQueryKeys } from '@/lib/supabase/query-keys';
import type { ProductsPage } from '@/types/products-list';

export function useInfiniteProducts(search = '') {
  const { user, loading: authLoading } = useAuth();

  const query = useInfiniteQuery<ProductsPage>({
    queryKey: productsQueryKeys.infiniteList(user?.id ?? 'anonymous', search),
    queryFn: ({ pageParam }) =>
      fetchProductsPage(user!.id, { search, page: pageParam as number }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextPage ?? undefined,
    enabled: Boolean(user?.id) && !authLoading,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });

  const products = useMemo(
    () => query.data?.pages.flatMap((page) => page.products) ?? [],
    [query.data?.pages],
  );

  return {
    ...query,
    products,
  };
}
