import { useLocalSearchParams, router, type Href } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { QuoteStatusBadge } from '@/components/quotes/quote-status-badge';
import { QuoteStatusFilterBar } from '@/components/quotes/quote-status-filter-bar';
import {
  DocumentActionsPanel,
  DocumentPreviewPanel,
} from '@/components/web/desktop/documents/document-panels';
import { DesktopPanel } from '@/components/web/desktop/desktop-panel';
import { DesktopTopHeader } from '@/components/web/desktop/desktop-top-header';
import { DesktopDataTable } from '@/components/web/desktop/ui/desktop-data-table';
import { DesktopPagination } from '@/components/web/desktop/ui/desktop-badge';
import { DesktopSearchInput } from '@/components/web/desktop/ui/desktop-search-input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useDocumentActions } from '@/hooks/use-document-actions';
import { useInfiniteQuotes } from '@/hooks/use-quotes';
import { useQuote } from '@/hooks/use-quote';
import { useQuoteMutations } from '@/hooks/use-quote-mutations';
import { useTenant } from '@/hooks/use-tenant';
import { formatDate } from '@/lib/format/date';
import { formatPriceHT } from '@/lib/format/currency';
import { buildQuotePdfHtml } from '@/lib/pdf/document-pdf';
import { useToast } from '@/providers/toast-provider';
import { requireScope } from '@/lib/tenant/scope';
import type { Quote } from '@/types/quote';
import type { QuoteStatusFilter } from '@/types/quotes-list';

type SortKey = 'date' | 'amount' | 'number';

export function QuotesDesktopScreen() {
  const styles = useStyles();
  const colors = useColors();
  const { user } = useAuth();
  const { scope, isSwitching } = useTenant();
  const { showSuccess, showError } = useToast();
  const { selected } = useLocalSearchParams<{ selected?: string | string[] }>();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<QuoteStatusFilter>('all');
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const debouncedSearch = useDebouncedValue(search, 300);

  useEffect(() => {
    const raw = selected;
    const id = Array.isArray(raw) ? raw[0] : raw;
    if (id) setSelectedId(id);
  }, [selected]);

  const {
    quotes: rawQuotes,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    data,
  } = useInfiniteQuotes(debouncedSearch, statusFilter);

  const totalCount = data?.pages[0]?.totalCount ?? null;

  const quotes = useMemo(() => {
    const sorted = [...rawQuotes];
    sorted.sort((a, b) => {
      if (sortKey === 'amount') return b.totalTtc - a.totalTtc;
      if (sortKey === 'number') return b.number.localeCompare(a.number);
      const dateA = new Date(a.issuedAt ?? a.createdAt).getTime();
      const dateB = new Date(b.issuedAt ?? b.createdAt).getTime();
      return dateB - dateA;
    });
    return sorted;
  }, [rawQuotes, sortKey]);

  const { data: selectedQuote } = useQuote(selectedId ?? '');
  const { duplicateQuote } = useQuoteMutations();
  const isInitialLoading = (isLoading || isSwitching) && quotes.length === 0;

  const buildHtml = useCallback(
    async (templateId?: string) => {
      if (!selectedQuote || !scope) return '';
      return buildQuotePdfHtml(
        requireScope(scope),
        selectedQuote,
        user?.email ?? null,
        templateId,
      );
    },
    [scope, selectedQuote, user?.email],
  );

  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewVersion, setPreviewVersion] = useState(0);

  const documentActions = useDocumentActions({
    documentType: 'quote',
    documentId: selectedId ?? '',
    documentNumber: selectedQuote?.number ?? '',
    clientEmail: selectedQuote?.clientEmail,
    clientName: selectedQuote?.clientName ?? '',
    buildHtml,
  });

  useEffect(() => {
    let active = true;
    setPreviewUri(null);
    setPreviewError(null);

    if (!selectedQuote || !scope) {
      setPreviewLoading(false);
      return () => { active = false; };
    }

    setPreviewLoading(true);
    void (async () => {
      try {
        const html = (await buildHtml()).trim();
        if (!html) throw new Error('Données insuffisantes pour générer le PDF.');
        const { generateHtmlAsPdf } = await import('@/lib/pdf/share');
        const pdf = await generateHtmlAsPdf(html, `${selectedQuote.number}.pdf`);
        if (active) {
          setPreviewUri(pdf.uri);
          setPreviewError(null);
        }
      } catch (error) {
        if (active) {
          setPreviewUri(null);
          setPreviewError(
            error instanceof Error ? error.message : 'Impossible de générer l’aperçu.',
          );
        }
      } finally {
        if (active) setPreviewLoading(false);
      }
    })();

    return () => { active = false; };
  }, [buildHtml, previewVersion, scope, selectedQuote]);

  function handleSelect(quoteId: string) {
    setSelectedId(quoteId);
    router.replace(`/documents/quotes?selected=${encodeURIComponent(quoteId)}` as Href);
  }

  async function handleDuplicate() {
    if (!selectedId) return;
    try {
      const dup = await duplicateQuote.mutateAsync(selectedId);
      showSuccess('Devis dupliqué.');
      handleSelect(dup.id);
    } catch {
      showError('Impossible de dupliquer le devis.');
    }
  }

  return (
    <View style={styles.root}>
      <DesktopTopHeader
        actions={
          <Button onPress={() => router.push('/documents/quotes/new' as Href)} title="Nouveau devis" />
        }
        subtitle="Créez, envoyez et suivez vos devis"
        title="Devis"
      />

      <View style={styles.workspace}>
        <DesktopPanel flex={1.15} flush style={styles.listPanel}>
          <View style={styles.toolbar}>
            <DesktopSearchInput onChangeText={setSearch} value={search} />
            <QuoteStatusFilterBar onChange={setStatusFilter} value={statusFilter} />
            <View style={styles.sortRow}>
              <Text style={styles.sortLabel}>Trier par</Text>
              <SortChip active={sortKey === 'date'} label="Date" onPress={() => setSortKey('date')} />
              <SortChip active={sortKey === 'amount'} label="Montant" onPress={() => setSortKey('amount')} />
              <SortChip active={sortKey === 'number'} label="N°" onPress={() => setSortKey('number')} />
            </View>
          </View>

          {isInitialLoading ? (
            <ActivityIndicator color={colors.primary} style={styles.loader} />
          ) : (
            <DesktopDataTable
              columns={[
                {
                  id: 'number',
                  label: 'Numéro',
                  width: 130,
                  render: (quote: Quote) => (
                    <View style={styles.numberCell}>
                      <Text numberOfLines={1} style={styles.primary}>{quote.number}</Text>
                      <QuoteStatusBadge status={quote.status} />
                    </View>
                  ),
                },
                {
                  id: 'client',
                  label: 'Client',
                  flex: 1,
                  render: (quote: Quote) => (
                    <Text numberOfLines={1} style={styles.secondary}>{quote.clientName}</Text>
                  ),
                },
                {
                  id: 'date',
                  label: 'Date',
                  width: 100,
                  render: (quote: Quote) => (
                    <Text style={styles.secondary}>
                      {formatDate(quote.issuedAt ?? quote.createdAt)}
                    </Text>
                  ),
                },
                {
                  id: 'amount',
                  label: 'Montant TTC',
                  width: 110,
                  align: 'right',
                  render: (quote: Quote) => (
                    <Text style={styles.primary}>{formatPriceHT(quote.totalTtc)}</Text>
                  ),
                },
              ]}
              data={quotes}
              emptyMessage="Aucun devis."
              keyExtractor={(quote) => quote.id}
              onRowPress={(quote) => handleSelect(quote.id)}
              selectedKey={selectedId}
            />
          )}

          <DesktopPagination
            hasMore={Boolean(hasNextPage)}
            loadedCount={quotes.length}
            loading={isFetchingNextPage}
            onLoadMore={() => fetchNextPage()}
            totalCount={totalCount}
          />
        </DesktopPanel>

        <View style={styles.rightColumn}>
          <DocumentPreviewPanel
            emptyMessage="Sélectionnez un devis pour afficher l’aperçu PDF."
            error={previewError}
            loading={previewLoading}
            onRetry={() => setPreviewVersion((v) => v + 1)}
            pdfUri={previewUri}
            title={selectedQuote?.number ?? 'Aperçu PDF'}
          />

          <DocumentActionsPanel
            documentId={selectedId ?? ''}
            documentNumber={selectedQuote?.number ?? ''}
            documentType="quote"
            downloadLoading={documentActions.loading}
            duplicateLoading={duplicateQuote.isPending}
            onDownload={() => void documentActions.handleShare()}
            onDuplicate={() => void handleDuplicate()}
            onEdit={
              selectedQuote
                ? () => router.push(`/documents/quotes/${selectedQuote.id}/edit` as Href)
                : undefined
            }
            onSend={() => void documentActions.handleSendEmail()}
            sendLoading={documentActions.emailLoading}
          />
        </View>
      </View>
    </View>
  );
}

function SortChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const styles = useChipStyles();
  return (
    <Pressable onPress={onPress} style={active ? styles.active : styles.chip}>
      <Text style={active ? styles.activeText : styles.text}>{label}</Text>
    </Pressable>
  );
}

const useStyles = () =>
  useThemedStyles((colors) => ({
    root: { flex: 1, minHeight: 0 },
    workspace: {
      flex: 1,
      flexDirection: 'row',
      gap: spacing.lg,
      padding: spacing.xl,
      minHeight: 0,
      backgroundColor: colors.backgroundGrouped,
    },
    listPanel: { minWidth: 0 },
    toolbar: {
      padding: spacing.md,
      gap: spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
      backgroundColor: colors.backgroundSecondary,
    },
    sortRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flexWrap: 'wrap' },
    sortLabel: { ...typography.caption1, color: colors.textTertiary, marginRight: spacing.xs },
    rightColumn: { flex: 0.85, gap: spacing.lg, minWidth: 360, minHeight: 0 },
    numberCell: { gap: 4 },
    primary: { ...typography.subheadlineMedium, color: colors.text },
    secondary: { ...typography.caption1, color: colors.textSecondary },
    loader: { marginTop: spacing.xl },
  }));

const useChipStyles = () =>
  useThemedStyles((colors) => ({
    chip: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: 999,
      backgroundColor: colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    active: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: 999,
      backgroundColor: colors.primarySubtle,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.primary,
    },
    text: { ...typography.caption2, color: colors.textSecondary },
    activeText: { ...typography.caption2, color: colors.primary, fontWeight: '600' },
  }));
