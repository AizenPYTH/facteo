import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ClientForm, ClientScreenHeader } from '@/components/clients';
import { DeleteClientModal } from '@/components/clients/delete-client-modal';
import { Button } from '@/components/ui/button';
import { colors } from '@/constants/theme/colors';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { useClientMutations } from '@/hooks/use-client-mutations';
import { useClient } from '@/hooks/use-clients';
import { getClientErrorMessage } from '@/lib/clients/errors';
import { clientFormSchema } from '@/lib/validations/client';
import { useToast } from '@/providers/toast-provider';
import {
  createEmptyClientFormValues,
  mapClientToFormValues,
  type ClientFormValues,
} from '@/types/client';

export default function EditClientScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const clientId = Array.isArray(id) ? id[0] : id;
  const { data: client, isLoading, isFetched } = useClient(clientId ?? '');
  const { updateClient, deleteClient } = useClientMutations();
  const { showError, showSuccess } = useToast();
  const [deleteVisible, setDeleteVisible] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
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
      showSuccess('Client mis à jour avec succès');
      reset(values);
    } catch (error) {
      const rawMessage =
        error && typeof error === 'object' && 'message' in error
          ? String((error as { message: string }).message)
          : 'Une erreur est survenue lors de la mise à jour.';

      showError(getClientErrorMessage(rawMessage));
    }
  }

  async function handleDelete() {
    if (!clientId) {
      return;
    }

    try {
      await deleteClient.mutateAsync(clientId);
      setDeleteVisible(false);
      showSuccess('Client supprimé avec succès');
      router.back();
    } catch (error) {
      const rawMessage =
        error && typeof error === 'object' && 'message' in error
          ? String((error as { message: string }).message)
          : 'Une erreur est survenue lors de la suppression.';

      showError(getClientErrorMessage(rawMessage));
    }
  }

  if (isLoading || !client) {
    return (
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.loadingText}>Chargement du client...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}>
        <View style={styles.header}>
          <ClientScreenHeader title="Modifier le client" />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <ClientForm control={control} errors={errors} />

          <Button
            disabled={!isDirty}
            loading={isSubmitting || updateClient.isPending}
            onPress={handleSubmit(onSubmit)}
            title="Enregistrer les modifications"
          />

          <Pressable
            accessibilityRole="button"
            onPress={() => setDeleteVisible(true)}
            style={({ pressed }) => [styles.deleteButton, pressed && styles.pressed]}>
            <Text style={styles.deleteLabel}>Supprimer le client</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

      <DeleteClientModal
        clientName={client.company || client.name}
        loading={deleteClient.isPending}
        onCancel={() => setDeleteVisible(false)}
        onConfirm={handleDelete}
        visible={deleteVisible}
      />
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
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  loadingText: {
    ...typography.subheadline,
    color: colors.textSecondary,
  },
  header: {
    paddingHorizontal: spacing.screenPaddingHorizontal,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  content: {
    paddingHorizontal: spacing.screenPaddingHorizontal,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  deleteButton: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  deleteLabel: {
    ...typography.headline,
    color: colors.error,
  },
  pressed: {
    opacity: 0.7,
  },
});
