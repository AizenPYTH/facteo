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
import type { Invoice } from '@/types/invoice';

import { EmptyInvoices } from './empty-invoices';
import { InvoiceCard } from './invoice-card';

export type InvoicesListProps = {
  invoices: Invoice[];
  onInvoicePress?: (invoice: Invoice) => void;
  isInitialLoading?: boolean;
  isRefreshing?: boolean;
  isFetchingNextPage?: boolean;
  isSearching?: boolean;
  showCreateAction?: boolean;
  /** Échec du chargement : affiché à la place de la liste, avec reprise. */
  error?: unknown;
  onRefresh?: () => void;
  onEndReached?: () => void;
  contentContainerStyle?: ViewStyle;
  testID?: string;
};

export function InvoicesList({
  invoices,
  isInitialLoading = false,
  isRefreshing = false,
  isFetchingNextPage = false,
  isSearching = false,
  showCreateAction = true,
  error,
  onRefresh,
  onEndReached,
  onInvoicePress,
  contentContainerStyle,
  testID,
}: InvoicesListProps) {
  const styles = useStyles();
  const colors = useColors();

  const renderItem = useCallback<ListRenderItem<Invoice>>(
    ({ item, index }) => (
      <View>
        {index > 0 ? <ListRowSeparator /> : null}
        <InvoiceCard invoice={item} onPress={onInvoicePress} />
      </View>
    ),
    [onInvoicePress],
  );

  if (isInitialLoading) {
    return <DocumentListSkeleton />;
  }

  // Une erreur de chargement se présentait comme une liste vide : « Aucune
  // facture » alors que le réseau avait échoué.
  if (error && invoices.length === 0) {
    return (
      <ErrorState
        message="Vérifiez votre connexion, puis réessayez."
        onRetry={onRefresh}
        title="Impossible de charger vos factures"
        variant="screen"
      />
    );
  }

  return (
    <FlatList
      contentContainerStyle={[
        invoices.length === 0 ? styles.emptyContent : styles.listContent,
        contentContainerStyle,
      ]}
      data={invoices}
      keyboardShouldPersistTaps="handled"
      keyExtractor={(item) => item.id}
      ListEmptyComponent={
        <EmptyInvoices isSearching={isSearching} showCreateAction={showCreateAction} />
      }
      ListFooterComponent={
        isFetchingNextPage ? (
          <View style={styles.footer}>
            <ActivityIndicator color={colors.primary} size="small" />
          </View>
        ) : null
      }
      nestedScrollEnabled
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
