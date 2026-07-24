'use client';

import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/providers/auth-provider';
import { useTenant } from '@/providers/company-provider';
import { fetchDashboardData, createEmptyDashboardData } from '@/lib/domain/supabase/dashboard';
import { dashboardQueryKeys } from '@/lib/domain/supabase/query-keys';
import { requireScope } from '@/lib/domain/tenant/scope';
import { createEmptyExtendedDashboardData } from '@inveq/types/dashboard';

export function useDashboard() {
  const { user, loading: authLoading } = useAuth();
  const { scope, loading: tenantLoading, isSwitching } = useTenant();

  const query = useQuery({
    queryKey: dashboardQueryKeys.byCompany(scope?.companyId ?? 'anonymous'),
    queryFn: () => fetchDashboardData(requireScope(scope), user!.user_metadata ?? {}),
    enabled:
      Boolean(scope?.companyId) &&
      Boolean(user?.id) &&
      !authLoading &&
      !tenantLoading &&
      !isSwitching,
  });

  const metadata = user?.user_metadata ?? {};
  const fallback = createEmptyDashboardData(metadata);
  const emptyExtended = createEmptyExtendedDashboardData();
  const hasData = Boolean(query.data);

  return {
    profile: hasData ? query.data!.profile : fallback.profile,
    firstName: hasData ? query.data!.display.firstName : fallback.display.firstName,
    lastName: hasData ? query.data!.display.lastName : fallback.display.lastName,
    companyName: hasData ? query.data!.display.companyName : fallback.display.companyName,
    stats: hasData ? query.data!.stats : fallback.stats,
    extended: hasData ? query.data!.extended : emptyExtended,
    recentInvoices: hasData ? query.data!.recentInvoices : fallback.recentInvoices,
    loading: authLoading || tenantLoading || isSwitching || query.isLoading,
    isRefetching: query.isRefetching,
    error: query.error,
    refetch: query.refetch,
  };
}
