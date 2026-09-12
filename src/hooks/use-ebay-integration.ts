import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useTenant } from '@/hooks/use-tenant';
import {
  EBAY_PROVIDER,
  disconnectEbay,
  fetchEbayIntegration,
  startEbayOAuth,
  syncEbayOrders,
} from '@/lib/integrations/ebay/api';
import { integrationsQueryKeys } from '@/lib/integrations/query-keys';
import type { IntegrationEnvironment } from '@/types/integrations';

/**
 * État réel de la connexion eBay et actions associées.
 *
 * Rien n'est simulé : quand aucune intégration n'existe, `integration` vaut
 * null et l'interface doit afficher « Non connecté », pas un état inventé.
 */
export function useEbayIntegration() {
  const { scope, loading: tenantLoading, isSwitching } = useTenant();
  const companyId = scope?.companyId ?? null;
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: integrationsQueryKeys.status(companyId ?? '', EBAY_PROVIDER),
    queryFn: () => fetchEbayIntegration(companyId as string),
    enabled: Boolean(companyId) && !tenantLoading && !isSwitching,
    staleTime: 15_000,
  });

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: integrationsQueryKeys.all });
  }, [queryClient]);

  const connect = useMutation({
    mutationFn: (
      options: {
        environment?: IntegrationEnvironment;
        redirectTo?: string;
        platform?: 'web' | 'native';
      } = {},
    ) => startEbayOAuth(companyId as string, options),
  });

  const sync = useMutation({
    mutationFn: () => syncEbayOrders(companyId as string),
    onSuccess: invalidate,
    onError: invalidate,
  });

  const disconnect = useMutation({
    mutationFn: () => disconnectEbay(companyId as string),
    onSuccess: invalidate,
  });

  const integration = query.data ?? null;
  const connected = integration?.status === 'connected';
  const needsReauth =
    integration?.status === 'reauth_required' || integration?.refreshTokenExpired === true;

  return {
    companyId,
    integration,
    connected,
    needsReauth,
    loading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : null,
    refresh: query.refetch,
    invalidate,
    connect,
    sync,
    disconnect,
  };
}
