import { keepPreviousData, useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { useAuth } from '@/hooks/use-auth';
import { fetchClientById, fetchClientsPage } from '@/lib/supabase/clients';
import { clientsQueryKeys } from '@/lib/supabase/query-keys';
import type { Client } from '@/types/client';
import type { ClientsPage } from '@/types/clients-list';

export function useInfiniteClients(search = '') {
  const { user, loading: authLoading } = useAuth();

  const query = useInfiniteQuery<ClientsPage>({
    queryKey: clientsQueryKeys.infiniteList(user?.id ?? 'anonymous', search),
    queryFn: ({ pageParam }) =>
      fetchClientsPage(user!.id, { search, page: pageParam as number }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextPage ?? undefined,
    enabled: Boolean(user?.id) && !authLoading,
    placeholderData: keepPreviousData,
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
  const { user, loading: authLoading } = useAuth();

  return useQuery<Client | null>({
    queryKey: clientsQueryKeys.detail(user?.id ?? 'anonymous', clientId),
    queryFn: () => fetchClientById(user!.id, clientId),
    enabled: Boolean(user?.id) && Boolean(clientId) && !authLoading,
  });
}
