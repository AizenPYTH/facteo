import { router, type Href, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  AddInvoiceFab,
  InvoiceBatchBar,
  InvoiceSearchBar,
  InvoiceStatusFilterBar,
  InvoicesList,
  InvoicesScreenHeader,
} from '@/components/invoices';
import { InvoicesDesktopScreen } from '@/components/web/desktop/screens/invoices-desktop-screen';
import { BottomTabInset } from '@/constants/theme';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { useThemedStyles } from '@/hooks/use-colors';
import { spacing } from '@/constants/theme/spacing';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useInfiniteInvoices } from '@/hooks/use-invoices';
import { useSelectionSet } from '@/hooks/use-selection-set';
import { useTenant } from '@/hooks/use-tenant';
import { INVOICE_STATUSES, type Invoice } from '@/types/invoice';
import type { InvoiceStatusFilter } from '@/types/invoices-list';

const FAB_CLEARANCE = 104;
const BATCH_BAR_CLEARANCE = 168;
const SEARCH_DEBOUNCE_MS = 300;

function parseInvoiceStatusParam(value: string | string[] | undefined): InvoiceStatusFilter | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw && (INVOICE_STATUSES as readonly string[]).includes(raw)) {
    return raw as InvoiceStatusFilter;
  }
  return null;
}

export default function InvoicesScreen() {
  const { isDesktop, isTablet, isWeb } = useBreakpoint();

  if (isWeb && (isDesktop || isTablet)) {
    return <InvoicesDesktopScreen />;
  }

  return <InvoicesMobileScreen />;
}

function InvoicesMobileScreen() {
  const styles = useStyles();
  const params = useLocalSearchParams<{
    status?: string | string[];
    due?: string | string[];
    select?: string | string[];
  }>();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<InvoiceStatusFilter>('all');
  const [dueFilter, setDueFilter] = useState<'week' | 'all'>('all');
  const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_MS);
  const insets = useSafeAreaInsets();
  const { isSwitching } = useTenant();

  useEffect(() => {
    const next = parseInvoiceStatusParam(params.status);
    if (next) setStatusFilter(next);

    const rawDue = Array.isArray(params.due) ? params.due[0] : params.due;
    setDueFilter(rawDue === 'week' ? 'week' : 'all');
  }, [params.status, params.due]);

  const {
    invoices,
    isLoading,
    isRefetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteInvoices(debouncedSearch, statusFilter, dueFilter);

  const invoiceIds = useMemo(() => invoices.map((invoice) => invoice.id), [invoices]);
  const selection = useSelectionSet(invoiceIds);

  useEffect(() => {
    const raw = Array.isArray(params.select) ? params.select[0] : params.select;
    if (raw === '1' || raw === 'true') {
      selection.enterSelectionMode();
    }
    // Only react to the deep-link param, not to selection identity changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: enter once when select=1
  }, [params.select]);

  const isSearching = debouncedSearch.trim().length > 0;
  const isInitialLoading = (isLoading || isSwitching) && invoices.length === 0;
  const showFab =
    !selection.selectionMode &&
    (invoices.length > 0 || isSearching || statusFilter !== 'all');

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const handleInvoicePress = useCallback(
    (invoice: Invoice) => {
      if (selection.selectionMode) {
        selection.toggle(invoice.id);
        return;
      }
      router.push(`/invoices/${invoice.id}` as Href);
    },
    [selection],
  );

  const handleInvoiceLongPress = useCallback(
    (invoice: Invoice) => {
      if (selection.selectionMode) {
        selection.toggle(invoice.id);
        return;
      }
      selection.enterSelectionMode(invoice.id);
    },
    [selection],
  );

  const listBottomPad =
    insets.bottom +
    BottomTabInset +
    (selection.selectionMode ? BATCH_BAR_CLEARANCE : FAB_CLEARANCE);

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.headerSection}>
        <InvoicesScreenHeader
          onToggleSelectionMode={() => {
            if (selection.selectionMode) {
              selection.exitSelectionMode();
            } else {
              selection.enterSelectionMode();
            }
          }}
          selectionMode={selection.selectionMode}
        />
        <InvoiceSearchBar onChangeText={setSearch} value={search} />
        <InvoiceStatusFilterBar onChange={setStatusFilter} value={statusFilter} />
      </View>

      <View style={styles.listContainer}>
        <InvoicesList
          contentContainerStyle={{
            paddingBottom: listBottomPad,
          }}
          invoices={invoices}
          isFetchingNextPage={isFetchingNextPage}
          isInitialLoading={isInitialLoading}
          isRefreshing={isRefetching && !isFetchingNextPage}
          isSearching={isSearching}
          onEndReached={handleEndReached}
          onInvoiceLongPress={handleInvoiceLongPress}
          onInvoicePress={handleInvoicePress}
          onRefresh={handleRefresh}
          selectedIds={selection.selectedIds}
          selectionMode={selection.selectionMode}
          showCreateAction={!showFab && !selection.selectionMode}
        />
      </View>

      {showFab ? (
        <AddInvoiceFab style={{ bottom: insets.bottom + BottomTabInset + spacing.md }} />
      ) : null}

      {selection.selectionMode ? (
        <InvoiceBatchBar
          allSelected={selection.allVisibleSelected}
          invoices={invoices}
          onClear={selection.clearSelection}
          onExit={selection.exitSelectionMode}
          onSelectAll={selection.selectAllVisible}
          selectedIds={selection.getSelectedIds()}
        />
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
