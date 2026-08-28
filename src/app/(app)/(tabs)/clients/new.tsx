import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Text, View } from 'react-native';

import {
  ClientAiImportPanel,
  ClientDuplicateSuggestions,
  ClientForm,
  ClientScreenHeader,
} from '@/components/clients';
import { Button } from '@/components/ui/button';
import { FormScreen } from '@/components/ui/form-screen';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { useClientMutations } from '@/hooks/use-client-mutations';
import { useThemedStyles } from '@/hooks/use-colors';
import { parsedClientToFormValues } from '@/lib/ai/parse-clients';
import { findClientDuplicates, type ClientDuplicateMatch } from '@/lib/clients/duplicates';
import { getClientErrorMessage } from '@/lib/clients/errors';
import { newInvoiceHref, newQuoteHref } from '@/lib/navigation/new-document';
import { fetchClientsPage } from '@/lib/supabase/clients';
import { requireScope } from '@/lib/tenant/scope';
import { clientFormSchema } from '@/lib/validations/client';
import { useTenant } from '@/hooks/use-tenant';
import { useToast } from '@/providers/toast-provider';
import type { ParsedClientDraft } from '@/types/ai-client';
import { createEmptyClientFormValues, type ClientFormValues } from '@/types/client';

export default function NewClientScreen() {
  const styles = useStyles();
  const { scope } = useTenant();
  const { createClient } = useClientMutations();
  const { showError, showSuccess } = useToast();
  const params = useLocalSearchParams<{ next?: string | string[]; ai?: string | string[] }>();
  const nextRaw = Array.isArray(params.next) ? params.next[0] : params.next;
  const aiRaw = Array.isArray(params.ai) ? params.ai[0] : params.ai;
  const goToInvoice = nextRaw === 'invoice';
  const goToQuote = nextRaw === 'quote';
  const [showAiImport, setShowAiImport] = useState(aiRaw === '1' || aiRaw === 'true');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [duplicateMatches, setDuplicateMatches] = useState<ClientDuplicateMatch[]>([]);
  const [createdClientId, setCreatedClientId] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: createEmptyClientFormValues(),
  });

  function handleParsed(clients: ParsedClientDraft[]) {
    const first = clients[0];
    if (!first) {
      return;
    }

    reset({
      ...createEmptyClientFormValues(),
      ...parsedClientToFormValues(first),
    });
    setShowAiImport(false);
    setDuplicateMatches([]);

    if (clients.length > 1) {
      showSuccess(
        `${clients.length} clients détectés — le premier est prérempli. Créez-les un par un.`,
      );
    } else {
      showSuccess('Client prérempli — vérifiez puis enregistrez.');
    }
  }

  async function createConfirmed(values: ClientFormValues) {
    const client = await createClient.mutateAsync(values);
    setDuplicateMatches([]);

    if (goToInvoice) {
      showSuccess('Client créé — à vous de facturer.');
      router.replace(newInvoiceHref(client.id) as Href);
      return;
    }

    if (goToQuote) {
      showSuccess('Client créé — continuez vers le devis.');
      router.replace(newQuoteHref(client.id) as Href);
      return;
    }

    setCreatedClientId(client.id);
    showSuccess('Client ajouté.');
  }

  async function onSubmit(values: ClientFormValues) {
    setSubmitError(null);
    try {
      if (duplicateMatches.length === 0 && scope) {
        const page = await fetchClientsPage(requireScope(scope), {
          search: '',
          page: 0,
          pageSize: 200,
        });
        const duplicates = findClientDuplicates(values, page.clients);
        if (duplicates.length > 0) {
          setDuplicateMatches(duplicates);
          return;
        }
      }

      await createConfirmed(values);
    } catch (error) {
      const rawMessage =
        error && typeof error === 'object' && 'message' in error
          ? String((error as { message: string }).message)
          : '';

      const message = getClientErrorMessage(rawMessage);
      setSubmitError(message);
      showError(message);
    }
  }

  if (createdClientId) {
    return (
      <FormScreen
        footer={
          <View style={styles.continueActions}>
            <Button
              elevated
              onPress={() => router.replace(newInvoiceHref(createdClientId) as Href)}
              title="Continuer vers facture"
            />
            <Button
              onPress={() => router.replace(newQuoteHref(createdClientId) as Href)}
              title="Continuer vers devis"
              variant="ghost"
            />
            <Button
              onPress={() => router.replace(`/clients/${createdClientId}` as Href)}
              title="Voir la fiche"
              variant="ghost"
            />
          </View>
        }
        header={<ClientScreenHeader title="Client créé" />}
        testID="add-client-continue-screen">
        <Text style={styles.continueText}>
          Que souhaitez-vous faire ensuite ?
        </Text>
      </FormScreen>
    );
  }

  return (
    <FormScreen
      footer={
        showAiImport ? null : (
          <Button
            elevated={goToInvoice || goToQuote}
            loading={isSubmitting || createClient.isPending}
            onPress={handleSubmit(onSubmit)}
            testID="add-client-submit"
            title={
              goToInvoice
                ? 'Enregistrer et facturer'
                : goToQuote
                  ? 'Enregistrer et créer un devis'
                  : 'Enregistrer'
            }
          />
        )
      }
      header={
        <ClientScreenHeader
          title={goToInvoice ? 'Premier client' : goToQuote ? 'Client pour devis' : 'Nouveau client'}
        />
      }
      testID="add-client-screen">
      {showAiImport ? (
        <ClientAiImportPanel
          onCancel={() => setShowAiImport(false)}
          onParsed={handleParsed}
        />
      ) : (
        <View style={styles.formWrap}>
          <Button
            onPress={() => setShowAiImport(true)}
            title="Ajouter par IA"
            variant="ghost"
          />
          {submitError ? (
            <Text accessibilityLiveRegion="polite" style={styles.submitError}>
              {submitError}
            </Text>
          ) : null}
          {duplicateMatches.length > 0 ? (
            <ClientDuplicateSuggestions
              matches={duplicateMatches}
              onConfirmCreate={() => void handleSubmit(createConfirmed)()}
              onUseClient={(clientId) => {
                if (goToInvoice) {
                  router.replace(newInvoiceHref(clientId) as Href);
                  return;
                }
                if (goToQuote) {
                  router.replace(newQuoteHref(clientId) as Href);
                  return;
                }
                router.replace(`/clients/${clientId}` as Href);
              }}
            />
          ) : null}
          <ClientForm
            compact={goToInvoice}
            control={control}
            errors={errors}
            setValue={setValue}
          />
        </View>
      )}
    </FormScreen>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
    formWrap: {
      gap: spacing.md,
    },
    submitError: {
      ...typography.footnote,
      color: colors.error,
    },
    continueText: {
      ...typography.body,
      color: colors.textSecondary,
    },
    continueActions: {
      gap: spacing.sm,
    },
  }));
}
