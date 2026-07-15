'use client';

import { useInfiniteQuery } from '@tanstack/react-query';

import { useAuth } from '@/providers/auth-provider';
import { useTenant } from '@/providers/company-provider';
import { fetchClientsPage } from '@/lib/domain/supabase/clients';
import { clientsQueryKeys } from '@/lib/domain/supabase/query-keys';
import { requireScope } from '@/lib/domain/tenant/scope';
import { CLIENTS_PAGE_SIZE } from '@facteo/types/clients-list';

export function useInfiniteClients(search: string) {
  const { user, loading: authLoading } = useAuth();
  const { scope, loading: tenantLoading, isSwitching } = useTenant();

  return useInfiniteQuery({
    queryKey: clientsQueryKeys.infiniteList(scope?.companyId ?? 'anonymous', search),
    queryFn: ({ pageParam = 0 }) =>
      fetchClientsPage(requireScope(scope), { search, page: pageParam, pageSize: CLIENTS_PAGE_SIZE }),
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
