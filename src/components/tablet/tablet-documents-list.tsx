import { router, type Href } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { DocumentsFilterMenu } from '@/components/documents/documents-filter-menu';
import { DocumentsOverview } from '@/components/documents/documents-overview';
import { InvoiceSearchBar, InvoicesList } from '@/components/invoices';
import { QuoteSearchBar, QuotesList } from '@/components/quotes';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { spacing } from '@/constants/theme/spacing';
import { useThemedStyles } from '@/hooks/use-colors';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useInfiniteInvoices, useInvoiceStatusCounts } from '@/hooks/use-invoices';
import { useInfiniteQuotes, useQuoteStatusCounts } from '@/hooks/use-quotes';
import { useTenant } from '@/hooks/use-tenant';
import {
  INVOICE_STATUS_FILTER_OPTIONS,
  type InvoiceStatusFilter,
} from '@/types/invoices-list';
import {
  QUOTE_STATUS_FILTER_OPTIONS,
  type QuoteStatusFilter,
} from '@/types/quotes-list';

export type TabletDocumentsSegment = 'invoices' | 'quotes';

type TabletDocumentsListProps = {
  initialSegment?: TabletDocumentsSegment;
  selectedId?: string | null;
  selectedType?: 'invoice' | 'quote';
  onDismiss?: () => void;
};

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
              title={segment === 'invoices' ? 'Nouvelle facture' : 'Nouveau devis'}
            />
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

      {segment === 'invoices' ? (
        <TabletInvoicesPane
          onDismiss={onDismiss}
          selectedId={selectedType === 'invoice' ? selectedId : null}
        />
      ) : (
        <TabletQuotesPane
          onDismiss={onDismiss}
          selectedId={selectedType === 'quote' ? selectedId : null}
        />
      )}
    </SafeAreaView>
  );
}

function TabletInvoicesPane({
  selectedId,
  onDismiss,
}: {
  selectedId: string | null;
  onDismiss?: () => void;
}) {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<InvoiceStatusFilter>('all');
  const debouncedSearch = useDebouncedValue(search, 300);
  const { isSwitching } = useTenant();
  const statusCountsQuery = useInvoiceStatusCounts();
  const counts = statusCountsQuery.data;
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

  const overviewStats = useMemo(
    () => [
      { key: 'all', label: 'Total', value: counts?.all ?? 0 },
      {
        key: 'action',
        label: 'À traiter',
        value: (counts?.draft ?? 0) + (counts?.sent ?? 0),
        emphasis: 'warning' as const,
      },
      {
        key: 'overdue',
        label: 'En retard',
        value: counts?.overdue ?? 0,
        emphasis: 'danger' as const,
      },
      { key: 'paid', label: 'Payées', value: counts?.paid ?? 0 },
    ],
    [counts],
  );

  const filterOptions = useMemo(
    () =>
      INVOICE_STATUS_FILTER_OPTIONS.map((option) => ({
        value: option.value,
        label: option.label,
        count: counts?.[option.value],
      })),
    [counts],
  );

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  return (
    <View style={styles.pane}>
      <DocumentsOverview stats={overviewStats} />
      <View style={styles.toolbar}>
        <View style={styles.searchGrow}>
          <InvoiceSearchBar
            onChangeText={setSearch}
            placeholder="N° facture, client…"
            value={search}
          />
        </View>
        <DocumentsFilterMenu
          onChange={setStatusFilter}
          options={filterOptions}
          value={statusFilter}
        />
      </View>
      <View style={styles.list}>
        <InvoicesList
          contentContainerStyle={{ paddingBottom: insets.bottom + spacing.md }}
          invoices={invoices}
          isFetchingNextPage={isFetchingNextPage}
          isInitialLoading={isInitialLoading}
          isRefreshing={isRefetching && !isFetchingNextPage}
          isSearching={isSearching}
          onEndReached={handleEndReached}
          onInvoicePress={(invoice) => {
            onDismiss?.();
            router.replace(`/documents/invoices/${invoice.id}` as Href);
          }}
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
}: {
  selectedId: string | null;
  onDismiss?: () => void;
}) {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<QuoteStatusFilter>('all');
  const debouncedSearch = useDebouncedValue(search, 300);
  const { isSwitching } = useTenant();
  const statusCountsQuery = useQuoteStatusCounts();
  const counts = statusCountsQuery.data;
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

  const overviewStats = useMemo(
    () => [
      { key: 'all', label: 'Total', value: counts?.all ?? 0 },
      {
        key: 'draft',
        label: 'Brouillons',
        value: counts?.draft ?? 0,
        emphasis: 'warning' as const,
      },
      { key: 'sent', label: 'Envoyés', value: counts?.sent ?? 0 },
      { key: 'accepted', label: 'Acceptés', value: counts?.accepted ?? 0 },
    ],
    [counts],
  );

  const filterOptions = useMemo(
    () =>
      QUOTE_STATUS_FILTER_OPTIONS.map((option) => ({
        value: option.value,
        label: option.label,
        count: counts?.[option.value],
      })),
    [counts],
  );

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  return (
    <View style={styles.pane}>
      <DocumentsOverview stats={overviewStats} />
      <View style={styles.toolbar}>
        <View style={styles.searchGrow}>
          <QuoteSearchBar
            onChangeText={setSearch}
            placeholder="N° devis, client…"
            value={search}
          />
        </View>
        <DocumentsFilterMenu
          onChange={setStatusFilter}
          options={filterOptions}
          value={statusFilter}
        />
      </View>
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
      paddingBottom: spacing.md,
      gap: spacing.md,
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
      flexShrink: 1,
    },
    pane: {
      flex: 1,
      minHeight: 0,
      gap: spacing.sm,
      padding: spacing.md,
      backgroundColor: colors.backgroundGrouped,
    },
    toolbar: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.sm,
    },
    searchGrow: {
      flex: 1,
      minWidth: 0,
    },
    list: {
      flex: 1,
      minHeight: 0,
    },
    iconColor: {
      color: colors.primary,
    },
  }));
