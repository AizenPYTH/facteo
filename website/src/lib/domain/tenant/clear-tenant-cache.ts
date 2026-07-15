import type { QueryClient } from '@tanstack/react-query';

import {
  clientsQueryKeys,
  dashboardQueryKeys,
  invoicesQueryKeys,
  profilesQueryKeys,
  quotesQueryKeys,
  settingsQueryKeys,
} from '@/lib/supabase/query-keys';

const TENANT_SCOPED_ROOTS = [
  dashboardQueryKeys.all,
  clientsQueryKeys.all,
  quotesQueryKeys.all,
  invoicesQueryKeys.all,
  settingsQueryKeys.all,
  profilesQueryKeys.all,
] as const;

export function clearTenantCache(queryClient: QueryClient): void {
  for (const root of TENANT_SCOPED_ROOTS) {
    queryClient.removeQueries({ queryKey: [...root] });
  }
}
