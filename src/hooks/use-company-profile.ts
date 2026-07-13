import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/hooks/use-auth';
import { useTenant } from '@/hooks/use-tenant';
import { supabase } from '@/lib/supabase';
import { fetchCompanyById, mapCompanyToFormValues, updateCompanyProfile } from '@/lib/supabase/companies';
import { fetchUserProfile } from '@/lib/supabase/profiles';
import { requireScope } from '@/lib/tenant/scope';
import { dashboardQueryKeys, profilesQueryKeys } from '@/lib/supabase/query-keys';
import type { CompanyProfileFormValues } from '@/types/company-profile';

export function useCompanyProfile() {
  const { user, loading: authLoading } = useAuth();
  const { scope, loading: tenantLoading } = useTenant();

  return useQuery<CompanyProfileFormValues>({
    queryKey: profilesQueryKeys.company(scope?.companyId ?? 'anonymous'),
    queryFn: async () => {
      const activeScope = requireScope(scope);
      const [company, profile] = await Promise.all([
        fetchCompanyById(activeScope.companyId),
        fetchUserProfile(activeScope.userId),
      ]);

      return mapCompanyToFormValues(
        company,
        profile?.first_name ?? '',
        profile?.last_name ?? '',
        user!.email ?? null,
      );
    },
    enabled: Boolean(scope?.companyId) && Boolean(user?.id) && !authLoading && !tenantLoading,
  });
}

export function useUpdateCompanyProfile() {
  const { user } = useAuth();
  const { scope } = useTenant();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CompanyProfileFormValues) => {
      const activeScope = requireScope(scope);
      const company = await updateCompanyProfile(activeScope.companyId, input);

      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: input.firstName.trim(),
          last_name: input.lastName.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', activeScope.userId);

      if (error) {
        throw error;
      }

      return mapCompanyToFormValues(
        company,
        input.firstName,
        input.lastName,
        user?.email ?? null,
      );
    },
    onSuccess: () => {
      if (scope?.companyId) {
        queryClient.invalidateQueries({ queryKey: profilesQueryKeys.company(scope.companyId) });
      }

      queryClient.invalidateQueries({ queryKey: profilesQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.all });
    },
  });
}
