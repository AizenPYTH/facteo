import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
  type ListRenderItem,
  type ViewStyle,
} from 'react-native';

import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import type { Quote } from '@/types/quote';
import type { QuoteStatusFilter } from '@/types/quotes-list';

import { EmptyQuotes } from './empty-quotes';
import { QuoteCard } from './quote-card';

export type QuotesListProps = {
  quotes: Quote[];
  onQuotePress?: (quote: Quote) => void;
  onQuoteShare?: (quote: Quote) => void;
  isInitialLoading?: boolean;
  isRefreshing?: boolean;
  isFetchingNextPage?: boolean;
  isSearching?: boolean;
  statusFilter?: QuoteStatusFilter;
  onRefresh?: () => void;
  onEndReached?: () => void;
  contentContainerStyle?: ViewStyle;
  selectedId?: string | null;
  testID?: string;
};

export function QuotesList({
  quotes,
  isInitialLoading = false,
  isRefreshing = false,
  isFetchingNextPage = false,
  isSearching = false,
  statusFilter = 'all',
  onRefresh,
  onEndReached,
  onQuotePress,
  onQuoteShare,
  contentContainerStyle,
  selectedId,
  testID,
}: QuotesListProps) {
  const styles = useStyles();
  const colors = useColors();
  const renderItem: ListRenderItem<Quote> = ({ item, index }) => (
    <View>
      <QuoteCard
        onPress={onQuotePress}
        onShare={onQuoteShare}
        quote={item}
        selected={item.id === selectedId}
      />
      {index < quotes.length - 1 ? <View style={styles.separator} /> : null}
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
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={styles.loadingText}>Chargement des devis...</Text>
      </View>
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
      ListEmptyComponent={
        <EmptyQuotes isSearching={isSearching} statusFilter={statusFilter} />
      }
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
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['3xl'],
    gap: spacing.md,
  },
  loadingText: {
    ...typography.subheadline,
    color: colors.textSecondary,
  },
  footer: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.separator,
    marginLeft: spacing.md,
  },
}));
}
