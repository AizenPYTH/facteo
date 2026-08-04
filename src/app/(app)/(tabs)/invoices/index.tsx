import { router, type Href } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  AddInvoiceFab,
  InvoiceStatusFilterBar,
  InvoicesList,
  InvoicesScreenHeader,
} from '@/components/invoices';
import { SearchBar } from '@/components/ui/search-bar';
import { InvoicesDesktopScreen } from '@/components/web/desktop/screens/invoices-desktop-screen';
import { BottomTabInset } from '@/constants/theme';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { spacing } from '@/constants/theme/spacing';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useInfiniteInvoices } from '@/hooks/use-invoices';
import { useTenant } from '@/hooks/use-tenant';
import type { InvoiceStatusFilter } from '@/types/invoices-list';

const FAB_CLEARANCE = 104;
const SEARCH_DEBOUNCE_MS = 300;

export default function InvoicesScreen() {
  const { isDesktop, isTablet, isWeb } = useBreakpoint();

  if (isWeb && (isDesktop || isTablet)) {
    return <InvoicesDesktopScreen />;
  }

  return <InvoicesMobileScreen />;
}

function InvoicesMobileScreen() {
  const styles = useStyles();
  const colors = useColors();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<InvoiceStatusFilter>('all');
  const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_MS);
  const insets = useSafeAreaInsets();
  const { isSwitching } = useTenant();

  const {
    invoices,
    isLoading,
    isRefetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteInvoices(debouncedSearch, statusFilter);

  const isSearching = debouncedSearch.trim().length > 0;
  const isInitialLoading = (isLoading || isSwitching) && invoices.length === 0;
  const showFab = invoices.length > 0 || isSearching || statusFilter !== 'all';

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
        <InvoicesScreenHeader />
        <SearchBar
          onChangeText={setSearch}
          placeholder="Rechercher par numéro de facture"
          value={search}
        />
        <InvoiceStatusFilterBar onChange={setStatusFilter} value={statusFilter} />
      </View>

      <View style={styles.listContainer}>
        <InvoicesList
          contentContainerStyle={{
            paddingBottom: insets.bottom + BottomTabInset + FAB_CLEARANCE,
          }}
          invoices={invoices}
          isFetchingNextPage={isFetchingNextPage}
          isInitialLoading={isInitialLoading}
          isRefreshing={isRefetching && !isFetchingNextPage}
          isSearching={isSearching}
          onEndReached={handleEndReached}
          onInvoicePress={(invoice) => router.push(`/invoices/${invoice.id}` as Href)}
          onRefresh={handleRefresh}
          showCreateAction={!showFab}
        />
      </View>

      {showFab ? (
        <AddInvoiceFab style={{ bottom: insets.bottom + BottomTabInset + spacing.md }} />
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
