import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { useForm } from 'react-hook-form';
import { KeyboardAvoidingView } from 'react-native';

import { ClientForm, ClientScreenHeader } from '@/components/clients';
import { Button } from '@/components/ui/button';
import { FormScreen } from '@/components/ui/form-screen';
import { useClientMutations } from '@/hooks/use-client-mutations';
import { getClientErrorMessage } from '@/lib/clients/errors';
import { newInvoiceHref } from '@/lib/navigation/new-document';
import { clientFormSchema } from '@/lib/validations/client';
import { useToast } from '@/providers/toast-provider';
import { createEmptyClientFormValues, type ClientFormValues } from '@/types/client';

export default function NewClientScreen() {
  const { createClient } = useClientMutations();
  const { showError, showSuccess } = useToast();
  const params = useLocalSearchParams<{ next?: string | string[] }>();
  const nextRaw = Array.isArray(params.next) ? params.next[0] : params.next;
  const goToInvoice = nextRaw === 'invoice';

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: createEmptyClientFormValues(),
  });

  async function onSubmit(values: ClientFormValues) {
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

      showError(getClientErrorMessage(rawMessage));
    }
  }

  return (
    <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
      <FormScreen
        footer={
          <Button
            elevated={goToInvoice}
            loading={isSubmitting || createClient.isPending}
            onPress={handleSubmit(onSubmit)}
            testID="add-client-submit"
            title={goToInvoice ? 'Enregistrer et facturer' : 'Enregistrer'}
          />
        }
        header={
          <ClientScreenHeader
            title={goToInvoice ? 'Premier client' : 'Nouveau client'}
          />
        }
        testID="add-client-screen">
        <ClientForm compact={goToInvoice} control={control} errors={errors} setValue={setValue} />
      </FormScreen>
    </KeyboardAvoidingView>
  );
}
