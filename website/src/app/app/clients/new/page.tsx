'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { AppTopBar } from '@/components/app/app-shell';
import { ClientAiImportPanel } from '@/components/app/client-ai-import-panel';
import { ClientForm } from '@/components/app/client-form';
import { LoadingState } from '@/components/app/ui';
import { SecondaryButton } from '@/components/app/form-fields';
import { parsedClientToFormValues } from '@/lib/domain/ai/parse-clients';
import { createClient } from '@/lib/domain/supabase/clients';
import { clientsQueryKeys } from '@/lib/domain/supabase/query-keys';
import { requireScope } from '@/lib/domain/tenant/scope';
import { useTenant } from '@/providers/company-provider';
import type { ParsedClientDraft } from '@/types/ai-client';
import type { ClientFormValues } from '@/types/client';
import { createEmptyClientFormValues } from '@/types/client';

function NewClientPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { scope } = useTenant();
  const queryClient = useQueryClient();
  const aiParam = searchParams.get('ai');
  const [showAiImport, setShowAiImport] = useState(aiParam === '1' || aiParam === 'true');
  const [formDefaults, setFormDefaults] = useState<Partial<ClientFormValues> | undefined>();
  const [formKey, setFormKey] = useState(0);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (values: ClientFormValues) => createClient(requireScope(scope), values),
    onSuccess: (client) => {
      void queryClient.invalidateQueries({ queryKey: clientsQueryKeys.all });
      router.push(`/app/clients?selected=${client.id}`);
    },
  });

  function handleParsed(clients: ParsedClientDraft[]) {
    const first = clients[0];
    if (!first) {
      return;
    }

    setFormDefaults({
      ...createEmptyClientFormValues(),
      ...parsedClientToFormValues(first),
    });
    setFormKey((current) => current + 1);
    setShowAiImport(false);
    setInfoMessage(
      clients.length > 1
        ? `${clients.length} clients détectés — le premier est prérempli. Créez-les un par un.`
        : 'Client prérempli — vérifiez puis enregistrez.',
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <AppTopBar subtitle="Ajoutez un nouveau contact" title="Nouveau client" />
      <div className="flex-1 overflow-y-auto p-6 xl:p-8">
        <div className="mx-auto max-w-3xl space-y-6">
          {showAiImport ? (
            <ClientAiImportPanel
              onCancel={() => setShowAiImport(false)}
              onParsed={handleParsed}
            />
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <SecondaryButton onClick={() => setShowAiImport(true)} type="button">
                  Ajouter par IA
                </SecondaryButton>
                <Link className="text-sm font-medium text-slate-500 hover:text-slate-800" href="/app/clients">
                  Retour à la liste
                </Link>
              </div>
              {infoMessage ? (
                <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                  {infoMessage}
                </div>
              ) : null}
              <ClientForm
                key={formKey}
                defaultValues={formDefaults}
                onCancel={() => router.push('/app/clients')}
                onSubmit={async (values) => {
                  await mutation.mutateAsync(values);
                }}
                submitLabel="Créer le client"
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function NewClientPage() {
  return (
    <Suspense fallback={<LoadingState message="Chargement…" />}>
      <NewClientPageInner />
    </Suspense>
  );
}
