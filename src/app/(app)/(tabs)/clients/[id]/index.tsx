import { router, type Href } from 'expo-router';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ClientDetailView, ClientScreenHeader, DeleteClientModal } from '@/components/clients';
import { Button } from '@/components/ui/button';
import { LoadingView } from '@/components/ui/loading-view';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { spacing } from '@/constants/theme/spacing';
import { useClientMutations } from '@/hooks/use-client-mutations';
import { useClient } from '@/hooks/use-clients';
import { getClientErrorMessage } from '@/lib/clients/errors';
import { getClientDisplayName } from '@/types/client';
import { useToast } from '@/providers/toast-provider';

export default function ClientDetailScreen() {
  const styles = useStyles();
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const clientId = Array.isArray(id) ? id[0] : id;
  const { data: client, isLoading, isFetched } = useClient(clientId ?? '');
  const { deleteClient } = useClientMutations();
  const { showError, showSuccess } = useToast();
  const [deleteVisible, setDeleteVisible] = useState(false);

  useEffect(() => {
    if (isFetched && !client && clientId) {
      showError('Client introuvable');
      router.back();
    }
  }, [client, clientId, isFetched, showError]);

  async function handleDelete() {
    if (!clientId) {
      return;
    }

    try {
      await deleteClient.mutateAsync(clientId);
      setDeleteVisible(false);
      showSuccess('Client supprimé.');
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
        <LoadingView message="Chargement du client..." />
      </SafeAreaView>
    );
  }

  const title = getClientDisplayName(client);

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <View style={styles.header}>
        <ClientScreenHeader title={title} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}>
        <ClientDetailView client={client} />
      </ScrollView>

      <View style={styles.footer}>
        <Button
          onPress={() => router.push(`/clients/${client.id}/edit` as Href)}
          title="Modifier"
        />
        <Button
          onPress={() => setDeleteVisible(true)}
          title="Supprimer"
          variant="ghost"
        />
      </View>

      <DeleteClientModal
        clientName={title}
        loading={deleteClient.isPending}
        onCancel={() => setDeleteVisible(false)}
        onConfirm={handleDelete}
        visible={deleteVisible}
      />
    </SafeAreaView>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
  safeArea: {
    flex: 1,
    backgroundColor: colors.backgroundGrouped,
  },
  header: {
    paddingHorizontal: spacing.screenPaddingHorizontal,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  content: {
    paddingHorizontal: spacing.screenPaddingHorizontal,
    paddingBottom: spacing.lg,
  },
  footer: {
    paddingHorizontal: spacing.screenPaddingHorizontal,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    gap: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.separator,
    backgroundColor: colors.surface,
  },
}));
}
