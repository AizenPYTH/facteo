'use client';

import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/providers/auth-provider';
import { useTenant } from '@/providers/company-provider';
import { fetchInvoiceById } from '@/lib/domain/supabase/invoices';
import { invoicesQueryKeys } from '@/lib/domain/supabase/query-keys';
import { requireScope } from '@/lib/domain/tenant/scope';

export function useInvoiceDetail(invoiceId: string | null) {
  const { user, loading: authLoading } = useAuth();
  const { scope, loading: tenantLoading } = useTenant();

  return useQuery({
    queryKey: invoicesQueryKeys.detail(scope?.companyId ?? '', invoiceId ?? ''),
    queryFn: () => fetchInvoiceById(requireScope(scope), invoiceId!),
    enabled: Boolean(invoiceId && scope?.companyId && user?.id && !authLoading && !tenantLoading),
  });
}
