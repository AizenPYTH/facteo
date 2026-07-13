import { useQuery } from '@tanstack/react-query';

import { useTenant } from '@/hooks/use-tenant';
import { requireScope } from '@/lib/tenant/scope';
import { fetchQuoteById } from '@/lib/supabase/quotes';
import { quotesQueryKeys } from '@/lib/supabase/query-keys';

export function useQuote(quoteId: string) {
  const { scope, loading: tenantLoading } = useTenant();

  return useQuery({
    queryKey: quotesQueryKeys.detail(scope?.companyId ?? '', quoteId),
    queryFn: () => fetchQuoteById(requireScope(scope), quoteId),
    enabled: Boolean(scope?.companyId && quoteId) && !tenantLoading,
  });
}
