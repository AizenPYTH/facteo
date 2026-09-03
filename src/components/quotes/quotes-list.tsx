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
import type { Quote } from '@/types/quote';

import { EmptyQuotes } from './empty-quotes';
import { QuoteCard } from './quote-card';

export type QuotesListProps = {
  quotes: Quote[];
  onQuotePress?: (quote: Quote) => void;
  isInitialLoading?: boolean;
  isRefreshing?: boolean;
  isFetchingNextPage?: boolean;
  isSearching?: boolean;
  /** Échec du chargement : affiché à la place de la liste, avec reprise. */
  error?: unknown;
  onRefresh?: () => void;
  onEndReached?: () => void;
  contentContainerStyle?: ViewStyle;
  testID?: string;
};

export function QuotesList({
  quotes,
  isInitialLoading = false,
  isRefreshing = false,
  isFetchingNextPage = false,
  isSearching = false,
  error,
  onRefresh,
  onEndReached,
  onQuotePress,
  contentContainerStyle,
  testID,
}: QuotesListProps) {
  const styles = useStyles();
  const colors = useColors();
  const renderItem: ListRenderItem<Quote> = ({ item, index }) => (
    <View>
      {index > 0 ? <ListRowSeparator /> : null}
      <QuoteCard onPress={onQuotePress} quote={item} />
    </View>
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
  // devis » alors que le réseau avait échoué.
  if (error && quotes.length === 0) {
    return (
      <ErrorState
        message="Vérifiez votre connexion, puis réessayez."
        onRetry={onRefresh}
        title="Impossible de charger vos devis"
        variant="screen"
      />
    );
  }

  return (
    <FlatList
      contentContainerStyle={[
        quotes.length === 0 ? styles.emptyContent : styles.listContent,
        contentContainerStyle,
      ]}
      data={quotes}
      keyExtractor={(item) => item.id}
      ListEmptyComponent={<EmptyQuotes isSearching={isSearching} />}
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
