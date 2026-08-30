import { router, useLocalSearchParams, type Href } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { DocumentsFilterMenu } from '@/components/documents/documents-filter-menu';
import { DocumentsOverview } from '@/components/documents/documents-overview';
import { FeatureIntroModal } from '@/components/feature-intros';
import { InvoiceSearchBar, InvoicesList } from '@/components/invoices';
import { QuoteSearchBar, QuotesList } from '@/components/quotes';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { IpadSplitShell } from '@/components/tablet/ipad-split-shell';
import {
  TabletDocumentsList,
  type TabletDocumentsSegment,
} from '@/components/tablet/tablet-documents-list';
import { BottomTabInset } from '@/constants/theme';
import { useThemedStyles, useColors } from '@/hooks/use-colors';
import { spacing } from '@/constants/theme/spacing';
import { radius } from '@/constants/theme/radius';
import { typography } from '@/constants/theme/typography';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useFeatureIntro } from '@/hooks/use-feature-intro';
import { useInfiniteInvoices, useInvoiceStatusCounts } from '@/hooks/use-invoices';
import { useInfiniteQuotes, useQuoteStatusCounts } from '@/hooks/use-quotes';
import { usePlanLimitGuard } from '@/hooks/use-plan-limit';
import { useTenant } from '@/hooks/use-tenant';
import {
  INVOICE_STATUS_FILTER_OPTIONS,
  type InvoiceStatusFilter,
} from '@/types/invoices-list';
import {
  QUOTE_STATUS_FILTER_OPTIONS,
  type QuoteStatusFilter,
} from '@/types/quotes-list';

const LIST_BOTTOM_CLEARANCE = 32;
const SEARCH_DEBOUNCE_MS = 300;

type DocumentsSegment = 'invoices' | 'quotes';

/**
 * Documents — workspace factures / devis (DESIGN §4).
 * Hiérarchie : titre + CTA créer · type · synthèse · recherche/filtre · liste.
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
  const { guardResource } = usePlanLimitGuard();

  useEffect(() => {
    return invoicesIntro.presentOnFirstVisit();
  }, [invoicesIntro.presentOnFirstVisit]);

  function handleSegmentChange(next: DocumentsSegment) {
    setSegment(next);
    if (next === 'quotes') {
      quotesIntro.present();
    }
  }

  async function handleCreate() {
    const allowed = await guardResource('documents');
    if (!allowed) return;
    const href =
      segment === 'invoices' ? '/documents/invoices/new' : '/documents/quotes/new';
    router.push(href as Href);
  }

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <AppText accessibilityRole="header" variant="display">
            Documents
          </AppText>
          <Pressable
            accessibilityLabel={segment === 'invoices' ? 'Nouvelle facture' : 'Nouveau devis'}
            accessibilityRole="button"
            onPress={() => {
              void handleCreate();
            }}
            style={({ pressed }) => [styles.createButton, pressed && styles.createButtonPressed]}>
            <SymbolView
              name={{ ios: 'plus', android: 'add', web: 'add' }}
              size={16}
              tintColor={colors.onInk}
              type="hierarchical"
            />
            <Text style={styles.createLabel}>
              {segment === 'invoices' ? 'Facture' : 'Devis'}
            </Text>
          </Pressable>
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
          accessibilityLabel="Filtrer les factures"
          onChange={setStatusFilter}
          options={filterOptions}
          value={statusFilter}
        />
      </View>
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
          onInvoicePress={(invoice) => router.push(`/documents/invoices/${invoice.id}` as Href)}
          onRefresh={handleRefresh}
          showCreateAction={false}
          statusFilter={statusFilter}
        />
      </View>
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
          accessibilityLabel="Filtrer les devis"
          onChange={setStatusFilter}
          options={filterOptions}
          value={statusFilter}
        />
      </View>
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
      paddingBottom: spacing.md,
      gap: spacing.md,
    },
    titleRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      gap: spacing.md,
    },
    createButton: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.xs,
      minHeight: 40,
      paddingHorizontal: spacing.md,
      borderRadius: radius.buttonSmall,
      backgroundColor: colors.ink,
    },
    createButtonPressed: {
      backgroundColor: colors.inkPressed,
    },
    createLabel: {
      ...typography.subheadlineMedium,
      color: colors.onInk,
    },
    pane: {
      flex: 1,
      gap: spacing.sm,
      paddingHorizontal: spacing.screenPaddingHorizontal,
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
    listContainer: {
      flex: 1,
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
