'use client';

import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/providers/auth-provider';
import { useTenant } from '@/providers/company-provider';
import { fetchSettings, mapSettingsToFormValues } from '@/lib/supabase/settings';
import { settingsQueryKeys } from '@/lib/domain/supabase/query-keys';
import { requireScope } from '@/lib/domain/tenant/scope';
import { createDefaultSettingsFormValues } from '@/types/settings';

export function useSettings() {
  const { user, loading: authLoading } = useAuth();
  const { scope, loading: tenantLoading, isSwitching } = useTenant();

  const query = useQuery({
    queryKey: settingsQueryKeys.byCompany(scope?.companyId ?? 'anonymous'),
    queryFn: async () => {
      const data = await fetchSettings(requireScope(scope));
      return data;
    },
    enabled:
      Boolean(scope?.companyId) &&
      Boolean(user?.id) &&
      !authLoading &&
      !tenantLoading &&
      !isSwitching,
  });

  return {
    settings: query.data,
    formValues: query.data
      ? mapSettingsToFormValues(query.data)
      : createDefaultSettingsFormValues(),
    loading: authLoading || tenantLoading || isSwitching || query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
