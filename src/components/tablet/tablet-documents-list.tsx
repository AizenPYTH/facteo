import { router, type Href } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useCallback, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { InvoiceSearchBar, InvoiceStatusFilterBar, InvoicesList } from '@/components/invoices';
import { QuoteSearchBar, QuoteStatusFilterBar, QuotesList } from '@/components/quotes';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { spacing } from '@/constants/theme/spacing';
import { useThemedStyles } from '@/hooks/use-colors';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useInfiniteInvoices, useInvoiceStatusCounts } from '@/hooks/use-invoices';
import { useInfiniteQuotes, useQuoteStatusCounts } from '@/hooks/use-quotes';
import { useTenant } from '@/hooks/use-tenant';
import type { InvoiceStatusFilter } from '@/types/invoices-list';
import type { QuoteStatusFilter } from '@/types/quotes-list';

export type TabletDocumentsSegment = 'invoices' | 'quotes';

type TabletDocumentsListProps = {
  initialSegment?: TabletDocumentsSegment;
  selectedId?: string | null;
  selectedType?: 'invoice' | 'quote';
  onDismiss?: () => void;
};

/** Liste Documents iPad — même hiérarchie que iPhone (DESIGN §7). */
export function TabletDocumentsList({
  initialSegment = 'invoices',
  selectedId = null,
  selectedType,
  onDismiss,
}: TabletDocumentsListProps) {
  const styles = useStyles();
  const [segment, setSegment] = useState<TabletDocumentsSegment>(initialSegment);
  const [previousInitialSegment, setPreviousInitialSegment] = useState(initialSegment);

  if (initialSegment !== previousInitialSegment) {
    setPreviousInitialSegment(initialSegment);
    setSegment(initialSegment);
  }

  function handleSegmentChange(next: TabletDocumentsSegment) {
    setSegment(next);
    router.replace(`/documents?segment=${next}` as Href);
  }

  function handleCreate() {
    const href =
      segment === 'invoices' ? '/documents/invoices/new' : '/documents/quotes/new';
    router.push(href as Href);
  }

  return (
    <SafeAreaView edges={['top', 'bottom', 'left']} style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <AppText accessibilityRole="header" variant="title">
            Documents
          </AppText>
          <View style={styles.headerActions}>
            <Button
              accessibilityLabel={segment === 'invoices' ? 'Nouvelle facture' : 'Nouveau devis'}
              onPress={handleCreate}
              variant="icon">
              <SymbolView
                name={{ ios: 'plus', android: 'add', web: 'add' }}
                size={20}
                tintColor={styles.iconColor.color}
              />
            </Button>
            {onDismiss ? (
              <Button
                accessibilityLabel="Fermer la liste des documents"
                onPress={onDismiss}
                variant="icon">
                <SymbolView
                  name={{ ios: 'xmark', android: 'close', web: 'close' }}
                  size={18}
                  tintColor={styles.iconColor.color}
                />
              </Button>
            ) : null}
          </View>
        </View>
      </View>

      {segment === 'invoices' ? (
        <TabletInvoicesPane
          onDismiss={onDismiss}
          onSegmentChange={handleSegmentChange}
          segment={segment}
          selectedId={selectedType === 'invoice' ? selectedId : null}
        />
      ) : (
        <TabletQuotesPane
          onDismiss={onDismiss}
          onSegmentChange={handleSegmentChange}
          segment={segment}
          selectedId={selectedType === 'quote' ? selectedId : null}
        />
      )}
    </SafeAreaView>
  );
}

function TabletInvoicesPane({
  selectedId,
  onDismiss,
  segment,
  onSegmentChange,
}: {
  selectedId: string | null;
  onDismiss?: () => void;
  segment: TabletDocumentsSegment;
  onSegmentChange: (next: TabletDocumentsSegment) => void;
}) {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<InvoiceStatusFilter>('all');
  const debouncedSearch = useDebouncedValue(search, 300);
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

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const openInvoice = useCallback(
    (id: string) => {
      onDismiss?.();
      router.replace(`/documents/invoices/${id}` as Href);
    },
    [onDismiss],
  );

  return (
    <View style={styles.pane}>
      <InvoiceSearchBar
        onChangeText={setSearch}
        placeholder="Rechercher une facture"
        value={search}
      />
      <SegmentedControl
        accessibilityLabel="Type de document"
        onChange={onSegmentChange}
        options={[
          { value: 'invoices', label: 'Factures' },
          { value: 'quotes', label: 'Devis' },
        ]}
        value={segment}
      />
      <InvoiceStatusFilterBar
        counts={statusCountsQuery.data}
        onChange={setStatusFilter}
        value={statusFilter}
      />
      <View style={styles.list}>
        <InvoicesList
          contentContainerStyle={{ paddingBottom: insets.bottom + spacing.md }}
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
          onRefresh={() => {
            refetch();
            void statusCountsQuery.refetch();
          }}
          selectedId={selectedId}
          showCreateAction={false}
          statusFilter={statusFilter}
        />
      </View>
    </View>
  );
}

function TabletQuotesPane({
  selectedId,
  onDismiss,
  segment,
  onSegmentChange,
}: {
  selectedId: string | null;
  onDismiss?: () => void;
  segment: TabletDocumentsSegment;
  onSegmentChange: (next: TabletDocumentsSegment) => void;
}) {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<QuoteStatusFilter>('all');
  const debouncedSearch = useDebouncedValue(search, 300);
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

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  return (
    <View style={styles.pane}>
      <QuoteSearchBar
        onChangeText={setSearch}
        placeholder="Rechercher un devis"
        value={search}
      />
      <SegmentedControl
        accessibilityLabel="Type de document"
        onChange={onSegmentChange}
        options={[
          { value: 'invoices', label: 'Factures' },
          { value: 'quotes', label: 'Devis' },
        ]}
        value={segment}
      />
      <QuoteStatusFilterBar
        counts={statusCountsQuery.data}
        onChange={setStatusFilter}
        value={statusFilter}
      />
      <View style={styles.list}>
        <QuotesList
          contentContainerStyle={{ paddingBottom: insets.bottom + spacing.md }}
          isFetchingNextPage={isFetchingNextPage}
          isInitialLoading={isInitialLoading}
          isRefreshing={isRefetching && !isFetchingNextPage}
          isSearching={isSearching}
          onEndReached={handleEndReached}
          onQuotePress={(quote) => {
            onDismiss?.();
            router.replace(`/documents/quotes/${quote.id}` as Href);
          }}
          onQuoteShare={(quote) => {
            onDismiss?.();
            router.replace(`/documents/quotes/${quote.id}` as Href);
          }}
          onRefresh={() => {
            refetch();
            void statusCountsQuery.refetch();
          }}
          quotes={quotes}
          selectedId={selectedId}
          statusFilter={statusFilter}
        />
      </View>
    </View>
  );
}

const useStyles = () =>
  useThemedStyles((colors) => ({
    safeArea: {
      flex: 1,
      minHeight: 0,
      backgroundColor: colors.surface,
    },
    header: {
      paddingHorizontal: spacing.md,
      paddingTop: spacing.sm,
      paddingBottom: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    titleRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      gap: spacing.sm,
    },
    headerActions: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.sm,
    },
    pane: {
      flex: 1,
      minHeight: 0,
      gap: spacing.sm,
      padding: spacing.md,
      backgroundColor: colors.backgroundGrouped,
    },
    list: {
      flex: 1,
      minHeight: 0,
      backgroundColor: colors.surface,
      borderRadius: 14,
      overflow: 'hidden' as const,
      borderWidth: 1,
      borderColor: colors.border,
    },
    iconColor: {
      color: colors.primary,
    },
  }));
