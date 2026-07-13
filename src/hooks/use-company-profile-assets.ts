import { useQuery } from '@tanstack/react-query';

import { useTenant } from '@/hooks/use-tenant';
import { fetchCompanyById } from '@/lib/supabase/companies';
import { requireScope } from '@/lib/tenant/scope';
import { profilesQueryKeys } from '@/lib/supabase/query-keys';

export type CompanyProfileAssets = {
  logoUrl: string | null;
  signatureUrl: string | null;
};

export function useCompanyProfileAssets() {
  const { scope, loading: tenantLoading } = useTenant();

  return useQuery<CompanyProfileAssets>({
    queryKey: profilesQueryKeys.assets(scope?.companyId ?? 'anonymous'),
    queryFn: async () => {
      const company = await fetchCompanyById(requireScope(scope).companyId);

      return {
        logoUrl: company?.logoUrl ?? null,
        signatureUrl: company?.signatureUrl ?? null,
      };
    },
    enabled: Boolean(scope?.companyId) && !tenantLoading,
  });
}
