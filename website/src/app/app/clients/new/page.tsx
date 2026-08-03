'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { AppTopBar } from '@/components/app/app-shell';
import { ClientAiImportPanel } from '@/components/app/client-ai-import-panel';
import { ClientDuplicateSuggestions } from '@/components/app/client-duplicate-suggestions';
import { ClientForm } from '@/components/app/client-form';
import { LoadingState } from '@/components/app/ui';
import { PrimaryButton, SecondaryButton } from '@/components/app/form-fields';
import { parsedClientToFormValues } from '@/lib/domain/ai/parse-clients';
import {
  findClientDuplicates,
  type ClientDuplicateMatch,
} from '@/lib/domain/clients/duplicates';
import { createClient, fetchClientsPage } from '@/lib/domain/supabase/clients';
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
  const [duplicateMatches, setDuplicateMatches] = useState<ClientDuplicateMatch[]>([]);
  const [pendingValues, setPendingValues] = useState<ClientFormValues | null>(null);
  const [pendingBatch, setPendingBatch] = useState<ParsedClientDraft[]>([]);
  const [batchProgress, setBatchProgress] = useState<string | null>(null);
  const [createdClientId, setCreatedClientId] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (values: ClientFormValues) => createClient(requireScope(scope), values),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: clientsQueryKeys.all });
    },
  });

  async function handleParsed(clients: ParsedClientDraft[]) {
    const first = clients[0];
    if (!first) {
      return;
    }

    if (clients.length > 1) {
      setPendingBatch(clients.slice(1));
      setBatchProgress(null);
      setInfoMessage(
        `${clients.length} clients détectés. Le premier est prérempli — après enregistrement, les suivants pourront être créés en lot.`,
      );
    } else {
      setPendingBatch([]);
      setInfoMessage('Client prérempli — vérifiez puis enregistrez.');
    }

    setFormDefaults({
      ...createEmptyClientFormValues(),
      ...parsedClientToFormValues(first),
    });
    setFormKey((current) => current + 1);
    setShowAiImport(false);
    setDuplicateMatches([]);
  }

  async function createWithDuplicateCheck(values: ClientFormValues, force = false) {
    setCreateError(null);
    if (!force) {
      const existing = await fetchClientsPage(requireScope(scope), {
        search: '',
        page: 0,
        pageSize: 200,
      });
      const duplicates = findClientDuplicates(values, existing.clients);
      if (duplicates.length > 0) {
        setDuplicateMatches(duplicates);
        setPendingValues(values);
        return;
      }
    }

    setDuplicateMatches([]);
    setPendingValues(null);
    try {
      const client = await mutation.mutateAsync(values);

      if (pendingBatch.length > 0) {
        setBatchProgress(`Création des ${pendingBatch.length} clients restants…`);
        for (const draft of pendingBatch) {
          try {
            await createClient(requireScope(scope), {
              ...createEmptyClientFormValues(),
              ...parsedClientToFormValues(draft),
            });
          } catch {
            // continue remaining clients
          }
        }
        void queryClient.invalidateQueries({ queryKey: clientsQueryKeys.all });
        setPendingBatch([]);
        setBatchProgress(null);
        router.push('/app/clients');
        return;
      }

      setCreatedClientId(client.id);
    } catch (error) {
      setCreateError(
        error instanceof Error ? error.message : 'Impossible de créer le client.',
      );
    }
  }

  if (createdClientId) {
    return (
      <div className="flex h-full flex-col overflow-hidden">
        <AppTopBar subtitle="Choisissez la suite" title="Client créé" />
        <div className="flex-1 overflow-y-auto p-6 xl:p-8">
          <div className="mx-auto max-w-lg space-y-4">
            <p className="text-sm text-slate-600">Que souhaitez-vous faire ensuite ?</p>
            <div className="flex flex-col gap-3">
              <PrimaryButton
                onClick={() =>
                  router.push(`/app/invoices?create=1&client=${createdClientId}`)
                }
                type="button">
                Continuer vers facture
              </PrimaryButton>
              <SecondaryButton
                onClick={() =>
                  router.push(`/app/quotes?create=1&client=${createdClientId}`)
                }
                type="button">
                Continuer vers devis
              </SecondaryButton>
              <Link
                className="text-center text-sm font-medium text-slate-500 hover:text-slate-800"
                href={`/app/clients?selected=${createdClientId}`}>
                Voir la fiche client
              </Link>
            </div>
          </div>
        </div>
      </div>
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
              {createError ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
                  {createError}
                </div>
              ) : null}
              {duplicateMatches.length > 0 ? (
                <ClientDuplicateSuggestions
                  matches={duplicateMatches}
                  onConfirmCreate={() => {
                    if (pendingValues) {
                      void createWithDuplicateCheck(pendingValues, true);
                    }
                  }}
                />
              ) : null}
              {batchProgress ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  {batchProgress}
                </div>
              ) : null}
              <ClientForm
                key={formKey}
                defaultValues={formDefaults}
                onCancel={() => router.push('/app/clients')}
                onSubmit={(values) => createWithDuplicateCheck(values, duplicateMatches.length > 0)}
                submitLabel={
                  pendingBatch.length > 0
                    ? `Créer puis importer ${pendingBatch.length} autre(s)`
                    : 'Créer le client'
                }
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
