'use client';

import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/providers/auth-provider';
import { useTenant } from '@/providers/company-provider';
import { fetchQuoteById } from '@/lib/domain/supabase/quotes';
import { quotesQueryKeys } from '@/lib/domain/supabase/query-keys';
import { requireScope } from '@/lib/domain/tenant/scope';

export function useQuoteDetail(quoteId: string | null) {
  const { user, loading: authLoading } = useAuth();
  const { scope, loading: tenantLoading } = useTenant();

  return useQuery({
    queryKey: quotesQueryKeys.detail(scope?.companyId ?? '', quoteId ?? ''),
    queryFn: () => fetchQuoteById(requireScope(scope), quoteId!),
    enabled: Boolean(quoteId && scope?.companyId && user?.id && !authLoading && !tenantLoading),
  });
}
