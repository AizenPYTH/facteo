import { useQuery } from '@tanstack/react-query';

import { useTenant } from '@/hooks/use-tenant';
import { requireScope } from '@/lib/tenant/scope';
import { fetchInvoicesForClient } from '@/lib/supabase/invoices';
import { fetchQuotesForClient } from '@/lib/supabase/quotes';
import { clientsQueryKeys } from '@/lib/supabase/query-keys';
import type { Invoice } from '@/types/invoice';
import type { Quote } from '@/types/quote';

export type ClientDocuments = {
  quotes: Quote[];
  invoices: Invoice[];
};

export function useClientDocuments(clientId: string) {
  const { scope, loading: tenantLoading, isSwitching } = useTenant();

  return useQuery<ClientDocuments>({
    queryKey: clientsQueryKeys.documents(scope?.companyId ?? 'anonymous', clientId),
    queryFn: async () => {
      const resolved = requireScope(scope);
      const [quotes, invoices] = await Promise.all([
        fetchQuotesForClient(resolved, clientId),
        fetchInvoicesForClient(resolved, clientId),
      ]);
      return { quotes, invoices };
    },
    enabled: Boolean(scope?.companyId) && Boolean(clientId) && !tenantLoading && !isSwitching,
    staleTime: 30_000,
  });
}
