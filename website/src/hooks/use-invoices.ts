'use client';

import { useInfiniteQuery } from '@tanstack/react-query';

import { useAuth } from '@/providers/auth-provider';
import { useTenant } from '@/providers/company-provider';
import { fetchInvoicesPage } from '@/lib/domain/supabase/invoices';
import { invoicesQueryKeys } from '@/lib/domain/supabase/query-keys';
import { requireScope } from '@/lib/domain/tenant/scope';
import { INVOICES_PAGE_SIZE, type InvoiceStatusFilter } from '@factume/types/invoices-list';

export function useInfiniteInvoices(search: string, status: InvoiceStatusFilter = 'all') {
  const { user, loading: authLoading } = useAuth();
  const { scope, loading: tenantLoading, isSwitching } = useTenant();

  return useInfiniteQuery({
    queryKey: invoicesQueryKeys.infiniteList(scope?.companyId ?? 'anonymous', search, status),
    queryFn: ({ pageParam = 0 }) =>
      fetchInvoicesPage(requireScope(scope), {
        search,
        status,
        page: pageParam,
        pageSize: INVOICES_PAGE_SIZE,
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
