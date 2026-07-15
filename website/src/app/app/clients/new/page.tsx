'use client';

import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { AppTopBar } from '@/components/app/app-shell';
import { ClientForm } from '@/components/app/client-form';
import { createClient } from '@/lib/domain/supabase/clients';
import { clientsQueryKeys } from '@/lib/domain/supabase/query-keys';
import { requireScope } from '@/lib/domain/tenant/scope';
import { useTenant } from '@/providers/company-provider';
import type { ClientFormValues } from '@/types/client';

export default function NewClientPage() {
  const router = useRouter();
  const { scope } = useTenant();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (values: ClientFormValues) => createClient(requireScope(scope), values),
    onSuccess: (client) => {
      void queryClient.invalidateQueries({ queryKey: clientsQueryKeys.all });
      router.push(`/app/clients?selected=${client.id}`);
    },
  });

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <AppTopBar subtitle="Ajoutez un nouveau contact" title="Nouveau client" />
      <div className="flex-1 overflow-y-auto p-6 xl:p-8">
        <div className="mx-auto max-w-3xl">
          <ClientForm
            onCancel={() => router.push('/app/clients')}
            onSubmit={async (values) => {
              await mutation.mutateAsync(values);
            }}
            submitLabel="Créer le client"
          />
        </div>
      </div>
    </div>
  );
}
