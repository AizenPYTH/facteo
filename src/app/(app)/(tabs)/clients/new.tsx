import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useForm } from 'react-hook-form';

import { ClientForm, ClientScreenHeader } from '@/components/clients';
import { Button } from '@/components/ui/button';
import { FormScreen } from '@/components/ui/form-screen';
import { useClientMutations } from '@/hooks/use-client-mutations';
import { getClientErrorMessage } from '@/lib/clients/errors';
import { clientFormSchema } from '@/lib/validations/client';
import { useToast } from '@/providers/toast-provider';
import { createEmptyClientFormValues, type ClientFormValues } from '@/types/client';

export default function NewClientScreen() {
  const { createClient } = useClientMutations();
  const { showError, showSuccess } = useToast();

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
      await createClient.mutateAsync(values);
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
    <FormScreen
      footer={
        <Button
          loading={isSubmitting || createClient.isPending}
          onPress={handleSubmit(onSubmit)}
          testID="add-client-submit"
          title="Enregistrer"
        />
      }
      header={<ClientScreenHeader title="Nouveau client" />}
      testID="add-client-screen">
      <ClientForm control={control} errors={errors} setValue={setValue} />
    </FormScreen>
  );
}
