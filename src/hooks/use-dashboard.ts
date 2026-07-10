import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/hooks/use-auth';
import {
  createEmptyDashboardData,
  fetchDashboardData,
  type DashboardData,
} from '@/lib/supabase/dashboard';
import { dashboardQueryKeys } from '@/lib/supabase/query-keys';

export function useDashboard() {
  const { user, loading: authLoading } = useAuth();

  const query = useQuery<DashboardData>({
    queryKey: dashboardQueryKeys.byUser(user?.id ?? 'anonymous'),
    queryFn: async () => {
      console.log('Dashboard query started');
      try {
        return await fetchDashboardData(user!.id, user!.user_metadata ?? {});
      } finally {
        console.log('Dashboard query finished');
      }
    },
    enabled: Boolean(user?.id) && !authLoading,
  });

  const metadata = user?.user_metadata ?? {};
  const fallback = createEmptyDashboardData(metadata);

  return {
    profile: query.data?.profile ?? fallback.profile,
    firstName: query.data?.display.firstName ?? fallback.display.firstName,
    lastName: query.data?.display.lastName ?? fallback.display.lastName,
    companyName: query.data?.display.companyName ?? fallback.display.companyName,
    stats: query.data?.stats ?? fallback.stats,
    recentInvoices: query.data?.recentInvoices ?? fallback.recentInvoices,
    loading: authLoading || query.isLoading,
    isRefetching: query.isRefetching,
    error: query.error,
    refetch: query.refetch,
  };
}
