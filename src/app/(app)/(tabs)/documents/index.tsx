import { router, useLocalSearchParams, type Href } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  AddInvoiceFab,
  InvoiceSearchBar,
  InvoiceStatusFilterBar,
  InvoicesList,
} from '@/components/invoices';
import {
  AddQuoteFab,
  QuoteSearchBar,
  QuoteStatusFilterBar,
  QuotesList,
} from '@/components/quotes';
import { FeatureIntroModal } from '@/components/feature-intros';
import { AppText } from '@/components/ui/app-text';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { BottomTabInset } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/use-colors';
import { spacing } from '@/constants/theme/spacing';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useFeatureIntro } from '@/hooks/use-feature-intro';
import { useInfiniteInvoices } from '@/hooks/use-invoices';
import { useInfiniteQuotes } from '@/hooks/use-quotes';
import { useTenant } from '@/hooks/use-tenant';
import type { InvoiceStatusFilter } from '@/types/invoices-list';
import type { QuoteStatusFilter } from '@/types/quotes-list';

const FAB_CLEARANCE = 104;
const SEARCH_DEBOUNCE_MS = 300;

type DocumentsSegment = 'invoices' | 'quotes';

/**
 * Documents — Factures | Devis (DESIGN §4).
 */
export default function DocumentsScreen() {
  const styles = useStyles();
  const { segment: segmentParam } = useLocalSearchParams<{ segment?: string }>();
  const [segment, setSegment] = useState<DocumentsSegment>(
    segmentParam === 'quotes' ? 'quotes' : 'invoices',
  );
  const invoicesIntro = useFeatureIntro('invoice');
  const quotesIntro = useFeatureIntro('quote');

  useEffect(() => {
    if (segmentParam === 'quotes' || segmentParam === 'invoices') {
      setSegment(segmentParam);
    }
  }, [segmentParam]);

  useEffect(() => {
    return invoicesIntro.presentOnFirstVisit();
  }, [invoicesIntro.presentOnFirstVisit]);

  function handleSegmentChange(next: DocumentsSegment) {
    setSegment(next);
    if (next === 'quotes') {
      quotesIntro.present();
    }
  }

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.header}>
        <AppText accessibilityRole="header" variant="display">
          Documents
        </AppText>
        <SegmentedControl
          accessibilityLabel="Type de document"
          onChange={handleSegmentChange}
          options={[
            { value: 'invoices', label: 'Factures' },
            { value: 'quotes', label: 'Devis' },
          ]}
          value={segment}
        />
      </View>

      {segment === 'invoices' ? <InvoicesPane /> : <QuotesPane />}

      <FeatureIntroModal
        config={invoicesIntro.config}
        onClose={invoicesIntro.onClose}
        onCta={invoicesIntro.onCta}
        onDontShowAgain={invoicesIntro.onDontShowAgain}
        visible={invoicesIntro.visible}
      />
      <FeatureIntroModal
        config={quotesIntro.config}
        onClose={quotesIntro.onClose}
        onCta={quotesIntro.onCta}
        onDontShowAgain={quotesIntro.onDontShowAgain}
        visible={quotesIntro.visible}
      />
    </SafeAreaView>
  );
}

function InvoicesPane() {
  const styles = useStyles();
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
    <View style={styles.pane}>
      <InvoiceSearchBar onChangeText={setSearch} value={search} />
      <InvoiceStatusFilterBar onChange={setStatusFilter} value={statusFilter} />
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
          onInvoicePress={(invoice) => router.push(`/documents/invoices/${invoice.id}` as Href)}
          onRefresh={handleRefresh}
          showCreateAction={!showFab}
          statusFilter={statusFilter}
        />
      </View>
      {showFab ? (
        <AddInvoiceFab style={{ bottom: insets.bottom + BottomTabInset + spacing.md }} />
      ) : null}
    </View>
  );
}

function QuotesPane() {
  const styles = useStyles();
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
    <View style={styles.pane}>
      <QuoteSearchBar onChangeText={setSearch} value={search} />
      <QuoteStatusFilterBar onChange={setStatusFilter} value={statusFilter} />
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
          onQuotePress={(quote) => router.push(`/documents/quotes/${quote.id}` as Href)}
          onRefresh={handleRefresh}
          quotes={quotes}
          statusFilter={statusFilter}
        />
      </View>
      {showFab ? (
        <AddQuoteFab style={{ bottom: insets.bottom + BottomTabInset + spacing.md }} />
      ) : null}
    </View>
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
      gap: spacing.md,
    },
    pane: {
      flex: 1,
      gap: spacing.sm,
      paddingHorizontal: spacing.screenPaddingHorizontal,
    },
    listContainer: {
      flex: 1,
    },
  }));
}
