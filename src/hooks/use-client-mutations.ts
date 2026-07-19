import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useTenant } from '@/hooks/use-tenant';
import { requireScope } from '@/lib/tenant/scope';
import { createClient, deleteClient, updateClient } from '@/lib/supabase/clients';
import { clientsQueryKeys, dashboardQueryKeys } from '@/lib/supabase/query-keys';
import type { ClientFormValues } from '@/types/client';

function useInvalidateClients() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: clientsQueryKeys.all });
    queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.all });
  };
}

export function useClientMutations() {
  const { scope } = useTenant();
  const invalidateClients = useInvalidateClients();
  const queryClient = useQueryClient();

  const createClientMutation = useMutation({
    mutationFn: async (input: ClientFormValues) => {
      return createClient(requireScope(scope), input);
    },
    onSuccess: invalidateClients,
  });

  const updateClientMutation = useMutation({
    mutationFn: ({ clientId, input }: { clientId: string; input: ClientFormValues }) =>
      updateClient(requireScope(scope), clientId, input),
    onSuccess: (data) => {
      invalidateClients();
      if (scope?.companyId) {
        queryClient.setQueryData(clientsQueryKeys.detail(scope.companyId, data.id), data);
      }
    },
  });

  const deleteClientMutation = useMutation({
    mutationFn: (clientId: string) => deleteClient(requireScope(scope), clientId),
    onSuccess: (_data, clientId) => {
      invalidateClients();
      if (scope?.companyId) {
        queryClient.removeQueries({
          queryKey: clientsQueryKeys.detail(scope.companyId, clientId),
        });
      }
    },
  });

  return {
    createClient: createClientMutation,
    updateClient: updateClientMutation,
    deleteClient: deleteClientMutation,
  };
}
