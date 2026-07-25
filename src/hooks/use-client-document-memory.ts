import { useQuery } from '@tanstack/react-query';

import { useTenant } from '@/hooks/use-tenant';
import { requireScope } from '@/lib/tenant/scope';
import {
  fetchClientDocumentMemory,
  type ClientDocumentMemory,
} from '@/lib/supabase/client-document-memory';
import { clientsQueryKeys } from '@/lib/supabase/query-keys';

const emptyMemory: ClientDocumentMemory = {
  suggestions: [],
  lastDocument: null,
  defaults: {
    paymentTermsDays: null,
    vatRate: null,
    notes: null,
    discountPercent: null,
  },
};

export function useClientDocumentMemory(clientId: string | null | undefined) {
  const { scope, loading: tenantLoading, isSwitching } = useTenant();
  const id = clientId?.trim() ?? '';

  return useQuery({
    queryKey: clientsQueryKeys.memory(scope?.companyId ?? 'anonymous', id || 'none'),
    queryFn: () => fetchClientDocumentMemory(requireScope(scope), id),
    enabled: Boolean(scope?.companyId) && Boolean(id) && !tenantLoading && !isSwitching,
    staleTime: 60_000,
    placeholderData: emptyMemory,
  });
}
