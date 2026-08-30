import { router, useLocalSearchParams, type Href } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { FeatureIntroModal } from '@/components/feature-intros';
import { InvoiceSearchBar, InvoiceStatusFilterBar, InvoicesList } from '@/components/invoices';
import { QuoteSearchBar, QuoteStatusFilterBar, QuotesList } from '@/components/quotes';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { IpadSplitShell } from '@/components/tablet/ipad-split-shell';
import {
  TabletDocumentsList,
  type TabletDocumentsSegment,
} from '@/components/tablet/tablet-documents-list';
import { BottomTabInset } from '@/constants/theme';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { spacing } from '@/constants/theme/spacing';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useFeatureIntro } from '@/hooks/use-feature-intro';
import { useInfiniteInvoices, useInvoiceStatusCounts } from '@/hooks/use-invoices';
import { useInfiniteQuotes, useQuoteStatusCounts } from '@/hooks/use-quotes';
import { useTenant } from '@/hooks/use-tenant';
import type { InvoiceStatusFilter } from '@/types/invoices-list';
import type { QuoteStatusFilter } from '@/types/quotes-list';

const LIST_BOTTOM_CLEARANCE = 32;
const SEARCH_DEBOUNCE_MS = 300;

type DocumentsSegment = 'invoices' | 'quotes';

/**
 * Documents — DESIGN §4 / §5 : titre → recherche → Factures|Devis → chips → liste.
 */
export default function DocumentsScreen() {
  const { isTablet, isWeb } = useBreakpoint();

  if (!isWeb && isTablet) {
    return <TabletDocumentsScreen />;
  }

  return <DocumentsMobileScreen />;
}

function TabletDocumentsScreen() {
  const styles = useStyles();
  const { width, height } = useBreakpoint();
  const { segment } = useLocalSearchParams<{ segment?: string }>();
  const [listVisible, setListVisible] = useState(true);
  const initialSegment: TabletDocumentsSegment =
    segment === 'quotes' ? 'quotes' : 'invoices';
  const isLandscape = width > height;

  return (
    <IpadSplitShell
      document={
        <SafeAreaView edges={['top', 'bottom', 'right']} style={styles.tabletEmpty}>
          {!isLandscape ? (
            <Button
              onPress={() => setListVisible(true)}
              title="Afficher les documents"
              variant="secondary"
            />
          ) : null}
          <AppText color="secondary" variant="body">
            Sélectionnez une facture ou un devis.
          </AppText>
        </SafeAreaView>
      }
      list={
        <TabletDocumentsList
          initialSegment={initialSegment}
          onDismiss={isLandscape ? undefined : () => setListVisible(false)}
        />
      }
      listVisible={listVisible}
      onDismissList={() => setListVisible(false)}
    />
  );
}

function DocumentsMobileScreen() {
  const styles = useStyles();
  const colors = useColors();
  const { segment: segmentParam } = useLocalSearchParams<{ segment?: string }>();
  const [segment, setSegment] = useState<DocumentsSegment>(
    segmentParam === 'quotes' ? 'quotes' : 'invoices',
  );
  const [lastSegmentParam, setLastSegmentParam] = useState(segmentParam);
  if (segmentParam !== lastSegmentParam) {
    setLastSegmentParam(segmentParam);
    if (segmentParam === 'quotes' || segmentParam === 'invoices') {
      setSegment(segmentParam);
    }
  }
  const invoicesIntro = useFeatureIntro('invoice');
  const quotesIntro = useFeatureIntro('quote');

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
        <View style={styles.titleRow}>
          <AppText accessibilityRole="header" variant="display">
            Documents
          </AppText>
          <Button
            accessibilityLabel={segment === 'invoices' ? 'Nouvelle facture' : 'Nouveau devis'}
            onPress={() => {
              const href =
                segment === 'invoices' ? '/documents/invoices/new' : '/documents/quotes/new';
              router.push(href as Href);
            }}
            variant="icon">
            <SymbolView
              name={{ ios: 'plus', android: 'add', web: 'add' }}
              size={20}
              tintColor={colors.primary}
            />
          </Button>
        </View>
      </View>

      {segment === 'invoices' ? (
        <InvoicesPane
          onSegmentChange={handleSegmentChange}
          segment={segment}
        />
      ) : (
        <QuotesPane onSegmentChange={handleSegmentChange} segment={segment} />
      )}

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

function DocumentsChrome({
  segment,
  onSegmentChange,
  search,
  onSearchChange,
  searchPlaceholder,
  filter,
}: {
  segment: DocumentsSegment;
  onSegmentChange: (next: DocumentsSegment) => void;
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  filter: ReactNode;
}) {
  const styles = useStyles();

  return (
    <View style={styles.chrome}>
      {segment === 'invoices' ? (
        <InvoiceSearchBar
          onChangeText={onSearchChange}
          placeholder={searchPlaceholder}
          value={search}
        />
      ) : (
        <QuoteSearchBar
          onChangeText={onSearchChange}
          placeholder={searchPlaceholder}
          value={search}
        />
      )}
      <SegmentedControl
        accessibilityLabel="Type de document"
        onChange={onSegmentChange}
        options={[
          { value: 'invoices', label: 'Factures' },
          { value: 'quotes', label: 'Devis' },
        ]}
        value={segment}
      />
      {filter}
    </View>
  );
}

function InvoicesPane({
  segment,
  onSegmentChange,
}: {
  segment: DocumentsSegment;
  onSegmentChange: (next: DocumentsSegment) => void;
}) {
  const styles = useStyles();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<InvoiceStatusFilter>('all');
  const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_MS);
  const insets = useSafeAreaInsets();
  const { isSwitching } = useTenant();
  const statusCountsQuery = useInvoiceStatusCounts();

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

  const handleRefresh = useCallback(() => {
    refetch();
    void statusCountsQuery.refetch();
  }, [refetch, statusCountsQuery]);

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const openInvoice = useCallback((id: string) => {
    router.push(`/documents/invoices/${id}` as Href);
  }, []);

  return (
    <View style={styles.pane}>
      <DocumentsChrome
        filter={
          <InvoiceStatusFilterBar
            counts={statusCountsQuery.data}
            onChange={setStatusFilter}
            value={statusFilter}
          />
        }
        onSearchChange={setSearch}
        onSegmentChange={onSegmentChange}
        search={search}
        searchPlaceholder="Rechercher une facture"
        segment={segment}
      />
      <View style={styles.listContainer}>
        <InvoicesList
          contentContainerStyle={{
            paddingBottom: insets.bottom + BottomTabInset + LIST_BOTTOM_CLEARANCE,
          }}
          invoices={invoices}
          isFetchingNextPage={isFetchingNextPage}
          isInitialLoading={isInitialLoading}
          isRefreshing={isRefetching && !isFetchingNextPage}
          isSearching={isSearching}
          onEndReached={handleEndReached}
          onInvoicePress={(invoice) => openInvoice(invoice.id)}
          onInvoiceRemind={(invoice) => openInvoice(invoice.id)}
          onInvoiceShare={(invoice) => openInvoice(invoice.id)}
          onMarkPaid={(invoice) => openInvoice(invoice.id)}
          onRefresh={handleRefresh}
          showCreateAction={false}
          statusFilter={statusFilter}
        />
      </View>
    </View>
  );
}

function QuotesPane({
  segment,
  onSegmentChange,
}: {
  segment: DocumentsSegment;
  onSegmentChange: (next: DocumentsSegment) => void;
}) {
  const styles = useStyles();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<QuoteStatusFilter>('all');
  const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_MS);
  const insets = useSafeAreaInsets();
  const { isSwitching } = useTenant();
  const statusCountsQuery = useQuoteStatusCounts();

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

  const handleRefresh = useCallback(() => {
    refetch();
    void statusCountsQuery.refetch();
  }, [refetch, statusCountsQuery]);

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  return (
    <View style={styles.pane}>
      <DocumentsChrome
        filter={
          <QuoteStatusFilterBar
            counts={statusCountsQuery.data}
            onChange={setStatusFilter}
            value={statusFilter}
          />
        }
        onSearchChange={setSearch}
        onSegmentChange={onSegmentChange}
        search={search}
        searchPlaceholder="Rechercher un devis"
        segment={segment}
      />
      <View style={styles.listContainer}>
        <QuotesList
          contentContainerStyle={{
            paddingBottom: insets.bottom + BottomTabInset + LIST_BOTTOM_CLEARANCE,
          }}
          isFetchingNextPage={isFetchingNextPage}
          isInitialLoading={isInitialLoading}
          isRefreshing={isRefetching && !isFetchingNextPage}
          isSearching={isSearching}
          onEndReached={handleEndReached}
          onQuotePress={(quote) => router.push(`/documents/quotes/${quote.id}` as Href)}
          onQuoteShare={(quote) => router.push(`/documents/quotes/${quote.id}` as Href)}
          onRefresh={handleRefresh}
          quotes={quotes}
          statusFilter={statusFilter}
        />
      </View>
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
      paddingBottom: spacing.sm,
    },
    titleRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      gap: spacing.md,
    },
    chrome: {
      gap: spacing.sm,
      paddingHorizontal: spacing.screenPaddingHorizontal,
      paddingBottom: spacing.sm,
    },
    pane: {
      flex: 1,
    },
    listContainer: {
      flex: 1,
      backgroundColor: colors.surface,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    tabletEmpty: {
      flex: 1,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      gap: spacing.md,
      padding: spacing.xl,
      backgroundColor: colors.backgroundGrouped,
    },
  }));
}
