import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Text, View } from 'react-native';

import { ClientAiImportPanel, ClientForm, ClientScreenHeader } from '@/components/clients';
import { Button } from '@/components/ui/button';
import { FormScreen } from '@/components/ui/form-screen';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { useClientMutations } from '@/hooks/use-client-mutations';
import { useThemedStyles } from '@/hooks/use-colors';
import { parsedClientToFormValues } from '@/lib/ai/parse-clients';
import { getClientErrorMessage } from '@/lib/clients/errors';
import { newInvoiceHref } from '@/lib/navigation/new-document';
import { clientFormSchema } from '@/lib/validations/client';
import { useToast } from '@/providers/toast-provider';
import type { ParsedClientDraft } from '@/types/ai-client';
import { createEmptyClientFormValues, type ClientFormValues } from '@/types/client';

export default function NewClientScreen() {
  const styles = useStyles();
  const { createClient } = useClientMutations();
  const { showError, showSuccess } = useToast();
  const params = useLocalSearchParams<{ next?: string | string[]; ai?: string | string[] }>();
  const nextRaw = Array.isArray(params.next) ? params.next[0] : params.next;
  const aiRaw = Array.isArray(params.ai) ? params.ai[0] : params.ai;
  const goToInvoice = nextRaw === 'invoice';
  const [showAiImport, setShowAiImport] = useState(aiRaw === '1' || aiRaw === 'true');
  const [submitError, setSubmitError] = useState<string | null>(null);

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

    if (clients.length > 1) {
      showSuccess(
        `${clients.length} clients détectés — le premier est prérempli. Créez-les un par un.`,
      );
    } else {
      showSuccess('Client prérempli — vérifiez puis enregistrez.');
    }
  }

  async function onSubmit(values: ClientFormValues) {
    setSubmitError(null);
    try {
      const client = await createClient.mutateAsync(values);
      if (goToInvoice) {
        showSuccess('Client créé — à vous de facturer.');
        router.replace(newInvoiceHref(client.id) as Href);
        return;
      }

      showSuccess('Client ajouté.');
      router.back();
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

  return (
    <FormScreen
      footer={
        showAiImport ? null : (
          <Button
            elevated={goToInvoice}
            loading={isSubmitting || createClient.isPending}
            onPress={handleSubmit(onSubmit)}
            testID="add-client-submit"
            title={goToInvoice ? 'Enregistrer et facturer' : 'Enregistrer'}
          />
        )
      }
      header={
        <ClientScreenHeader
          title={goToInvoice ? 'Premier client' : 'Nouveau client'}
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
  }));
}
