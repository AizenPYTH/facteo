'use client';

import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { AppTopBar } from '@/components/app/app-shell';
import { ClientForm } from '@/components/app/client-form';
import { LoadingState } from '@/components/app/ui';
import { fetchClientById, updateClient } from '@/lib/domain/supabase/clients';
import { clientsQueryKeys } from '@/lib/domain/supabase/query-keys';
import { requireScope } from '@/lib/domain/tenant/scope';
import { useTenant } from '@/providers/company-provider';
import { mapClientToFormValues } from '@/types/client';
import type { ClientFormValues } from '@/types/client';

export default function EditClientPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { scope } = useTenant();
  const queryClient = useQueryClient();
  const clientId = params.id;

  const clientQuery = useQuery({
    queryKey: clientsQueryKeys.detail(scope?.companyId ?? '', clientId),
    queryFn: () => fetchClientById(requireScope(scope), clientId),
    enabled: Boolean(scope?.companyId && clientId),
  });

  const mutation = useMutation({
    mutationFn: (values: ClientFormValues) =>
      updateClient(requireScope(scope), clientId, values),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: clientsQueryKeys.all });
      router.push(`/app/clients?selected=${clientId}`);
    },
  });

  if (clientQuery.isLoading) {
    return <LoadingState message="Chargement du client…" />;
  }

  if (!clientQuery.data) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-sm text-slate-500">
        Client introuvable.
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <AppTopBar subtitle={clientQuery.data.company ?? undefined} title="Modifier le client" />
      <div className="flex-1 overflow-y-auto p-6 xl:p-8">
        <div className="mx-auto max-w-3xl">
          <ClientForm
            defaultValues={mapClientToFormValues(clientQuery.data)}
            onCancel={() => router.push(`/app/clients?selected=${clientId}`)}
            onSubmit={async (values) => {
              await mutation.mutateAsync(values);
            }}
          />
        </div>
      </div>
    </div>
  );
}
