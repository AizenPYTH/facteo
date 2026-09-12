/** Clés React Query des intégrations. Isolées des clés métier existantes. */

export const integrationsQueryKeys = {
  all: ['integrations'] as const,
  status: (companyId: string, provider: string) =>
    [...integrationsQueryKeys.all, 'status', companyId, provider] as const,
  orders: () => [...integrationsQueryKeys.all, 'orders'] as const,
  orderList: (companyId: string, provider: string, filter: string) =>
    [...integrationsQueryKeys.orders(), companyId, provider, filter] as const,
  orderDetail: (companyId: string, orderId: string) =>
    [...integrationsQueryKeys.orders(), 'detail', companyId, orderId] as const,
};
