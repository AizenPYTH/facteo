import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/hooks/use-auth';
import { fetchCompanyProfile, upsertCompanyProfile } from '@/lib/supabase/profiles';
import { dashboardQueryKeys, profilesQueryKeys } from '@/lib/supabase/query-keys';
import type { CompanyProfileFormValues } from '@/types/company-profile';

export function useCompanyProfile() {
  const { user, loading: authLoading } = useAuth();

  return useQuery<CompanyProfileFormValues>({
    queryKey: profilesQueryKeys.company(user?.id ?? 'anonymous'),
    queryFn: () =>
      fetchCompanyProfile(user!.id, user!.user_metadata ?? {}, user!.email ?? null),
    enabled: Boolean(user?.id) && !authLoading,
  });
}

export function useUpdateCompanyProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CompanyProfileFormValues) => {
      if (!user?.id) {
        throw new Error('Utilisateur non authentifié.');
      }

      return upsertCompanyProfile(user.id, input);
    },
    onSuccess: (_data, _variables, _context) => {
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: profilesQueryKeys.company(user.id) });
      }

      queryClient.invalidateQueries({ queryKey: profilesQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.all });
    },
  });
}
