import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useForm } from 'react-hook-form';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ClientForm, ClientScreenHeader } from '@/components/clients';
import { Button } from '@/components/ui/button';
import { colors } from '@/constants/theme/colors';
import { spacing } from '@/constants/theme/spacing';
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
    formState: { errors, isSubmitting },
  } = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: createEmptyClientFormValues(),
  });

  async function onSubmit(values: ClientFormValues) {
    try {
      await createClient.mutateAsync(values);
      showSuccess('Client ajouté avec succès');
      router.back();
    } catch (error) {
      const rawMessage =
        error && typeof error === 'object' && 'message' in error
          ? String((error as { message: string }).message)
          : 'Une erreur est survenue lors de la création.';

      showError(getClientErrorMessage(rawMessage));
    }
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea} testID="add-client-screen">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}>
        <View style={styles.header}>
          <ClientScreenHeader title="Nouveau client" />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          style={styles.scroll}>
          <ClientForm control={control} errors={errors} />
        </ScrollView>

        <View style={styles.footer}>
          <Button
            loading={isSubmitting || createClient.isPending}
            onPress={handleSubmit(onSubmit)}
            testID="add-client-submit"
            title="Enregistrer le client"
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.backgroundGrouped,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.screenPaddingHorizontal,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  content: {
    paddingHorizontal: spacing.screenPaddingHorizontal,
    paddingBottom: spacing.lg,
    gap: spacing.lg,
  },
  footer: {
    paddingHorizontal: spacing.screenPaddingHorizontal,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.separator,
    backgroundColor: colors.surface,
  },
});
