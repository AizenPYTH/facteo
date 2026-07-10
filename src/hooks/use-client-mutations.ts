import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/hooks/use-auth';
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
  const { user } = useAuth();
  const invalidateClients = useInvalidateClients();
  const queryClient = useQueryClient();

  const createClientMutation = useMutation({
    mutationFn: (input: ClientFormValues) => {
      if (!user?.id) {
        throw new Error('User must be authenticated to create a client.');
      }

      return createClient(user.id, input);
    },
    onSuccess: invalidateClients,
  });

  const updateClientMutation = useMutation({
    mutationFn: ({ clientId, input }: { clientId: string; input: ClientFormValues }) => {
      if (!user?.id) {
        throw new Error('User must be authenticated to update a client.');
      }

      return updateClient(user.id, clientId, input);
    },
    onSuccess: (data) => {
      invalidateClients();
      if (user?.id) {
        queryClient.setQueryData(clientsQueryKeys.detail(user.id, data.id), data);
      }
    },
  });

  const deleteClientMutation = useMutation({
    mutationFn: (clientId: string) => {
      if (!user?.id) {
        throw new Error('User must be authenticated to delete a client.');
      }

      return deleteClient(user.id, clientId);
    },
    onSuccess: (_data, clientId) => {
      invalidateClients();
      if (user?.id) {
        queryClient.removeQueries({
          queryKey: clientsQueryKeys.detail(user.id, clientId),
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
