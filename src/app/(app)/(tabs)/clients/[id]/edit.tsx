import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ClientForm, ClientScreenHeader } from '@/components/clients';
import { Button } from '@/components/ui/button';
import { FormScreen } from '@/components/ui/form-screen';
import { LoadingView } from '@/components/ui/loading-view';
import { useThemedStyles } from '@/hooks/use-colors';
import { useClientMutations } from '@/hooks/use-client-mutations';
import { useClient } from '@/hooks/use-clients';
import { getClientErrorMessage } from '@/lib/clients/errors';
import { clientFormSchema } from '@/lib/validations/client';
import {
  createEmptyClientFormValues,
  mapClientToFormValues,
  type ClientFormValues,
} from '@/types/client';
import { useToast } from '@/providers/toast-provider';

export default function EditClientScreen() {
  const styles = useStyles();
  const { id } = useLocalSearchParams<{ id: string }>();
  const clientId = Array.isArray(id) ? id[0] : id;
  const { data: client, isLoading, isFetched } = useClient(clientId ?? '');
  const { updateClient } = useClientMutations();
  const { showError, showSuccess } = useToast();

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: createEmptyClientFormValues(),
  });

  useEffect(() => {
    if (client) {
      reset(mapClientToFormValues(client));
    }
  }, [client, reset]);

  useEffect(() => {
    if (isFetched && !client && clientId) {
      showError('Client introuvable');
      router.back();
    }
  }, [client, clientId, isFetched, showError]);

  async function onSubmit(values: ClientFormValues) {
    if (!clientId) {
      return;
    }

    try {
      await updateClient.mutateAsync({ clientId, input: values });
      showSuccess('Client modifié.');
      router.back();
    } catch (error) {
      const rawMessage =
        error && typeof error === 'object' && 'message' in error
          ? String((error as { message: string }).message)
          : '';

      showError(getClientErrorMessage(rawMessage));
    }
  }

  if (isLoading || !client) {
    return (
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <ClientScreenHeader title="Modifier le client" />
        <LoadingView message="Chargement du client..." />
      </SafeAreaView>
    );
  }

  return (
    <FormScreen
      footer={
        <Button
          disabled={!isDirty}
          loading={isSubmitting || updateClient.isPending}
          onPress={handleSubmit(onSubmit)}
          title="Enregistrer"
        />
      }
      header={<ClientScreenHeader title="Modifier le client" />}>
      <ClientForm control={control} errors={errors} setValue={setValue} />
    </FormScreen>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
    safeArea: {
      flex: 1,
      backgroundColor: colors.backgroundGrouped,
    },
  }));
}
