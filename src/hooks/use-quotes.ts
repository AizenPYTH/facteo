import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { useAuth } from '@/hooks/use-auth';
import { fetchQuotesPage } from '@/lib/supabase/quotes';
import { quotesQueryKeys } from '@/lib/supabase/query-keys';
import type { QuotesPage } from '@/types/quotes-list';

export function useInfiniteQuotes(search = '') {
  const { user, loading: authLoading } = useAuth();

  const query = useInfiniteQuery<QuotesPage>({
    queryKey: quotesQueryKeys.infiniteList(user?.id ?? 'anonymous', search),
    queryFn: ({ pageParam }) =>
      fetchQuotesPage(user!.id, { search, page: pageParam as number }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextPage ?? undefined,
    enabled: Boolean(user?.id) && !authLoading,
    placeholderData: keepPreviousData,
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
