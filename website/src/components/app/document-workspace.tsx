'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Copy,
  Download,
  FilePenLine,
  Mail,
  Plus,
  Printer,
  RotateCcw,
  Send,
  Share2,
  Undo2,
} from 'lucide-react';
import type { InvoiceStatusFilter } from '@inveq/types/invoices-list';
import type { QuoteStatusFilter } from '@inveq/types/quotes-list';
import {
  canConvertInvoiceToCreditNote,
  canCorrectInvoice,
  canEditInvoice,
  INVOICE_DOCUMENT_KIND_LABELS,
  INVOICE_STATUS_LABELS,
  VAT_REGIME_LABELS,
  type InvoiceStatus,
} from '@inveq/types/invoice';
import { QUOTE_STATUS_LABELS, type QuoteStatus } from '@inveq/types/quote';

import { ActivityTimeline } from '@/components/app/activity-timeline';
import { EmptyState, ErrorState } from '@/components/app/empty-state';
import {
  DocumentHoverCard,
  DocumentQuickPreviewButton,
  DocumentQuickPreviewModal,
  useHoverPreview,
} from '@/components/app/document-quick-preview';
import { DocumentStatusTimeline } from '@/components/app/document-status-timeline';
import { MasterDetailLayout, WorkspaceToolbar } from '@/components/app/master-detail';
import { PdfPreviewPanel } from '@/components/app/pdf-preview';
import { useWorkspaceSidebarWidth } from '@/components/app/resize-handle';
import { DetailSkeleton, TableSkeleton } from '@/components/app/skeleton';
import { AppSearchInput } from '@/components/app/app-shell';
import { Badge } from '@/components/app/ui';
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
import {
  correctInvoice,
  createCreditNoteFromInvoice,
  duplicateInvoice,
  updateInvoiceStatus,
} from '@/lib/domain/supabase/invoices';
import { duplicateQuote, updateQuoteStatus } from '@/lib/domain/supabase/quotes';
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

const INVOICE_STATUS_VARIANTS: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
  draft: 'default',
  sent: 'info',
  paid: 'success',
  partially_paid: 'warning',
  overdue: 'danger',
  canceled: 'default',
};

const QUOTE_STATUS_VARIANTS: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
  draft: 'default',
  sent: 'info',
  accepted: 'success',
  rejected: 'danger',
  expired: 'warning',
  converted: 'success',
};

type ListItem = {
  id: string;
  number: string;
  clientName: string;
  issuedAt: string | null;
  totalTtc: number;
  status: string;
};

function useSelectedId() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const selectedId = searchParams.get('selected');

  const setSelectedId = useCallback(
    (id: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (id) {
        params.set('selected', id);
      } else {
        params.delete('selected');
      }
      const qs = params.toString();
      router.replace(qs ? `?${qs}` : '?', { scroll: false });
    },
    [router, searchParams],
  );

  return { selectedId, setSelectedId };
}

function DocumentListPanel({
  kind,
  items,
  selectedId,
  onSelect,
  isLoading,
  search,
  onSearchChange,
  status,
  onStatusChange,
  statusOptions,
  hasMore,
  onLoadMore,
  loadingMore,
  newHref,
  onQuickPreview,
}: {
  kind: DocumentKind;
  items: ListItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  isLoading: boolean;
  search: string;
  onSearchChange: (v: string) => void;
  status: string;
  onStatusChange: (v: string) => void;
  statusOptions: { value: string; label: string }[];
  hasMore: boolean;
  onLoadMore: () => void;
  loadingMore: boolean;
  newHref: string;
  onQuickPreview: (id: string) => void;
}) {
  const { hoveredId, onEnter, onLeave } = useHoverPreview();

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="space-y-3 border-b border-slate-100/90 bg-gradient-to-b from-white to-slate-50/40 p-4">
        <AppSearchInput
          onChange={onSearchChange}
          placeholder={kind === 'invoice' ? 'Rechercher une facture…' : 'Rechercher un devis…'}
          value={search}
        />
        <select
          className="w-full rounded-xl border border-slate-200/90 bg-white px-3 py-2 text-sm outline-none transition hover:border-slate-300 focus:border-primary focus:ring-2 focus:ring-primary/20"
          onChange={(e) => onStatusChange(e.target.value)}
          value={status}>
          {statusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4">
            <TableSkeleton rows={8} />
          </div>
        ) : items.length === 0 ? (
          <div className="p-4">
            <EmptyState
              action={
                <div className="flex flex-col gap-2">
                  <Link
                    className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white"
                    href={newHref}>
                    Créer
                  </Link>
                  {kind === 'invoice' ? (
                    <Link
                      className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
                      href="/app/clients/new?ai=1">
                      Commencer par un client IA
                    </Link>
                  ) : null}
                </div>
              }
              description={
                kind === 'invoice'
                  ? 'Ajoutez un client (manuel ou IA), puis émettez votre première facture.'
                  : `Commencez par créer votre premier devis.`
              }
              title="Aucun document"
            />
          </div>
        ) : (
          <ul className="divide-y divide-slate-100/90">
            {items.map((item) => {
              const active = item.id === selectedId;
              const variants = kind === 'invoice' ? INVOICE_STATUS_VARIANTS : QUOTE_STATUS_VARIANTS;
              const labels =
                kind === 'invoice' ? INVOICE_STATUS_LABELS : QUOTE_STATUS_LABELS;
              const statusKey = item.status as InvoiceStatus & QuoteStatus;

              return (
                <li
                  className="relative"
                  key={item.id}
                  onMouseEnter={() => onEnter(item.id)}
                  onMouseLeave={onLeave}>
                  <div
                    className={cn(
                      'group flex w-full items-stretch gap-1 px-2 py-2 transition duration-150',
                      active
                        ? 'border-l-[3px] border-primary bg-gradient-to-r from-blue-50/90 to-transparent'
                        : 'border-l-[3px] border-transparent hover:bg-slate-50/90',
                    )}>
                    <button
                      className="min-w-0 flex-1 px-2 py-1.5 text-left"
                      onClick={() => onSelect(item.id)}
                      type="button">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-semibold tracking-tight text-slate-900">
                            {item.number}
                          </p>
                          <p className="mt-0.5 truncate text-sm text-slate-500">{item.clientName}</p>
                        </div>
                        <Badge variant={variants[item.status] ?? 'default'}>
                          {labels[statusKey as keyof typeof labels] ?? item.status}
                        </Badge>
                      </div>
                      <div className="mt-2.5 flex items-center justify-between text-xs text-slate-400">
                        <span>{formatDate(item.issuedAt)}</span>
                        <span className="font-semibold tabular-nums text-slate-800">
                          {formatCurrency(item.totalTtc)}
                        </span>
                      </div>
                    </button>
                    <div className="flex shrink-0 items-start pt-1.5">
                      <DocumentQuickPreviewButton onClick={() => onQuickPreview(item.id)} />
                    </div>
                  </div>
                  <DocumentHoverCard
                    item={item}
                    kind={kind}
                    visible={hoveredId === item.id && !active}
                  />
                </li>
              );
            })}
          </ul>
        )}
        {hasMore ? (
          <div className="border-t border-slate-100 p-3">
            <button
              className="w-full rounded-lg py-2 text-sm font-medium text-primary hover:bg-blue-50 disabled:opacity-50"
              disabled={loadingMore}
              onClick={onLoadMore}
              type="button">
              {loadingMore ? 'Chargement…' : 'Charger plus'}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function DocumentSidebar({
  kind,
  documentId,
  number,
  clientName,
  clientEmail,
  totalTtc,
  status,
  issuedAt,
  dueOrValid,
  documentKind,
  vatRegime,
  onSend,
  onDownload,
  onPrint,
  onShare,
  onEmail,
  onDuplicate,
  onEdit,
  onCreditNote,
  onCorrect,
  actionLoading,
  templateId,
  onTemplateChange,
}: {
  kind: DocumentKind;
  documentId: string;
  number: string;
  clientName: string;
  clientEmail?: string | null;
  totalTtc: number;
  status: string;
  issuedAt: string | null;
  dueOrValid: string | null;
  documentKind?: 'invoice' | 'credit_note';
  vatRegime?: string | null;
  onSend?: () => void;
  onDownload?: () => void;
  onPrint?: () => void;
  onShare?: () => void;
  onEmail?: () => void;
  onDuplicate?: () => void;
  onEdit?: () => void;
  onCreditNote?: () => void;
  onCorrect?: () => void;
  actionLoading?: string | null;
  templateId?: string;
  onTemplateChange?: (id: string) => void;
}) {
  const variants = kind === 'invoice' ? INVOICE_STATUS_VARIANTS : QUOTE_STATUS_VARIANTS;
  const labels = kind === 'invoice' ? INVOICE_STATUS_LABELS : QUOTE_STATUS_LABELS;
  const kindLabel =
    kind === 'invoice'
      ? INVOICE_DOCUMENT_KIND_LABELS[documentKind === 'credit_note' ? 'credit_note' : 'invoice']
      : 'Devis';
  const vatLabel =
    vatRegime && vatRegime in VAT_REGIME_LABELS
      ? VAT_REGIME_LABELS[vatRegime as keyof typeof VAT_REGIME_LABELS]
      : null;

  const actions = [
    ...(onEdit ? [{ icon: FilePenLine, label: 'Modifier', key: 'edit', onClick: onEdit }] : []),
    { icon: Send, label: 'Envoyer', key: 'send', onClick: onSend },
    { icon: Download, label: 'PDF', key: 'download', onClick: onDownload },
    { icon: Printer, label: 'Imprimer', key: 'print', onClick: onPrint },
    { icon: Share2, label: 'Partager', key: 'share', onClick: onShare },
    { icon: Mail, label: 'E-mail', key: 'email', onClick: onEmail },
    { icon: Copy, label: 'Dupliquer', key: 'duplicate', onClick: onDuplicate },
    ...(onCreditNote
      ? [{ icon: Undo2, label: 'Avoir', key: 'credit-note', onClick: onCreditNote }]
      : []),
    ...(onCorrect
      ? [{ icon: RotateCcw, label: 'Corriger', key: 'correct', onClick: onCorrect }]
      : []),
  ];

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="border-b border-slate-100 bg-gradient-to-b from-white via-white to-slate-50/70 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
              {kindLabel}
            </p>
            <h2 className="mt-0.5 truncate text-lg font-semibold tracking-tight text-slate-900">
              {number}
            </h2>
            <p className="mt-1 truncate text-sm text-slate-500">{clientName}</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            {documentKind === 'credit_note' ? (
              <Badge variant="info">{INVOICE_DOCUMENT_KIND_LABELS.credit_note}</Badge>
            ) : null}
            <Badge variant={variants[status] ?? 'default'}>
              {labels[status as keyof typeof labels] ?? status}
            </Badge>
          </div>
        </div>
        <p className="mt-5 text-[1.65rem] font-semibold tracking-[-0.03em] tabular-nums text-slate-900">
          {formatCurrency(totalTtc)}
        </p>
        <dl className="mt-4 grid grid-cols-2 gap-3 rounded-xl border border-slate-100 bg-white/80 p-3 text-sm">
          <div>
            <dt className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
              Émission
            </dt>
            <dd className="mt-0.5 font-medium text-slate-700">{formatDate(issuedAt)}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
              {kind === 'invoice' ? 'Échéance' : 'Validité'}
            </dt>
            <dd className="mt-0.5 font-medium text-slate-700">{formatDate(dueOrValid)}</dd>
          </div>
          {vatLabel ? (
            <div className="col-span-2">
              <dt className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                Régime de TVA
              </dt>
              <dd className="mt-0.5 font-medium text-slate-700">{vatLabel}</dd>
            </div>
          ) : null}
        </dl>
        <DocumentStatusTimeline className="mt-4" kind={kind} status={status} />
      </div>

      <div className="border-b border-slate-100 p-4">
        {templateId && onTemplateChange ? (
          <ComposerTemplateSidebar onChange={onTemplateChange} value={templateId} />
        ) : null}
      </div>

      <ActivityTimeline documentId={documentId} documentType={kind} />
      </div>

      <div className="sticky bottom-0 z-10 border-t border-slate-200/90 bg-white/95 p-3 backdrop-blur-sm">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
          Actions
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {actions.map((action) => (
            <button
              className="flex items-center gap-2 rounded-xl border border-slate-200/90 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition duration-150 hover:-translate-y-0.5 hover:border-primary/25 hover:bg-blue-50/50 hover:shadow-sm disabled:opacity-50 disabled:hover:translate-y-0"
              disabled={actionLoading === action.key || !action.onClick}
              key={action.key}
              onClick={action.onClick}
              type="button">
              <action.icon className="text-slate-400" size={15} />
              {actionLoading === action.key ? '…' : action.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function InvoicesWorkspace() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<InvoiceStatusFilter>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [previewTemplateId, setPreviewTemplateId] = useState('');
  const [quickPreviewId, setQuickPreviewId] = useState<string | null>(null);
  const [sidebarWidth, setSidebarWidth] = useWorkspaceSidebarWidth(340);
  const { selectedId, setSelectedId } = useSelectedId();
  const { user } = useAuth();
  const { scope } = useTenant();
  const { settings } = useSettings();
  const queryClient = useQueryClient();
  const listQuery = useInfiniteInvoices(search, status);
  const detailQuery = useInvoiceDetail(selectedId);

  const items = useMemo(
    () => listQuery.data?.pages.flatMap((p) => p.invoices) ?? [],
    [listQuery.data],
  );

  useEffect(() => {
    if (!selectedId && items.length > 0) {
      setSelectedId(items[0].id);
    }
  }, [items, selectedId, setSelectedId]);

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
    mutationFn: () => duplicateInvoice(requireScope(scope), detail!.id),
    onSuccess: (invoice) => {
      void queryClient.invalidateQueries({ queryKey: invoicesQueryKeys.all });
      setSelectedId(invoice.id);
    },
  });

  const creditNoteMutation = useMutation({
    mutationFn: () => createCreditNoteFromInvoice(requireScope(scope), detail!.id),
    onSuccess: (invoice) => {
      void queryClient.invalidateQueries({ queryKey: invoicesQueryKeys.all });
      setSelectedId(invoice.id);
    },
  });

  const correctMutation = useMutation({
    mutationFn: () => correctInvoice(requireScope(scope), detail!.id),
    onSuccess: ({ correctedInvoice }) => {
      void queryClient.invalidateQueries({ queryKey: invoicesQueryKeys.all });
      router.push(`/app/invoices?edit=${correctedInvoice.id}`);
    },
  });

  const sendMutation = useMutation({
    mutationFn: () => updateInvoiceStatus(requireScope(scope), detail!.id, 'sent'),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: invoicesQueryKeys.all });
    },
  });

  const canCreditNote =
    Boolean(detail) &&
    detail!.documentKind === 'invoice' &&
    canConvertInvoiceToCreditNote(detail!.status);
  const canCorrect =
    Boolean(detail) &&
    detail!.documentKind === 'invoice' &&
    canCorrectInvoice(detail!.status);
  const canEdit = Boolean(detail) && canEditInvoice(detail!.status);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <WorkspaceToolbar
        subtitle={`${items.length} facture(s)`}
        title="Factures">
        <Link
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_24px_-10px_rgba(37,99,235,0.65)] transition duration-150 hover:-translate-y-0.5 hover:bg-primary-dark"
          href="/app/invoices?create=1">
          <Plus size={16} />
          Nouvelle facture
        </Link>
      </WorkspaceToolbar>

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
              <div className="p-8">
                <ErrorState onRetry={() => void detailQuery.refetch()} />
              </div>
            ) : (
              <PdfPreviewPanel
                document={detail ?? null}
                kind="invoice"
                templateId={previewTemplateId}
              />
            )
          }
          list={
            <DocumentListPanel
              hasMore={Boolean(listQuery.hasNextPage)}
              isLoading={listQuery.isLoading}
              items={items}
              kind="invoice"
              loadingMore={listQuery.isFetchingNextPage}
              newHref="/app/invoices?create=1"
              onLoadMore={() => void listQuery.fetchNextPage()}
              onQuickPreview={setQuickPreviewId}
              onSearchChange={setSearch}
              onSelect={setSelectedId}
              onStatusChange={(v) => setStatus(v as InvoiceStatusFilter)}
              search={search}
              selectedId={selectedId}
              status={status}
              statusOptions={[
                { value: 'all', label: 'Tous les statuts' },
                { value: 'draft', label: 'Brouillon' },
                { value: 'sent', label: 'Envoyée' },
                { value: 'paid', label: 'Payée' },
                { value: 'partially_paid', label: 'Partielle' },
                { value: 'overdue', label: 'En retard' },
              ]}
            />
          }
          sidebar={
            detail ? (
              <DocumentSidebar
                actionLoading={
                  actionLoading ??
                  (duplicateMutation.isPending
                    ? 'duplicate'
                    : creditNoteMutation.isPending
                      ? 'credit-note'
                      : correctMutation.isPending
                        ? 'correct'
                        : sendMutation.isPending
                          ? 'send'
                          : null)
                }
                clientEmail={detail.clientEmail}
                clientName={detail.clientName}
                documentId={detail.id}
                documentKind={detail.documentKind}
                dueOrValid={detail.dueAt}
                issuedAt={detail.issuedAt}
                kind="invoice"
                number={detail.number}
                onCorrect={canCorrect ? () => correctMutation.mutate() : undefined}
                onCreditNote={canCreditNote ? () => creditNoteMutation.mutate() : undefined}
                onDownload={() => void runPdfAction('download')}
                onDuplicate={() => duplicateMutation.mutate()}
                onEdit={
                  canEdit
                    ? () => router.push(`/app/invoices?edit=${detail.id}`)
                    : undefined
                }
                onEmail={() =>
                  openMailto(
                    detail.clientEmail,
                    `Facture ${detail.number}`,
                    `Bonjour,\n\nVeuillez trouver ci-joint la facture ${detail.number}.\n\nCordialement`,
                  )
                }
                onPrint={() => void runPdfAction('print')}
                onSend={() => sendMutation.mutate()}
                onShare={() => void runPdfAction('share')}
                onTemplateChange={setPreviewTemplateId}
                status={detail.status}
                templateId={previewTemplateId}
                totalTtc={detail.totalTtc}
                vatRegime={detail.vatRegime}
              />
            ) : undefined
          }
          onSidebarResize={(delta) => setSidebarWidth((w) => w + delta)}
          sidebarWidth={sidebarWidth}
        />
      </div>
    </div>
  );
}

export function QuotesWorkspace() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<QuoteStatusFilter>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [previewTemplateId, setPreviewTemplateId] = useState('');
  const [quickPreviewId, setQuickPreviewId] = useState<string | null>(null);
  const [sidebarWidth, setSidebarWidth] = useWorkspaceSidebarWidth(340);
  const { selectedId, setSelectedId } = useSelectedId();
  const { user } = useAuth();
  const { scope } = useTenant();
  const { settings } = useSettings();
  const queryClient = useQueryClient();
  const listQuery = useInfiniteQuotes(search, status);
  const detailQuery = useQuoteDetail(selectedId);

  const items = useMemo(
    () => listQuery.data?.pages.flatMap((p) => p.quotes) ?? [],
    [listQuery.data],
  );

  useEffect(() => {
    if (!selectedId && items.length > 0) {
      setSelectedId(items[0].id);
    }
  }, [items, selectedId, setSelectedId]);

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
    mutationFn: () => duplicateQuote(requireScope(scope), detail!.id),
    onSuccess: (quote) => {
      void queryClient.invalidateQueries({ queryKey: quotesQueryKeys.all });
      setSelectedId(quote.id);
    },
  });

  const sendMutation = useMutation({
    mutationFn: () => updateQuoteStatus(requireScope(scope), detail!.id, 'sent'),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: quotesQueryKeys.all });
    },
  });

  return (
    <div className="flex h-full min-h-0 flex-col">
      <WorkspaceToolbar subtitle={`${items.length} devis`} title="Devis">
        <Link
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_24px_-10px_rgba(37,99,235,0.65)] transition duration-150 hover:-translate-y-0.5 hover:bg-primary-dark"
          href="/app/quotes?create=1">
          <Plus size={16} />
          Nouveau devis
        </Link>
      </WorkspaceToolbar>

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
              <div className="p-8">
                <ErrorState onRetry={() => void detailQuery.refetch()} />
              </div>
            ) : (
              <PdfPreviewPanel
                document={detail ?? null}
                kind="quote"
                templateId={previewTemplateId}
              />
            )
          }
          list={
            <DocumentListPanel
              hasMore={Boolean(listQuery.hasNextPage)}
              isLoading={listQuery.isLoading}
              items={items}
              kind="quote"
              loadingMore={listQuery.isFetchingNextPage}
              newHref="/app/quotes?create=1"
              onLoadMore={() => void listQuery.fetchNextPage()}
              onQuickPreview={setQuickPreviewId}
              onSearchChange={setSearch}
              onSelect={setSelectedId}
              onStatusChange={(v) => setStatus(v as QuoteStatusFilter)}
              search={search}
              selectedId={selectedId}
              status={status}
              statusOptions={[
                { value: 'all', label: 'Tous les statuts' },
                { value: 'draft', label: 'Brouillon' },
                { value: 'sent', label: 'Envoyé' },
                { value: 'accepted', label: 'Accepté' },
                { value: 'rejected', label: 'Refusé' },
                { value: 'expired', label: 'Expiré' },
              ]}
            />
          }
          sidebar={
            detail ? (
              <DocumentSidebar
                actionLoading={
                  actionLoading ??
                  (duplicateMutation.isPending
                    ? 'duplicate'
                    : sendMutation.isPending
                      ? 'send'
                      : null)
                }
                clientEmail={detail.clientEmail}
                clientName={detail.clientName}
                documentId={detail.id}
                dueOrValid={detail.validUntil}
                issuedAt={detail.issuedAt}
                kind="quote"
                number={detail.number}
                onDownload={() => void runPdfAction('download')}
                onDuplicate={() => duplicateMutation.mutate()}
                onEmail={() =>
                  openMailto(
                    detail.clientEmail,
                    `Devis ${detail.number}`,
                    `Bonjour,\n\nVeuillez trouver ci-joint le devis ${detail.number}.\n\nCordialement`,
                  )
                }
                onPrint={() => void runPdfAction('print')}
                onSend={() => sendMutation.mutate()}
                onShare={() => void runPdfAction('share')}
                onTemplateChange={setPreviewTemplateId}
                status={detail.status}
                templateId={previewTemplateId}
                totalTtc={detail.totalTtc}
              />
            ) : undefined
          }
          onSidebarResize={(delta) => setSidebarWidth((w) => w + delta)}
          sidebarWidth={sidebarWidth}
        />
      </div>
    </div>
  );
}
