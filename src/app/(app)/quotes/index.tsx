import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  AddQuoteFab,
  QuoteSearchBar,
  QuotesList,
  QuotesScreenHeader,
} from '@/components/quotes';
import { BottomTabInset } from '@/constants/theme';
import { colors } from '@/constants/theme/colors';
import { spacing } from '@/constants/theme/spacing';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useInfiniteQuotes } from '@/hooks/use-quotes';

const FAB_CLEARANCE = 104;
const SEARCH_DEBOUNCE_MS = 300;

export default function QuotesScreen() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_MS);
  const insets = useSafeAreaInsets();

  const {
    quotes,
    isLoading,
    isRefetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteQuotes(debouncedSearch);

  const isSearching = debouncedSearch.trim().length > 0;
  const isInitialLoading = isLoading && quotes.length === 0;

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
          onRefresh={handleRefresh}
          quotes={quotes}
        />
      </View>

      <AddQuoteFab style={{ bottom: insets.bottom + BottomTabInset + spacing.md }} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
});
