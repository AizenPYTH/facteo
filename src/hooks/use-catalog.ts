import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/hooks/use-auth';
import { fetchCatalogItems } from '@/lib/supabase/products';
import { catalogQueryKeys } from '@/lib/supabase/query-keys';

export function useCatalogItems(type: 'product' | 'service', search = '') {
  const { user } = useAuth();

  return useQuery({
    queryKey: catalogQueryKeys.list(user?.id ?? 'anonymous', type, search),
    queryFn: () => fetchCatalogItems(user!.id, type, search),
    enabled: Boolean(user?.id),
    staleTime: 30_000,
  });
}
