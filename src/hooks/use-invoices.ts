import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { useTenant } from '@/hooks/use-tenant';
import { requireScope } from '@/lib/tenant/scope';
import {
  fetchInvoiceById,
  fetchInvoiceStatusCounts,
  fetchInvoicesPage,
} from '@/lib/supabase/invoices';
import { invoicesQueryKeys } from '@/lib/supabase/query-keys';
import type { InvoiceStatusFilter, InvoicesPage } from '@/types/invoices-list';

export function useInvoice(invoiceId: string) {
  const { scope, loading: tenantLoading, isSwitching } = useTenant();

  return useQuery({
    queryKey: invoicesQueryKeys.detail(scope?.companyId ?? '', invoiceId),
    queryFn: () => fetchInvoiceById(requireScope(scope), invoiceId),
    enabled: Boolean(scope?.companyId && invoiceId) && !tenantLoading && !isSwitching,
  });
}

export function useInvoiceStatusCounts() {
  const { scope, loading: tenantLoading, isSwitching } = useTenant();

  return useQuery({
    queryKey: [...invoicesQueryKeys.all, 'status-counts', scope?.companyId ?? 'anonymous'],
    queryFn: () => fetchInvoiceStatusCounts(requireScope(scope)),
    enabled: Boolean(scope?.companyId) && !tenantLoading && !isSwitching,
    staleTime: 30_000,
  });
}

export function useInfiniteInvoices(search = '', status: InvoiceStatusFilter = 'all') {
  const { scope, loading: tenantLoading, isSwitching } = useTenant();

  const query = useInfiniteQuery<InvoicesPage>({
    queryKey: invoicesQueryKeys.infiniteList(scope?.companyId ?? 'anonymous', search, status),
    queryFn: ({ pageParam }) =>
      fetchInvoicesPage(requireScope(scope), { search, status, page: pageParam as number }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextPage ?? undefined,
    enabled: Boolean(scope?.companyId) && !tenantLoading && !isSwitching,
    staleTime: 30_000,
  });

  const invoices = useMemo(
    () => query.data?.pages.flatMap((page) => page.invoices) ?? [],
    [query.data?.pages],
  );

  return {
    ...query,
    invoices,
  };
}
