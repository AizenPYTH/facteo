import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { useTenant } from '@/hooks/use-tenant';
import { requireScope } from '@/lib/tenant/scope';
import { fetchClientById, fetchClientsPage } from '@/lib/supabase/clients';
import { clientsQueryKeys } from '@/lib/supabase/query-keys';
import type { Client } from '@/types/client';
import type { ClientsPage } from '@/types/clients-list';

export function useInfiniteClients(search = '') {
  const { scope, loading: tenantLoading, isSwitching } = useTenant();

  const query = useInfiniteQuery<ClientsPage>({
    queryKey: clientsQueryKeys.infiniteList(scope?.companyId ?? 'anonymous', search),
    queryFn: ({ pageParam }) =>
      fetchClientsPage(requireScope(scope), { search, page: pageParam as number }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextPage ?? undefined,
    enabled: Boolean(scope?.companyId) && !tenantLoading && !isSwitching,
    staleTime: 30_000,
  });

  const clients = useMemo(
    () => query.data?.pages.flatMap((page) => page.clients) ?? [],
    [query.data?.pages],
  );

  return {
    ...query,
    clients,
  };
}

export function useClient(clientId: string) {
  const { scope, loading: tenantLoading, isSwitching } = useTenant();

  return useQuery<Client | null>({
    queryKey: clientsQueryKeys.detail(scope?.companyId ?? 'anonymous', clientId),
    queryFn: () => fetchClientById(requireScope(scope), clientId),
    enabled: Boolean(scope?.companyId) && Boolean(clientId) && !tenantLoading && !isSwitching,
  });
}
