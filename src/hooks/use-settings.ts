import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useTenant } from '@/hooks/use-tenant';
import { requireScope } from '@/lib/tenant/scope';
import {
  fetchSettings,
  mapSettingsToFormValues,
  updateDocumentTemplates,
  updateSettings,
} from '@/lib/supabase/settings';
import { settingsQueryKeys } from '@/lib/supabase/query-keys';
import { createDefaultSettingsFormValues, type SettingsFormValues } from '@/types/settings';

export function useSettings() {
  const { scope } = useTenant();

  return useQuery({
    queryKey: settingsQueryKeys.byCompany(scope?.companyId ?? ''),
    queryFn: async () => {
      const activeScope = requireScope(scope);
      const settings = await fetchSettings(activeScope);
      return settings ? mapSettingsToFormValues(settings) : createDefaultSettingsFormValues();
    },
    enabled: Boolean(scope?.companyId),
  });
}

export function useUpdateSettings() {
  const { scope } = useTenant();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: SettingsFormValues) => updateSettings(requireScope(scope), values),
    onSuccess: () => {
      if (scope?.companyId) {
        queryClient.invalidateQueries({ queryKey: settingsQueryKeys.byCompany(scope.companyId) });
      }
    },
  });
}

export function useUpdateDocumentTemplates() {
  const { scope } = useTenant();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (templates: { quoteTemplateId: string; invoiceTemplateId: string }) =>
      updateDocumentTemplates(requireScope(scope), templates),
    onSuccess: () => {
      if (scope?.companyId) {
        queryClient.invalidateQueries({ queryKey: settingsQueryKeys.byCompany(scope.companyId) });
      }
    },
  });
}
