import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  AddProductFab,
  ProductSearchBar,
  ProductsList,
  ProductsScreenHeader,
} from '@/components/products';
import { BottomTabInset } from '@/constants/theme';
import { colors } from '@/constants/theme/colors';
import { spacing } from '@/constants/theme/spacing';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useInfiniteProducts } from '@/hooks/use-products';

const FAB_CLEARANCE = 104;
const SEARCH_DEBOUNCE_MS = 300;

export default function ProductsScreen() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_MS);
  const insets = useSafeAreaInsets();

  const {
    products,
    isLoading,
    isRefetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteProducts(debouncedSearch);

  const isSearching = debouncedSearch.trim().length > 0;
  const isInitialLoading = isLoading && products.length === 0;

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
        <ProductsScreenHeader />
        <ProductSearchBar onChangeText={setSearch} value={search} />
      </View>

      <View style={styles.listContainer}>
        <ProductsList
          contentContainerStyle={{
            paddingBottom: insets.bottom + BottomTabInset + FAB_CLEARANCE,
          }}
          isFetchingNextPage={isFetchingNextPage}
          isInitialLoading={isInitialLoading}
          isRefreshing={isRefetching && !isFetchingNextPage}
          isSearching={isSearching}
          onEndReached={handleEndReached}
          onRefresh={handleRefresh}
          products={products}
        />
      </View>

      <AddProductFab style={{ bottom: insets.bottom + BottomTabInset + spacing.md }} />
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
