'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  useMutation,
  useQueryClient,
  type QueryClient,
  type QueryKey,
} from '@tanstack/react-query';
import {
  ArrowDownWideNarrow,
  CheckCircle2,
  Copy,
  Download,
  Eye,
  FileQuestion,
  Mail,
  Plus,
  Printer,
  Receipt,
  Send,
  Share2,
  type LucideIcon,
} from 'lucide-react';
import {
  canConvertQuoteToInvoice,
  canMarkInvoiceAsPaid,
  type InvoiceDetail,
} from '@inveq/types/invoice';
import type { QuoteDetail } from '@inveq/types/quote';
import type { InvoiceStatusFilter } from '@inveq/types/invoices-list';
import type { QuoteStatusFilter } from '@inveq/types/quotes-list';

import { ActionMenu, type ActionMenuItem } from '@/components/app/action-menu';
import { ActivityTimeline } from '@/components/app/activity-timeline';
import { AppDialog } from '@/components/app/app-dialog';
import { EmptyState, ErrorState, NoResultsState } from '@/components/app/empty-state';
import { DocumentQuickPreviewModal } from '@/components/app/document-quick-preview';
import { DocumentStatusTimeline } from '@/components/app/document-status-timeline';
import { MasterDetailLayout } from '@/components/app/master-detail';
import { PdfPreviewPanel } from '@/components/app/pdf-preview';
import { DetailSkeleton, TableSkeleton } from '@/components/app/skeleton';
import { AppSearchInput, AppTopBar } from '@/components/app/app-shell';
import {
  GhostButton,
  PrimaryButton,
  PrimaryLink,
  SecondaryButton,
} from '@/components/app/form-fields';
import { StatusBadge } from '@/components/app/status-badge';
import { DataTable, type DataTableColumn } from '@/components/app/ui';
import { ComposerTemplateSidebar } from '@/components/app/document-composer/template-sidebar';
import { useSettings } from '@/hooks/use-settings';
import { useInvoiceDetail } from '@/hooks/use-invoice-detail';
import { useInfiniteInvoices } from '@/hooks/use-invoices';
import { useInfiniteQuotes } from '@/hooks/use-quotes';
import { useQuoteDetail } from '@/hooks/use-quote-detail';
import { formatCurrency } from '@/lib/domain/format/currency';
import { formatDate } from '@/lib/domain/format/date';
import { useAuth } from '@/providers/auth-provider';
import { useTenant } from '@/providers/company-provider';
import { useToast } from '@/providers/toast-provider';
import { toUserFacingError } from '@/lib/errors/messages';
import {
  convertQuoteToInvoice,
  duplicateInvoice,
  fetchInvoiceById,
  markInvoiceAsPaid,
  updateInvoiceStatus,
} from '@/lib/domain/supabase/invoices';
import { duplicateQuote, fetchQuoteById, updateQuoteStatus } from '@/lib/domain/supabase/quotes';
import { getInvoiceErrorMessage } from '@/lib/invoices/errors';
import { getQuoteErrorMessage } from '@/lib/quotes/errors';
import { invoicesQueryKeys, quotesQueryKeys } from '@/lib/domain/supabase/query-keys';
import { buildInvoicePdfHtml, buildQuotePdfHtml } from '@/lib/domain/pdf/document-pdf';
import {
  downloadPdfFromHtml,
  openMailto,
  printPdfFromHtml,
  sharePdfFromHtml,
} from '@/lib/domain/pdf/document-actions';
import { getDefaultComposerTemplateId } from '@/lib/domain/pdf/composer-templates';
import { requireScope } from '@/lib/domain/tenant/scope';
import { cn } from '@/lib/utils';

type DocumentKind = 'invoice' | 'quote';

type ListItem = {
  id: string;
  number: string;
  clientName: string;
  issuedAt: string | null;
  dueOrValidAt: string | null;
  totalTtc: number;
  status: string;
};

type StatusFilter = { value: string; label: string };

type PrimaryAction = {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  pending?: boolean;
  disabled?: boolean;
};

/** Mêmes valeurs que `InvoiceStatusFilter`, dans l'ordre de lecture de la maquette. */
const INVOICE_FILTERS: StatusFilter[] = [
  { value: 'all', label: 'Tous' },
  { value: 'draft', label: 'Brouillons' },
  { value: 'sent', label: 'Envoyées' },
  { value: 'overdue', label: 'En retard' },
  { value: 'partially_paid', label: 'Partielles' },
  { value: 'paid', label: 'Payées' },
];

/** Mêmes valeurs que `QuoteStatusFilter`. */
const QUOTE_FILTERS: StatusFilter[] = [
  { value: 'all', label: 'Tous' },
  { value: 'draft', label: 'Brouillons' },
  { value: 'sent', label: 'Envoyés' },
  { value: 'accepted', label: 'Acceptés' },
  { value: 'rejected', label: 'Refusés' },
  { value: 'expired', label: 'Expirés' },
];

const INVOICE_FILTER_VALUES = INVOICE_FILTERS.map((filter) => filter.value);
const QUOTE_FILTER_VALUES = QUOTE_FILTERS.map((filter) => filter.value);

const ROW_ICON_BUTTON =
  'flex h-7 w-7 items-center justify-center rounded-app-icon text-app-muted-2 transition-colors duration-150 hover:bg-app-border-soft hover:text-app-accent disabled:cursor-not-allowed disabled:opacity-45';

/**
 * `?selected=` et `?status=` sont la source de vérité de la sélection et du filtre :
 * les deux se règlent sur la même instance d'URLSearchParams pour ne jamais perdre
 * les autres paramètres de l'écran (`create`, `client`, `fromProducts`).
 */
function useWorkspaceParams(allowedStatuses: string[]) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const selectedId = searchParams.get('selected');
  const rawStatus = searchParams.get('status');
  const status = rawStatus && allowedStatuses.includes(rawStatus) ? rawStatus : 'all';

  const setParams = useCallback(
    (next: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(next)) {
        if (value) params.set(key, value);
        else params.delete(key);
      }
      const qs = params.toString();
      router.replace(qs ? `?${qs}` : '?', { scroll: false });
    },
    [router, searchParams],
  );

  const setSelectedId = useCallback(
    (id: string | null) => setParams({ selected: id }),
    [setParams],
  );

  const setStatus = useCallback(
    (value: string) => setParams({ status: value === 'all' ? null : value }),
    [setParams],
  );

  return { selectedId, setSelectedId, status, setStatus };
}

/**
 * Compteurs des chips lus dans le cache TanStack Query : chaque filtre de statut a sa
 * propre entrée de liste et `totalCount` y est déjà renvoyé par la page. Lecture seule,
 * sans abonnement au cache (s'abonner déclencherait un rendu pendant celui d'un autre
 * composant) : un statut jamais consulté n'affiche pas de compteur.
 */
function readStatusCounts(
  queryClient: QueryClient,
  buildKey: (status: string) => QueryKey,
  statuses: string[],
): Record<string, number | undefined> {
  const counts: Record<string, number | undefined> = {};

  for (const status of statuses) {
    const cached = queryClient.getQueryData<{ pages: { totalCount: number | null }[] }>(
      buildKey(status),
    );
    const total = cached?.pages[0]?.totalCount;
    counts[status] = typeof total === 'number' ? total : undefined;
  }

  return counts;
}

function DocumentFilterBar({
  filters,
  counts,
  status,
  onStatusChange,
  search,
  onSearchChange,
}: {
  filters: StatusFilter[];
  counts: Record<string, number | undefined>;
  status: string;
  onStatusChange: (value: string) => void;
  search: string;
  onSearchChange: (value: string) => void;
}) {
  return (
    <>
      <div className="w-full min-w-[220px] flex-1 sm:max-w-[340px]">
        <AppSearchInput
          onChange={onSearchChange}
          placeholder="Numéro, client, montant…"
          value={search}
        />
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {filters.map((filter) => {
          const active = filter.value === status;
          const count = counts[filter.value];

          return (
            <button
              aria-pressed={active}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-app-chip border px-[11px] py-[7px] text-[12.5px] font-semibold transition-colors duration-150',
                active
                  ? 'border-app-accent-border bg-app-accent-tint text-app-accent-strong'
                  : 'border-app-border bg-app-surface text-app-text-3 hover:border-app-accent-border',
              )}
              key={filter.value}
              onClick={() => onStatusChange(filter.value)}
              type="button">
              {filter.label}
              {count !== undefined ? (
                <span
                  className={cn(
                    'app-num text-[11px] font-semibold',
                    active ? 'text-app-accent' : 'text-app-faint',
                  )}>
                  {count}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <p className="ml-auto flex shrink-0 items-center gap-1.5 text-[12.5px] font-semibold text-app-muted-2">
        <ArrowDownWideNarrow className="shrink-0" size={15} />
        Date d’émission
      </p>
    </>
  );
}

function BulkActionsBar({
  kind,
  count,
  busy,
  onDownload,
  onDuplicate,
  onClear,
}: {
  kind: DocumentKind;
  count: number;
  busy: boolean;
  onDownload: () => void;
  onDuplicate: () => void;
  onClear: () => void;
}) {
  const label =
    kind === 'invoice'
      ? `${count} facture${count > 1 ? 's' : ''} sélectionnée${count > 1 ? 's' : ''}`
      : `${count} devis sélectionné${count > 1 ? 's' : ''}`;

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-app-accent-border bg-app-accent-tint px-6 py-2.5">
      <p className="app-num text-[12.5px] font-semibold text-app-accent-strong">{label}</p>
      <div className="ml-auto flex flex-wrap items-center gap-2">
        <SecondaryButton disabled={busy} onClick={onDownload}>
          <Download className="text-app-muted-2" size={15} />
          Télécharger
        </SecondaryButton>
        <SecondaryButton disabled={busy} onClick={onDuplicate}>
          <Copy className="text-app-muted-2" size={15} />
          Dupliquer
        </SecondaryButton>
        <GhostButton onClick={onClear}>Tout désélectionner</GhostButton>
      </div>
    </div>
  );
}

function DocumentListPanel({
  kind,
  items,
  totalCount,
  selectedId,
  onSelect,
  isLoading,
  isFiltered,
  search,
  onClearFilters,
  hasMore,
  onLoadMore,
  loadingMore,
  newHref,
  onQuickPreview,
  onDownload,
  onDuplicate,
  busyRowId,
  selectedIds,
  onSelectionChange,
  bulkBusy,
  onBulkDownload,
  onBulkDuplicate,
}: {
  kind: DocumentKind;
  items: ListItem[];
  totalCount: number | null;
  selectedId: string | null;
  onSelect: (id: string) => void;
  isLoading: boolean;
  isFiltered: boolean;
  search: string;
  onClearFilters: () => void;
  hasMore: boolean;
  onLoadMore: () => void;
  loadingMore: boolean;
  newHref: string;
  onQuickPreview: (id: string) => void;
  onDownload: (id: string) => void;
  onDuplicate: (id: string) => void;
  busyRowId: string | null;
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  bulkBusy: boolean;
  onBulkDownload: () => void;
  onBulkDuplicate: () => void;
}) {
  const noun = kind === 'invoice' ? 'facture' : 'devis';
  const plural = kind === 'invoice' ? 'factures' : 'devis';
  const lateStatus = kind === 'invoice' ? 'overdue' : 'expired';

  const columns: DataTableColumn[] = [
    { key: 'number', label: 'Numéro' },
    { key: 'client', label: 'Client' },
    { key: 'issued', label: 'Émission', className: 'max-lg:hidden' },
    { key: 'due', label: kind === 'invoice' ? 'Échéance' : 'Validité', className: 'max-md:hidden' },
    { key: 'total', label: 'Total TTC', align: 'right' },
    { key: 'status', label: 'Statut' },
    { key: 'actions', label: '', className: 'w-[112px]' },
  ];

  const rows = items.map((item) => ({
    id: item.id,
    number: <span className="app-num font-semibold text-app-text">{item.number}</span>,
    client: <span className="block truncate">{item.clientName}</span>,
    issued: <span className="app-num text-app-muted">{formatDate(item.issuedAt)}</span>,
    due: (
      <span
        className={cn(
          'app-num',
          item.status === lateStatus ? 'font-semibold text-app-danger-text' : 'text-app-muted',
        )}>
        {formatDate(item.dueOrValidAt)}
      </span>
    ),
    total: formatCurrency(item.totalTtc),
    status: <StatusBadge kind={kind} status={item.status} />,
    actions: (
      <div className="flex items-center justify-end gap-0.5 transition-opacity duration-150 max-lg:opacity-100 lg:opacity-0 lg:group-focus-within:opacity-100 lg:group-hover:opacity-100">
        <button
          aria-label="Aperçu rapide"
          className={ROW_ICON_BUTTON}
          onClick={(event) => {
            event.stopPropagation();
            onQuickPreview(item.id);
          }}
          title="Aperçu rapide"
          type="button">
          <Eye size={15} />
        </button>
        <button
          aria-label="Télécharger le PDF"
          className={ROW_ICON_BUTTON}
          disabled={busyRowId === item.id}
          onClick={(event) => {
            event.stopPropagation();
            onDownload(item.id);
          }}
          title="Télécharger le PDF"
          type="button">
          <Download size={15} />
        </button>
        <ActionMenu
          items={[
            {
              key: 'open',
              label: 'Ouvrir le détail',
              icon: Eye,
              onSelect: () => onSelect(item.id),
            },
            {
              key: 'duplicate',
              label: 'Dupliquer',
              icon: Copy,
              onSelect: () => onDuplicate(item.id),
            },
          ]}
        />
      </div>
    ),
  }));

  if (isLoading) {
    return (
      <div className="p-6">
        <TableSkeleton rows={8} />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="p-6">
        {isFiltered ? (
          <NoResultsState
            description={
              kind === 'invoice'
                ? 'Aucune facture ne correspond à cette recherche ou à ce filtre de statut.'
                : 'Aucun devis ne correspond à cette recherche ou à ce filtre de statut.'
            }
            onClear={onClearFilters}
            query={search}
          />
        ) : (
          <EmptyState
            action={
              <PrimaryLink href={newHref}>
                <Plus size={15} />
                {kind === 'invoice' ? 'Créer une facture' : 'Créer un devis'}
              </PrimaryLink>
            }
            description={
              kind === 'invoice'
                ? 'Créez votre première facture : sélectionnez un client, ajoutez vos lignes, envoyez-la en un clic.'
                : 'Créez votre premier devis : sélectionnez un client, ajoutez vos lignes depuis le catalogue, envoyez-le en un clic.'
            }
            title={kind === 'invoice' ? 'Aucune facture pour le moment' : 'Aucun devis pour le moment'}
          />
        )}
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      {selectedIds.length > 0 ? (
        <BulkActionsBar
          busy={bulkBusy}
          count={selectedIds.length}
          kind={kind}
          onClear={() => onSelectionChange([])}
          onDownload={onBulkDownload}
          onDuplicate={onBulkDuplicate}
        />
      ) : null}

      <DataTable
        activeRowId={selectedId}
        className="min-h-0 flex-1 rounded-none border-0"
        columns={columns}
        onRowClick={(row) => onSelect(String(row.id))}
        onSelectionChange={onSelectionChange}
        rows={rows}
        selectable
        selectedIds={selectedIds}
      />

      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-app-border-soft px-6 py-3.5">
        <p className="app-num text-[12.5px] text-app-muted-2">
          {totalCount !== null
            ? `${items.length} sur ${totalCount} ${totalCount > 1 ? plural : noun}`
            : `${items.length} ${items.length > 1 ? plural : noun}`}
        </p>
        {hasMore ? (
          <SecondaryButton
            className="text-app-accent hover:border-app-accent-border hover:bg-app-accent-soft"
            disabled={loadingMore}
            onClick={onLoadMore}>
            {loadingMore
              ? 'Chargement…'
              : totalCount !== null
                ? `Charger ${Math.max(totalCount - items.length, 0)} de plus`
                : 'Charger plus'}
          </SecondaryButton>
        ) : null}
      </div>
    </div>
  );
}

function DetailField({ label, value, tone }: { label: string; value: string; tone?: 'danger' }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-app-faint">
        {label}
      </p>
      <p
        className={cn(
          'app-num mt-[3px] text-[13px] font-medium',
          tone === 'danger' ? 'text-app-danger-text' : 'text-app-text',
        )}>
        {value}
      </p>
    </div>
  );
}

/** Ordre imposé par le handoff §4.2 : identité → montant → action primaire → frise → dates et totaux → aperçu → historique. */
function DocumentDetailPanel({
  kind,
  document,
  amountMeta,
  dueOrValid,
  dueIsLate,
  primaryAction,
  menuItems,
  onDownload,
  downloadBusy,
  templateId,
  onTemplateChange,
  onOpenPreview,
}: {
  kind: DocumentKind;
  document: InvoiceDetail | QuoteDetail;
  amountMeta: string;
  dueOrValid: string | null;
  dueIsLate: boolean;
  primaryAction: PrimaryAction;
  menuItems: ActionMenuItem[];
  onDownload: () => void;
  downloadBusy: boolean;
  templateId: string;
  onTemplateChange: (id: string) => void;
  onOpenPreview: () => void;
}) {
  const PrimaryIcon = primaryAction.icon;

  return (
    <div className="flex flex-col">
      <div className="border-b border-app-border-soft px-5 py-[18px]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-app-faint">
              {kind === 'invoice' ? 'Facture' : 'Devis'}
            </p>
            <h2 className="mt-[3px] truncate text-[18px] font-semibold tracking-[-0.01em] text-app-text">
              {document.number}
            </h2>
            <p className="mt-[3px] truncate text-[13px] text-app-muted">{document.clientName}</p>
          </div>
          <StatusBadge kind={kind} status={document.status} />
        </div>

        <p className="app-num mt-4 text-[27px] font-semibold tracking-[-0.03em] text-app-text">
          {formatCurrency(document.totalTtc)}
        </p>
        <p className="mt-1 text-[12.5px] text-app-muted">{amountMeta}</p>

        <div className="mt-4 flex items-center gap-2">
          <PrimaryButton
            className="flex-1 py-2.5"
            disabled={primaryAction.pending || primaryAction.disabled}
            onClick={primaryAction.onClick}>
            <PrimaryIcon size={15} />
            {primaryAction.label}
          </PrimaryButton>
          <SecondaryButton
            aria-label="Télécharger le PDF"
            className="w-10 shrink-0 px-0"
            disabled={downloadBusy}
            onClick={onDownload}
            title="Télécharger le PDF">
            <Download size={16} />
          </SecondaryButton>
          <ActionMenu
            iconSize={16}
            items={menuItems}
            triggerClassName="h-[38px] w-10 shrink-0 rounded-app-control border border-app-border text-app-muted hover:bg-app-hover"
          />
        </div>
      </div>

      <div className="border-b border-app-border-soft px-5 py-4">
        <DocumentStatusTimeline kind={kind} status={document.status} />
      </div>

      <div className="grid grid-cols-2 gap-3 border-b border-app-border-soft px-5 py-4">
        <DetailField label="Émission" value={formatDate(document.issuedAt)} />
        <DetailField
          label={kind === 'invoice' ? 'Échéance' : 'Validité'}
          tone={dueIsLate ? 'danger' : undefined}
          value={formatDate(dueOrValid)}
        />
        <DetailField label="Total HT" value={formatCurrency(document.subtotalHt)} />
        <DetailField label="TVA" value={formatCurrency(document.totalVat)} />
      </div>

      <div className="border-b border-app-border-soft px-5 py-4">
        <div className="mb-2.5 flex items-center justify-between gap-2">
          <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-app-faint">
            Aperçu PDF
          </p>
          <GhostButton className="px-2.5 py-1.5 text-[12px]" onClick={onOpenPreview}>
            Ouvrir en grand
          </GhostButton>
        </div>
        <div className="h-[220px] overflow-hidden rounded-app-control border border-app-border">
          <PdfPreviewPanel document={document} kind={kind} templateId={templateId} />
        </div>
        <div className="mt-3">
          <ComposerTemplateSidebar onChange={onTemplateChange} value={templateId} />
        </div>
      </div>

      <ActivityTimeline documentId={document.id} documentType={kind} />
    </div>
  );
}

export function InvoicesWorkspace() {
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [previewTemplateId, setPreviewTemplateId] = useState('');
  const [quickPreviewId, setQuickPreviewId] = useState<string | null>(null);
  const [pdfBusyKey, setPdfBusyKey] = useState<string | null>(null);
  const [checkedIds, setCheckedIds] = useState<string[]>([]);
  const [duplicateConfirmOpen, setDuplicateConfirmOpen] = useState(false);
  const { selectedId, setSelectedId, status, setStatus } =
    useWorkspaceParams(INVOICE_FILTER_VALUES);
  const { user } = useAuth();
  const { scope } = useTenant();
  const { settings } = useSettings();
  const { showSuccess, showError } = useToast();
  const queryClient = useQueryClient();
  const listQuery = useInfiniteInvoices(search, status as InvoiceStatusFilter);
  const detailQuery = useInvoiceDetail(selectedId);

  const items = useMemo(
    () =>
      listQuery.data?.pages
        .flatMap((p) => p.invoices)
        .map<ListItem>((invoice) => ({
          id: invoice.id,
          number: invoice.number,
          clientName: invoice.clientName,
          issuedAt: invoice.issuedAt,
          dueOrValidAt: invoice.dueAt,
          totalTtc: invoice.totalTtc,
          status: invoice.status,
        })) ?? [],
    [listQuery.data],
  );

  const totalCount = listQuery.data?.pages[0]?.totalCount ?? null;
  const companyId = scope?.companyId ?? 'anonymous';

  const statusCounts = readStatusCounts(
    queryClient,
    (value) => invoicesQueryKeys.infiniteList(companyId, search, value),
    INVOICE_FILTER_VALUES,
  );

  /** La sélection ne survit pas à un changement de filtre : elle est recalculée sur les lignes visibles. */
  const selection = useMemo(
    () => checkedIds.filter((id) => items.some((item) => item.id === id)),
    [checkedIds, items],
  );

  const detail = detailQuery.data;

  useEffect(() => {
    if (detail) {
      setPreviewTemplateId(getDefaultComposerTemplateId('invoice', settings));
    }
  }, [detail?.id, settings]);

  async function runPdfAction(mode: 'download' | 'print' | 'share') {
    if (!detail || !scope) return;
    setActionLoading(mode);
    try {
      const html = await buildInvoicePdfHtml(
        requireScope(scope),
        detail,
        user?.email,
        previewTemplateId || undefined,
      );
      if (mode === 'download') await downloadPdfFromHtml(html, detail.number);
      else if (mode === 'print') await printPdfFromHtml(html);
      else await sharePdfFromHtml(html, detail.number, `Facture ${detail.number}`);
    } finally {
      setActionLoading(null);
    }
  }

  const duplicateMutation = useMutation({
    mutationFn: (invoiceId: string) => duplicateInvoice(requireScope(scope), invoiceId),
    onSuccess: (invoice) => {
      void queryClient.invalidateQueries({ queryKey: invoicesQueryKeys.all });
      setSelectedId(invoice.id);
      showSuccess(`Facture dupliquée en ${invoice.number}.`);
    },
    onError: (error) => showError(toUserFacingError(error.message)),
  });

  const sendMutation = useMutation({
    mutationFn: (invoiceId: string) => updateInvoiceStatus(requireScope(scope), invoiceId, 'sent'),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: invoicesQueryKeys.all });
      showSuccess('Facture marquée comme envoyée.');
    },
    onError: (error) => showError(toUserFacingError(error.message)),
  });

  const markPaidMutation = useMutation({
    mutationFn: (invoiceId: string) => markInvoiceAsPaid(requireScope(scope), invoiceId),
    onSuccess: (invoice) => {
      void queryClient.invalidateQueries({ queryKey: invoicesQueryKeys.all });
      showSuccess(`Facture ${invoice.number} marquée comme payée.`);
    },
    onError: (error) => showError(getInvoiceErrorMessage(error.message)),
  });

  const bulkDuplicateMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const activeScope = requireScope(scope);
      const numbers: string[] = [];
      for (const id of ids) {
        const created = await duplicateInvoice(activeScope, id);
        numbers.push(created.number);
      }
      return numbers;
    },
    onSuccess: (numbers) => {
      void queryClient.invalidateQueries({ queryKey: invoicesQueryKeys.all });
      setCheckedIds([]);
      showSuccess(
        numbers.length > 1
          ? `${numbers.length} factures dupliquées.`
          : `Facture dupliquée en ${numbers[0]}.`,
      );
    },
    onError: (error) => {
      void queryClient.invalidateQueries({ queryKey: invoicesQueryKeys.all });
      showError(toUserFacingError(error.message));
    },
  });

  /** Le PDF d'une ligne non sélectionnée passe par le cache de détail déjà utilisé par le panneau. */
  async function downloadPdfs(ids: string[], busyKey: string) {
    if (!scope || ids.length === 0) return;
    const activeScope = requireScope(scope);
    setPdfBusyKey(busyKey);
    try {
      for (const id of ids) {
        const invoice = await queryClient.fetchQuery({
          queryKey: invoicesQueryKeys.detail(activeScope.companyId, id),
          queryFn: () => fetchInvoiceById(activeScope, id),
        });
        if (!invoice) throw new Error('Facture introuvable.');
        const html = await buildInvoicePdfHtml(activeScope, invoice, user?.email);
        await downloadPdfFromHtml(html, invoice.number);
      }
      if (ids.length > 1) showSuccess(`${ids.length} PDF téléchargés.`);
    } catch (error) {
      showError(toUserFacingError(error instanceof Error ? error.message : ''));
    } finally {
      setPdfBusyKey(null);
    }
  }

  function clearFilters() {
    setSearch('');
    setStatus('all');
    setCheckedIds([]);
  }

  function invoicePrimaryAction(invoice: InvoiceDetail): PrimaryAction {
    if (invoice.status === 'draft') {
      return {
        label: 'Envoyer la facture',
        icon: Send,
        onClick: () => sendMutation.mutate(invoice.id),
        pending: sendMutation.isPending,
      };
    }

    if (canMarkInvoiceAsPaid(invoice.status)) {
      return {
        label: 'Marquer comme payée',
        icon: CheckCircle2,
        onClick: () => markPaidMutation.mutate(invoice.id),
        pending: markPaidMutation.isPending,
      };
    }

    return {
      label: 'Télécharger le PDF',
      icon: Download,
      onClick: () => void runPdfAction('download'),
      pending: actionLoading === 'download',
    };
  }

  /** Les six actions de l'ancienne grille : elles vivent désormais dans le menu « … ». */
  function invoiceMenuItems(invoice: InvoiceDetail): ActionMenuItem[] {
    return [
      {
        key: 'send',
        label: 'Envoyer la facture',
        icon: Send,
        onSelect: () => sendMutation.mutate(invoice.id),
        disabled: sendMutation.isPending,
      },
      {
        key: 'download',
        label: 'Télécharger le PDF',
        icon: Download,
        onSelect: () => void runPdfAction('download'),
        disabled: actionLoading !== null,
      },
      {
        key: 'print',
        label: 'Imprimer',
        icon: Printer,
        onSelect: () => void runPdfAction('print'),
        disabled: actionLoading !== null,
      },
      {
        key: 'share',
        label: 'Partager',
        icon: Share2,
        onSelect: () => void runPdfAction('share'),
        disabled: actionLoading !== null,
      },
      {
        key: 'email',
        label: 'Envoyer par e-mail',
        icon: Mail,
        onSelect: () =>
          openMailto(
            invoice.clientEmail,
            `Facture ${invoice.number}`,
            `Bonjour,\n\nVeuillez trouver ci-joint la facture ${invoice.number}.\n\nCordialement`,
          ),
      },
      {
        key: 'duplicate',
        label: 'Dupliquer',
        icon: Copy,
        onSelect: () => duplicateMutation.mutate(invoice.id),
        disabled: duplicateMutation.isPending,
      },
    ];
  }

  return (
    <>
      <AppTopBar
        count={totalCount !== null ? `${totalCount} ${totalCount > 1 ? 'factures' : 'facture'}` : null}
        title="Factures"
        toolbar={
          <DocumentFilterBar
            counts={statusCounts}
            filters={INVOICE_FILTERS}
            onSearchChange={setSearch}
            onStatusChange={setStatus}
            search={search}
            status={status}
          />
        }>
        <PrimaryLink href="/app/invoices?create=1">
          <Plus size={16} />
          Nouvelle facture
        </PrimaryLink>
      </AppTopBar>

      <DocumentQuickPreviewModal
        documentId={quickPreviewId}
        kind="invoice"
        onClose={() => setQuickPreviewId(null)}
        open={Boolean(quickPreviewId)}
      />

      <div className="min-h-0 flex-1">
        <MasterDetailLayout
          detail={
            detailQuery.isLoading && selectedId ? (
              <DetailSkeleton />
            ) : detailQuery.error ? (
              <div className="p-6">
                <ErrorState onRetry={() => void detailQuery.refetch()} />
              </div>
            ) : !detail ? (
              <div className="p-5">
                <EmptyState
                  action={
                    <SecondaryButton onClick={() => setSelectedId(null)}>Fermer</SecondaryButton>
                  }
                  description="Cette facture n’existe plus ou n’est pas accessible depuis cet espace."
                  icon={FileQuestion}
                  title="Facture introuvable"
                />
              </div>
            ) : (
              <DocumentDetailPanel
                amountMeta={
                  detail.status === 'paid'
                    ? 'Réglée intégralement'
                    : detail.amountPaid > 0
                      ? `Reste à payer ${formatCurrency(detail.amountDue)} sur ${formatCurrency(detail.totalTtc)}`
                      : 'Montant TTC'
                }
                document={detail}
                downloadBusy={actionLoading === 'download'}
                dueIsLate={detail.status === 'overdue'}
                dueOrValid={detail.dueAt}
                kind="invoice"
                menuItems={invoiceMenuItems(detail)}
                onDownload={() => void runPdfAction('download')}
                onOpenPreview={() => setQuickPreviewId(detail.id)}
                onTemplateChange={setPreviewTemplateId}
                primaryAction={invoicePrimaryAction(detail)}
                templateId={previewTemplateId}
              />
            )
          }
          detailOpen={Boolean(selectedId)}
          detailTitle="Facture"
          list={
            <DocumentListPanel
              bulkBusy={pdfBusyKey !== null || bulkDuplicateMutation.isPending}
              busyRowId={pdfBusyKey}
              hasMore={Boolean(listQuery.hasNextPage)}
              isFiltered={search.trim().length > 0 || status !== 'all'}
              isLoading={listQuery.isLoading}
              items={items}
              kind="invoice"
              loadingMore={listQuery.isFetchingNextPage}
              newHref="/app/invoices?create=1"
              onBulkDownload={() => void downloadPdfs(selection, 'bulk')}
              onBulkDuplicate={() => setDuplicateConfirmOpen(true)}
              onClearFilters={clearFilters}
              onDownload={(id) => void downloadPdfs([id], id)}
              onDuplicate={(id) => duplicateMutation.mutate(id)}
              onLoadMore={() => void listQuery.fetchNextPage()}
              onQuickPreview={setQuickPreviewId}
              onSelect={setSelectedId}
              onSelectionChange={setCheckedIds}
              search={search}
              selectedId={selectedId}
              selectedIds={selection}
              totalCount={totalCount}
            />
          }
          onCloseDetail={() => setSelectedId(null)}
        />
      </div>

      <AppDialog
        description="Chaque facture sélectionnée sera recopiée en brouillon avec un nouveau numéro."
        footer={
          <>
            <SecondaryButton onClick={() => setDuplicateConfirmOpen(false)}>Annuler</SecondaryButton>
            <PrimaryButton
              disabled={bulkDuplicateMutation.isPending}
              onClick={() => {
                setDuplicateConfirmOpen(false);
                bulkDuplicateMutation.mutate(selection);
              }}>
              Dupliquer
            </PrimaryButton>
          </>
        }
        icon={Copy}
        onClose={() => setDuplicateConfirmOpen(false)}
        open={duplicateConfirmOpen}
        size="sm"
        title={`Dupliquer ${selection.length} facture${selection.length > 1 ? 's' : ''} ?`}
      />
    </>
  );
}

export function QuotesWorkspace() {
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [previewTemplateId, setPreviewTemplateId] = useState('');
  const [quickPreviewId, setQuickPreviewId] = useState<string | null>(null);
  const [pdfBusyKey, setPdfBusyKey] = useState<string | null>(null);
  const [checkedIds, setCheckedIds] = useState<string[]>([]);
  const [duplicateConfirmOpen, setDuplicateConfirmOpen] = useState(false);
  const { selectedId, setSelectedId, status, setStatus } = useWorkspaceParams(QUOTE_FILTER_VALUES);
  const router = useRouter();
  const { user } = useAuth();
  const { scope } = useTenant();
  const { settings } = useSettings();
  const { showSuccess, showError } = useToast();
  const queryClient = useQueryClient();
  const listQuery = useInfiniteQuotes(search, status as QuoteStatusFilter);
  const detailQuery = useQuoteDetail(selectedId);

  const items = useMemo(
    () =>
      listQuery.data?.pages
        .flatMap((p) => p.quotes)
        .map<ListItem>((quote) => ({
          id: quote.id,
          number: quote.number,
          clientName: quote.clientName,
          issuedAt: quote.issuedAt,
          dueOrValidAt: quote.validUntil,
          totalTtc: quote.totalTtc,
          status: quote.status,
        })) ?? [],
    [listQuery.data],
  );

  const totalCount = listQuery.data?.pages[0]?.totalCount ?? null;
  const companyId = scope?.companyId ?? 'anonymous';

  const statusCounts = readStatusCounts(
    queryClient,
    (value) => quotesQueryKeys.infiniteList(companyId, search, value),
    QUOTE_FILTER_VALUES,
  );

  /** La sélection ne survit pas à un changement de filtre : elle est recalculée sur les lignes visibles. */
  const selection = useMemo(
    () => checkedIds.filter((id) => items.some((item) => item.id === id)),
    [checkedIds, items],
  );

  const detail = detailQuery.data;

  useEffect(() => {
    if (detail) {
      setPreviewTemplateId(getDefaultComposerTemplateId('quote', settings));
    }
  }, [detail?.id, settings]);

  async function runPdfAction(mode: 'download' | 'print' | 'share') {
    if (!detail || !scope) return;
    setActionLoading(mode);
    try {
      const html = await buildQuotePdfHtml(
        requireScope(scope),
        detail,
        user?.email,
        previewTemplateId || undefined,
      );
      if (mode === 'download') await downloadPdfFromHtml(html, detail.number);
      else if (mode === 'print') await printPdfFromHtml(html);
      else await sharePdfFromHtml(html, detail.number, `Devis ${detail.number}`);
    } finally {
      setActionLoading(null);
    }
  }

  const duplicateMutation = useMutation({
    mutationFn: (quoteId: string) => duplicateQuote(requireScope(scope), quoteId),
    onSuccess: (quote) => {
      void queryClient.invalidateQueries({ queryKey: quotesQueryKeys.all });
      setSelectedId(quote.id);
      showSuccess(`Devis dupliqué en ${quote.number}.`);
    },
    onError: (error) => showError(toUserFacingError(error.message)),
  });

  const sendMutation = useMutation({
    mutationFn: (quoteId: string) => updateQuoteStatus(requireScope(scope), quoteId, 'sent'),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: quotesQueryKeys.all });
      showSuccess('Devis marqué comme envoyé.');
    },
    onError: (error) => showError(toUserFacingError(error.message)),
  });

  const convertMutation = useMutation({
    mutationFn: (quoteId: string) => convertQuoteToInvoice(requireScope(scope), quoteId),
    onSuccess: (invoice) => {
      void queryClient.invalidateQueries({ queryKey: quotesQueryKeys.all });
      void queryClient.invalidateQueries({ queryKey: invoicesQueryKeys.all });
      showSuccess(`Devis converti en facture ${invoice.number}.`);
      router.push(`/app/invoices?selected=${invoice.id}`);
    },
    onError: (error) => showError(getQuoteErrorMessage(error.message)),
  });

  const bulkDuplicateMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const activeScope = requireScope(scope);
      const numbers: string[] = [];
      for (const id of ids) {
        const created = await duplicateQuote(activeScope, id);
        numbers.push(created.number);
      }
      return numbers;
    },
    onSuccess: (numbers) => {
      void queryClient.invalidateQueries({ queryKey: quotesQueryKeys.all });
      setCheckedIds([]);
      showSuccess(
        numbers.length > 1
          ? `${numbers.length} devis dupliqués.`
          : `Devis dupliqué en ${numbers[0]}.`,
      );
    },
    onError: (error) => {
      void queryClient.invalidateQueries({ queryKey: quotesQueryKeys.all });
      showError(toUserFacingError(error.message));
    },
  });

  /** Le PDF d'une ligne non sélectionnée passe par le cache de détail déjà utilisé par le panneau. */
  async function downloadPdfs(ids: string[], busyKey: string) {
    if (!scope || ids.length === 0) return;
    const activeScope = requireScope(scope);
    setPdfBusyKey(busyKey);
    try {
      for (const id of ids) {
        const quote = await queryClient.fetchQuery({
          queryKey: quotesQueryKeys.detail(activeScope.companyId, id),
          queryFn: () => fetchQuoteById(activeScope, id),
        });
        if (!quote) throw new Error('Devis introuvable.');
        const html = await buildQuotePdfHtml(activeScope, quote, user?.email);
        await downloadPdfFromHtml(html, quote.number);
      }
      if (ids.length > 1) showSuccess(`${ids.length} PDF téléchargés.`);
    } catch (error) {
      showError(toUserFacingError(error instanceof Error ? error.message : ''));
    } finally {
      setPdfBusyKey(null);
    }
  }

  function relanceMailto(quote: QuoteDetail) {
    openMailto(
      quote.clientEmail,
      `Devis ${quote.number}`,
      `Bonjour,\n\nVeuillez trouver ci-joint le devis ${quote.number}.\n\nCordialement`,
    );
  }

  function clearFilters() {
    setSearch('');
    setStatus('all');
    setCheckedIds([]);
  }

  function quotePrimaryAction(quote: QuoteDetail): PrimaryAction {
    if (quote.status === 'draft') {
      return {
        label: 'Envoyer le devis',
        icon: Send,
        onClick: () => sendMutation.mutate(quote.id),
        pending: sendMutation.isPending,
      };
    }

    if (canConvertQuoteToInvoice(quote.status)) {
      return {
        label: 'Convertir en facture',
        icon: Receipt,
        onClick: () => convertMutation.mutate(quote.id),
        pending: convertMutation.isPending,
      };
    }

    if (quote.status === 'sent' || quote.status === 'expired') {
      return {
        label: 'Relancer le client',
        icon: Mail,
        onClick: () => relanceMailto(quote),
      };
    }

    return {
      label: 'Télécharger le PDF',
      icon: Download,
      onClick: () => void runPdfAction('download'),
      pending: actionLoading === 'download',
    };
  }

  /** Les six actions de l'ancienne grille : elles vivent désormais dans le menu « … ». */
  function quoteMenuItems(quote: QuoteDetail): ActionMenuItem[] {
    return [
      {
        key: 'send',
        label: 'Envoyer le devis',
        icon: Send,
        onSelect: () => sendMutation.mutate(quote.id),
        disabled: sendMutation.isPending,
      },
      {
        key: 'download',
        label: 'Télécharger le PDF',
        icon: Download,
        onSelect: () => void runPdfAction('download'),
        disabled: actionLoading !== null,
      },
      {
        key: 'print',
        label: 'Imprimer',
        icon: Printer,
        onSelect: () => void runPdfAction('print'),
        disabled: actionLoading !== null,
      },
      {
        key: 'share',
        label: 'Partager',
        icon: Share2,
        onSelect: () => void runPdfAction('share'),
        disabled: actionLoading !== null,
      },
      {
        key: 'email',
        label: 'Envoyer par e-mail',
        icon: Mail,
        onSelect: () => relanceMailto(quote),
      },
      {
        key: 'duplicate',
        label: 'Dupliquer',
        icon: Copy,
        onSelect: () => duplicateMutation.mutate(quote.id),
        disabled: duplicateMutation.isPending,
      },
    ];
  }

  return (
    <>
      <AppTopBar
        count={totalCount !== null ? `${totalCount} devis` : null}
        title="Devis"
        toolbar={
          <DocumentFilterBar
            counts={statusCounts}
            filters={QUOTE_FILTERS}
            onSearchChange={setSearch}
            onStatusChange={setStatus}
            search={search}
            status={status}
          />
        }>
        <PrimaryLink href="/app/quotes?create=1">
          <Plus size={16} />
          Nouveau devis
        </PrimaryLink>
      </AppTopBar>

      <DocumentQuickPreviewModal
        documentId={quickPreviewId}
        kind="quote"
        onClose={() => setQuickPreviewId(null)}
        open={Boolean(quickPreviewId)}
      />

      <div className="min-h-0 flex-1">
        <MasterDetailLayout
          detail={
            detailQuery.isLoading && selectedId ? (
              <DetailSkeleton />
            ) : detailQuery.error ? (
              <div className="p-6">
                <ErrorState onRetry={() => void detailQuery.refetch()} />
              </div>
            ) : !detail ? (
              <div className="p-5">
                <EmptyState
                  action={
                    <SecondaryButton onClick={() => setSelectedId(null)}>Fermer</SecondaryButton>
                  }
                  description="Ce devis n’existe plus ou n’est pas accessible depuis cet espace."
                  icon={FileQuestion}
                  title="Devis introuvable"
                />
              </div>
            ) : (
              <DocumentDetailPanel
                amountMeta="Montant TTC"
                document={detail}
                downloadBusy={actionLoading === 'download'}
                dueIsLate={detail.status === 'expired'}
                dueOrValid={detail.validUntil}
                kind="quote"
                menuItems={quoteMenuItems(detail)}
                onDownload={() => void runPdfAction('download')}
                onOpenPreview={() => setQuickPreviewId(detail.id)}
                onTemplateChange={setPreviewTemplateId}
                primaryAction={quotePrimaryAction(detail)}
                templateId={previewTemplateId}
              />
            )
          }
          detailOpen={Boolean(selectedId)}
          detailTitle="Devis"
          list={
            <DocumentListPanel
              bulkBusy={pdfBusyKey !== null || bulkDuplicateMutation.isPending}
              busyRowId={pdfBusyKey}
              hasMore={Boolean(listQuery.hasNextPage)}
              isFiltered={search.trim().length > 0 || status !== 'all'}
              isLoading={listQuery.isLoading}
              items={items}
              kind="quote"
              loadingMore={listQuery.isFetchingNextPage}
              newHref="/app/quotes?create=1"
              onBulkDownload={() => void downloadPdfs(selection, 'bulk')}
              onBulkDuplicate={() => setDuplicateConfirmOpen(true)}
              onClearFilters={clearFilters}
              onDownload={(id) => void downloadPdfs([id], id)}
              onDuplicate={(id) => duplicateMutation.mutate(id)}
              onLoadMore={() => void listQuery.fetchNextPage()}
              onQuickPreview={setQuickPreviewId}
              onSelect={setSelectedId}
              onSelectionChange={setCheckedIds}
              search={search}
              selectedId={selectedId}
              selectedIds={selection}
              totalCount={totalCount}
            />
          }
          onCloseDetail={() => setSelectedId(null)}
        />
      </div>

      <AppDialog
        description="Chaque devis sélectionné sera recopié en brouillon avec un nouveau numéro."
        footer={
          <>
            <SecondaryButton onClick={() => setDuplicateConfirmOpen(false)}>Annuler</SecondaryButton>
            <PrimaryButton
              disabled={bulkDuplicateMutation.isPending}
              onClick={() => {
                setDuplicateConfirmOpen(false);
                bulkDuplicateMutation.mutate(selection);
              }}>
              Dupliquer
            </PrimaryButton>
          </>
        }
        icon={Copy}
        onClose={() => setDuplicateConfirmOpen(false)}
        open={duplicateConfirmOpen}
        size="sm"
        title={`Dupliquer ${selection.length} devis ?`}
      />
    </>
  );
}
