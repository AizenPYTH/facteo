'use client';

import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/providers/auth-provider';
import { useTenant } from '@/providers/company-provider';
import { fetchClientById } from '@/lib/domain/supabase/clients';
import { clientsQueryKeys } from '@/lib/domain/supabase/query-keys';
import { requireScope } from '@/lib/domain/tenant/scope';

export function useClientDetail(clientId: string | null) {
  const { user, loading: authLoading } = useAuth();
  const { scope, loading: tenantLoading } = useTenant();

  return useQuery({
    queryKey: clientsQueryKeys.detail(scope?.companyId ?? '', clientId ?? ''),
    queryFn: () => fetchClientById(requireScope(scope), clientId!),
    enabled: Boolean(clientId && scope?.companyId && user?.id && !authLoading && !tenantLoading),
  });
}
