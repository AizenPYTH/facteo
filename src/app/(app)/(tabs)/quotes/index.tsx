import { router, type Href } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  AddQuoteFab,
  QuoteSearchBar,
  QuoteStatusFilterBar,
  QuotesList,
  QuotesScreenHeader,
} from '@/components/quotes';
import { BottomTabInset } from '@/constants/theme';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { spacing } from '@/constants/theme/spacing';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useInfiniteQuotes } from '@/hooks/use-quotes';
import { useTenant } from '@/hooks/use-tenant';
import type { QuoteStatusFilter } from '@/types/quotes-list';

const FAB_CLEARANCE = 104;
const SEARCH_DEBOUNCE_MS = 300;

export default function QuotesScreen() {
  const styles = useStyles();
  const colors = useColors();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<QuoteStatusFilter>('all');
  const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_MS);
  const insets = useSafeAreaInsets();
  const { isSwitching } = useTenant();

  const {
    quotes,
    isLoading,
    isRefetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteQuotes(debouncedSearch, statusFilter);

  const isSearching = debouncedSearch.trim().length > 0;
  const isInitialLoading = (isLoading || isSwitching) && quotes.length === 0;
  const showFab = quotes.length > 0 || isSearching || statusFilter !== 'all';

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.headerSection}>
        <QuotesScreenHeader />
        <QuoteSearchBar onChangeText={setSearch} value={search} />
        <QuoteStatusFilterBar onChange={setStatusFilter} value={statusFilter} />
      </View>

      <View style={styles.listContainer}>
        <QuotesList
          contentContainerStyle={{
            paddingBottom: insets.bottom + BottomTabInset + FAB_CLEARANCE,
          }}
          isFetchingNextPage={isFetchingNextPage}
          isInitialLoading={isInitialLoading}
          isRefreshing={isRefetching && !isFetchingNextPage}
          isSearching={isSearching}
          onEndReached={handleEndReached}
          onQuotePress={(quote) => router.push(`/quotes/${quote.id}` as Href)}
          onRefresh={handleRefresh}
          quotes={quotes}
        />
      </View>

      {showFab ? (
        <AddQuoteFab style={{ bottom: insets.bottom + BottomTabInset + spacing.md }} />
      ) : null}
    </SafeAreaView>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
  safeArea: {
    flex: 1,
    backgroundColor: colors.backgroundGrouped,
  },
  headerSection: {
    paddingHorizontal: spacing.screenPaddingHorizontal,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: spacing.screenPaddingHorizontal,
  },
}));
}
