'use client';

import { useInfiniteQuery } from '@tanstack/react-query';

import { useAuth } from '@/providers/auth-provider';
import { useTenant } from '@/providers/company-provider';
import { fetchQuotesPage } from '@/lib/domain/supabase/quotes';
import { quotesQueryKeys } from '@/lib/domain/supabase/query-keys';
import { requireScope } from '@/lib/domain/tenant/scope';
import { QUOTES_PAGE_SIZE, type QuoteStatusFilter } from '@facteo/types/quotes-list';

export function useInfiniteQuotes(search: string, status: QuoteStatusFilter = 'all') {
  const { user, loading: authLoading } = useAuth();
  const { scope, loading: tenantLoading, isSwitching } = useTenant();

  return useInfiniteQuery({
    queryKey: quotesQueryKeys.infiniteList(scope?.companyId ?? 'anonymous', search, status),
    queryFn: ({ pageParam = 0 }) =>
      fetchQuotesPage(requireScope(scope), {
        search,
        status,
        page: pageParam,
        pageSize: QUOTES_PAGE_SIZE,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextPage,
    enabled:
      Boolean(scope?.companyId) &&
      Boolean(user?.id) &&
      !authLoading &&
      !tenantLoading &&
      !isSwitching,
  });
}
