import { useInfiniteQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { useTenant } from '@/hooks/use-tenant';
import { requireScope } from '@/lib/tenant/scope';
import { fetchQuotesPage } from '@/lib/supabase/quotes';
import { quotesQueryKeys } from '@/lib/supabase/query-keys';
import type { QuoteStatusFilter, QuotesPage } from '@/types/quotes-list';

export function useInfiniteQuotes(search = '', status: QuoteStatusFilter = 'all') {
  const { scope, loading: tenantLoading, isSwitching } = useTenant();

  const query = useInfiniteQuery<QuotesPage>({
    queryKey: quotesQueryKeys.infiniteList(scope?.companyId ?? 'anonymous', search, status),
    queryFn: ({ pageParam }) =>
      fetchQuotesPage(requireScope(scope), { search, status, page: pageParam as number }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextPage ?? undefined,
    enabled: Boolean(scope?.companyId) && !tenantLoading && !isSwitching,
    staleTime: 30_000,
  });

  const quotes = useMemo(
    () => query.data?.pages.flatMap((page) => page.quotes) ?? [],
    [query.data?.pages],
  );

  return {
    ...query,
    quotes,
  };
}
