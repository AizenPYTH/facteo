import { useCallback } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  View,
  type ListRenderItem,
  type ViewStyle,
} from 'react-native';

import { DocumentListSkeleton } from '@/components/documents/document-list-skeleton';
import { ErrorState } from '@/components/ui/error-state';
import { ListRowSeparator } from '@/components/ui/list-row';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import type { Client } from '@/types/client';

import { ClientCard } from './client-card';
import { EmptyClients } from './empty-clients';

export type ClientsListProps = {
  clients: Client[];
  isInitialLoading?: boolean;
  isRefreshing?: boolean;
  isFetchingNextPage?: boolean;
  isSearching?: boolean;
  /** Échec du chargement : affiché à la place de la liste, avec reprise. */
  error?: unknown;
  onRefresh?: () => void;
  onEndReached?: () => void;
  onClientPress?: (client: Client) => void;
  contentContainerStyle?: ViewStyle;
  testID?: string;
};

export function ClientsList({
  clients,
  isInitialLoading = false,
  isRefreshing = false,
  isFetchingNextPage = false,
  isSearching = false,
  error,
  onRefresh,
  onEndReached,
  onClientPress,
  contentContainerStyle,
  testID,
}: ClientsListProps) {
  const styles = useStyles();
  const colors = useColors();
  const renderItem = useCallback<ListRenderItem<Client>>(
    ({ item, index }) => (
      <View>
        {index > 0 ? <ListRowSeparator /> : null}
        <ClientCard client={item} onPress={onClientPress} />
      </View>
    ),
    [onClientPress],
  );

  const renderFooter = () => {
    if (!isFetchingNextPage) {
      return null;
    }

    return (
      <View style={styles.footer}>
        <ActivityIndicator color={colors.primary} size="small" />
      </View>
    );
  };

  if (isInitialLoading) {
    return <DocumentListSkeleton />;
  }

  // Une erreur de chargement se présentait comme une liste vide : « Aucun
  // client » alors que le réseau avait échoué.
  if (error && clients.length === 0) {
    return (
      <ErrorState
        message="Vérifiez votre connexion, puis réessayez."
        onRetry={onRefresh}
        title="Impossible de charger vos clients"
        variant="screen"
      />
    );
  }

  return (
    <FlatList
      contentContainerStyle={[
        clients.length === 0 ? styles.emptyContent : styles.listContent,
        contentContainerStyle,
      ]}
      data={clients}
      keyExtractor={(item) => item.id}
      ListEmptyComponent={<EmptyClients isSearching={isSearching} />}
      ListFooterComponent={renderFooter}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.4}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            colors={[colors.primary]}
            onRefresh={onRefresh}
            refreshing={isRefreshing}
            tintColor={colors.primary}
          />
        ) : undefined
      }
      // Réglages de virtualisation : la liste rendait toutes les lignes montées
      // dès le premier passage, ce qui se voyait au premier scroll sur les gros
      // volumes. La hauteur des lignes est fixe côté gabarit, on la déclare.
      initialNumToRender={8}
      maxToRenderPerBatch={8}
      removeClippedSubviews
      windowSize={9}
      renderItem={renderItem}
      keyboardShouldPersistTaps="handled"
      nestedScrollEnabled
      showsVerticalScrollIndicator={false}
      style={styles.list}
      testID={testID}
    />
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
  list: {
    flex: 1,
  },
  listContent: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  emptyContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  footer: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
}));
}
