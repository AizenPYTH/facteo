import { useLocalSearchParams, router, type Href } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { InvoiceStatusBadge } from '@/components/invoices/invoice-status-badge';
import { InvoiceStatusFilterBar } from '@/components/invoices/invoice-status-filter-bar';
import { PaymentModal } from '@/components/invoices/payment-modal';
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
import { useInvoice, useInfiniteInvoices } from '@/hooks/use-invoices';
import { useInvoiceMutations } from '@/hooks/use-invoice-mutations';
import { useTenant } from '@/hooks/use-tenant';
import { formatDate } from '@/lib/format/date';
import { formatPriceHT } from '@/lib/format/currency';
import { buildInvoicePdfHtml } from '@/lib/pdf/document-pdf';
import { useToast } from '@/providers/toast-provider';
import { requireScope } from '@/lib/tenant/scope';
import type { Invoice } from '@/types/invoice';
import type { InvoiceStatusFilter } from '@/types/invoices-list';

type SortKey = 'date' | 'amount' | 'number';

export function InvoicesDesktopScreen() {
  const styles = useStyles();
  const colors = useColors();
  const { user } = useAuth();
  const { scope, isSwitching } = useTenant();
  const { showSuccess, showError } = useToast();
  const { selected, status: statusParam } = useLocalSearchParams<{
    selected?: string | string[];
    status?: string | string[];
  }>();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<InvoiceStatusFilter>('all');
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [paymentVisible, setPaymentVisible] = useState(false);
  const debouncedSearch = useDebouncedValue(search, 300);

  useEffect(() => {
    const raw = selected;
    const id = Array.isArray(raw) ? raw[0] : raw;
    if (id) setSelectedId(id);
  }, [selected]);

  useEffect(() => {
    const raw = statusParam;
    const value = Array.isArray(raw) ? raw[0] : raw;
    if (value && value !== 'all') setStatusFilter(value as InvoiceStatusFilter);
  }, [statusParam]);

  const {
    invoices: rawInvoices,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    data,
  } = useInfiniteInvoices(debouncedSearch, statusFilter);

  const totalCount = data?.pages[0]?.totalCount ?? null;

  const invoices = useMemo(() => {
    const sorted = [...rawInvoices];
    sorted.sort((a, b) => {
      if (sortKey === 'amount') {
        return b.totalTtc - a.totalTtc;
      }
      if (sortKey === 'number') {
        return b.number.localeCompare(a.number);
      }
      const dateA = new Date(a.issuedAt ?? a.createdAt).getTime();
      const dateB = new Date(b.issuedAt ?? b.createdAt).getTime();
      return dateB - dateA;
    });
    return sorted;
  }, [rawInvoices, sortKey]);

  const { data: selectedInvoice } = useInvoice(selectedId ?? '');
  const { duplicateInvoice, addPayment } = useInvoiceMutations();
  const isInitialLoading = (isLoading || isSwitching) && invoices.length === 0;

  const buildHtml = useCallback(
    async (templateId?: string) => {
      if (!selectedInvoice || !scope) return '';
      return buildInvoicePdfHtml(
        requireScope(scope),
        selectedInvoice,
        user?.email ?? null,
        templateId,
      );
    },
    [scope, selectedInvoice, user?.email],
  );

  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewVersion, setPreviewVersion] = useState(0);

  const documentActions = useDocumentActions({
    documentType: 'invoice',
    documentId: selectedId ?? '',
    documentNumber: selectedInvoice?.number ?? '',
    clientEmail: selectedInvoice?.clientEmail,
    clientName: selectedInvoice?.clientName ?? '',
    buildHtml,
  });

  useEffect(() => {
    let active = true;
    setPreviewUri(null);
    setPreviewError(null);

    if (!selectedInvoice || !scope) {
      setPreviewLoading(false);
      return () => { active = false; };
    }

    setPreviewLoading(true);
    void (async () => {
      try {
        const html = (await buildHtml()).trim();
        if (!html) throw new Error('Données insuffisantes pour générer le PDF.');
        const { generateHtmlAsPdf } = await import('@/lib/pdf/share');
        const pdf = await generateHtmlAsPdf(html, `${selectedInvoice.number}.pdf`);
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
  }, [buildHtml, previewVersion, scope, selectedInvoice]);

  function handleSelect(invoiceId: string) {
    setSelectedId(invoiceId);
    router.replace(`/invoices?selected=${encodeURIComponent(invoiceId)}` as Href);
  }

  async function handleDuplicate() {
    if (!selectedId) return;
    try {
      const dup = await duplicateInvoice.mutateAsync(selectedId);
      showSuccess('Facture dupliquée.');
      handleSelect(dup.id);
    } catch {
      showError('Impossible de dupliquer la facture.');
    }
  }

  return (
    <View style={styles.root}>
      <DesktopTopHeader
        actions={
          <Button
            onPress={() => router.push('/invoices/new' as Href)}
            title="Nouvelle facture"
          />
        }
        subtitle="Gérez, envoyez et encaissez vos factures"
        title="Factures"
      />

      <View style={styles.workspace}>
        <DesktopPanel flex={1.15} flush style={styles.listPanel}>
          <View style={styles.toolbar}>
            <DesktopSearchInput onChangeText={setSearch} value={search} />
            <InvoiceStatusFilterBar onChange={setStatusFilter} value={statusFilter} />
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
                  render: (invoice: Invoice) => (
                    <View style={styles.numberCell}>
                      <Text numberOfLines={1} style={styles.primary}>{invoice.number}</Text>
                      <InvoiceStatusBadge status={invoice.status} />
                    </View>
                  ),
                },
                {
                  id: 'client',
                  label: 'Client',
                  flex: 1,
                  render: (invoice: Invoice) => (
                    <Text numberOfLines={1} style={styles.secondary}>{invoice.clientName}</Text>
                  ),
                },
                {
                  id: 'date',
                  label: 'Date',
                  width: 100,
                  render: (invoice: Invoice) => (
                    <Text style={styles.secondary}>
                      {formatDate(invoice.issuedAt ?? invoice.createdAt)}
                    </Text>
                  ),
                },
                {
                  id: 'amount',
                  label: 'Montant TTC',
                  width: 110,
                  align: 'right',
                  render: (invoice: Invoice) => (
                    <Text style={styles.primary}>{formatPriceHT(invoice.totalTtc)}</Text>
                  ),
                },
              ]}
              data={invoices}
              emptyMessage="Aucune facture."
              keyExtractor={(invoice) => invoice.id}
              onRowPress={(invoice) => handleSelect(invoice.id)}
              selectedKey={selectedId}
            />
          )}

          <DesktopPagination
            hasMore={Boolean(hasNextPage)}
            loadedCount={invoices.length}
            loading={isFetchingNextPage}
            onLoadMore={() => fetchNextPage()}
            totalCount={totalCount}
          />
        </DesktopPanel>

        <View style={styles.rightColumn}>
          <DocumentPreviewPanel
            emptyMessage="Sélectionnez une facture pour afficher l’aperçu PDF."
            error={previewError}
            loading={previewLoading}
            onRetry={() => setPreviewVersion((v) => v + 1)}
            pdfUri={previewUri}
            title={selectedInvoice?.number ?? 'Aperçu PDF'}
          />

          <DocumentActionsPanel
            documentId={selectedId ?? ''}
            documentNumber={selectedInvoice?.number ?? ''}
            documentType="invoice"
            downloadLoading={documentActions.loading}
            duplicateLoading={duplicateInvoice.isPending}
            onDownload={() => void documentActions.handleShare()}
            onDuplicate={() => void handleDuplicate()}
            onEdit={
              selectedInvoice
                ? () => router.push(`/invoices/${selectedInvoice.id}/edit` as Href)
                : undefined
            }
            onPayment={() => setPaymentVisible(true)}
            onSend={() => void documentActions.handleSendEmail()}
            sendLoading={documentActions.emailLoading}
            showPayment={Boolean(selectedInvoice && selectedInvoice.amountDue > 0)}
          />
        </View>
      </View>

      {selectedInvoice ? (
        <PaymentModal
          loading={addPayment.isPending}
          maxAmount={selectedInvoice.amountDue}
          onCancel={() => setPaymentVisible(false)}
          onConfirm={(input) => {
            void (async () => {
              try {
                await addPayment.mutateAsync({ invoiceId: selectedInvoice.id, input });
                setPaymentVisible(false);
                showSuccess('Paiement enregistré.');
              } catch {
                showError('Impossible d’enregistrer le paiement.');
              }
            })();
          }}
          visible={paymentVisible}
        />
      ) : null}
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
