import { useQuery } from '@tanstack/react-query';

import { useTenant } from '@/hooks/use-tenant';
import { requireScope } from '@/lib/tenant/scope';
import {
  EBAY_PROVIDER,
  fetchEbayOrderById,
  fetchEbayOrders,
  type ExternalOrderFilter,
} from '@/lib/integrations/ebay/api';
import { integrationsQueryKeys } from '@/lib/integrations/query-keys';

export function useEbayOrders(filter: ExternalOrderFilter = 'all') {
  const { scope, loading: tenantLoading, isSwitching } = useTenant();

  const query = useQuery({
    queryKey: integrationsQueryKeys.orderList(scope?.companyId ?? '', EBAY_PROVIDER, filter),
    queryFn: () => fetchEbayOrders(requireScope(scope), filter),
    enabled: Boolean(scope?.companyId) && !tenantLoading && !isSwitching,
    staleTime: 15_000,
  });

  return {
    ...query,
    orders: query.data ?? [],
  };
}

export function useEbayOrder(orderId: string) {
  const { scope, loading: tenantLoading, isSwitching } = useTenant();

  return useQuery({
    queryKey: integrationsQueryKeys.orderDetail(scope?.companyId ?? '', orderId),
    queryFn: () => fetchEbayOrderById(requireScope(scope), orderId),
    enabled: Boolean(scope?.companyId && orderId) && !tenantLoading && !isSwitching,
  });
}
