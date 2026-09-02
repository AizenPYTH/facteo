'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Copy, Download, Mail, Plus, Printer, Send, Share2 } from 'lucide-react';
import type { InvoiceStatusFilter } from '@inveq/types/invoices-list';
import type { QuoteStatusFilter } from '@inveq/types/quotes-list';
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
import { DetailSkeleton, TableSkeleton } from '@/components/app/skeleton';
import { AppSearchInput } from '@/components/app/app-shell';
import { StatusBadge } from '@/components/app/status-badge';
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
import { duplicateInvoice, updateInvoiceStatus } from '@/lib/domain/supabase/invoices';
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
                <Link
                  className="inline-flex rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white"
                  href={newHref}>
                  Créer
                </Link>
              }
              description={`Commencez par créer votre premier ${kind === 'invoice' ? 'facture' : 'devis'}.`}
              title="Aucun document"
            />
          </div>
        ) : (
          <ul className="divide-y divide-slate-100/90">
            {items.map((item) => {
              const active = item.id === selectedId;

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
                        <StatusBadge kind={kind} status={item.status} />
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
  onSend,
  onDownload,
  onPrint,
  onShare,
  onEmail,
  onDuplicate,
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
  onSend?: () => void;
  onDownload?: () => void;
  onPrint?: () => void;
  onShare?: () => void;
  onEmail?: () => void;
  onDuplicate?: () => void;
  actionLoading?: string | null;
  templateId?: string;
  onTemplateChange?: (id: string) => void;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-y-auto">
      <div className="border-b border-slate-100 bg-gradient-to-b from-white via-white to-slate-50/70 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
              {kind === 'invoice' ? 'Facture' : 'Devis'}
            </p>
            <h2 className="mt-0.5 truncate text-lg font-semibold tracking-tight text-slate-900">
              {number}
            </h2>
            <p className="mt-1 truncate text-sm text-slate-500">{clientName}</p>
          </div>
          <StatusBadge kind={kind} status={status} />
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
        </dl>
        <DocumentStatusTimeline className="mt-4" kind={kind} status={status} />
      </div>

      <div className="border-b border-slate-100 p-4">
        {templateId && onTemplateChange ? (
          <ComposerTemplateSidebar onChange={onTemplateChange} value={templateId} />
        ) : null}
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
          Actions rapides
        </p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { icon: Send, label: 'Envoyer', key: 'send', onClick: onSend },
            { icon: Download, label: 'PDF', key: 'download', onClick: onDownload },
            { icon: Printer, label: 'Imprimer', key: 'print', onClick: onPrint },
            { icon: Share2, label: 'Partager', key: 'share', onClick: onShare },
            { icon: Mail, label: 'E-mail', key: 'email', onClick: onEmail },
            { icon: Copy, label: 'Dupliquer', key: 'duplicate', onClick: onDuplicate },
          ].map((action) => (
            <button
              className="flex items-center gap-2 rounded-xl border border-slate-200/90 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition duration-150 hover:border-primary/25 hover:bg-blue-50/50 hover:shadow-sm disabled:opacity-50"
              disabled={actionLoading === action.key}
              key={action.label}
              onClick={action.onClick}
              type="button">
              <action.icon className="text-slate-400" size={15} />
              {actionLoading === action.key ? '…' : action.label}
            </button>
          ))}
        </div>
      </div>

      <ActivityTimeline documentId={documentId} documentType={kind} />
    </div>
  );
}

export function InvoicesWorkspace() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<InvoiceStatusFilter>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [previewTemplateId, setPreviewTemplateId] = useState('');
  const [quickPreviewId, setQuickPreviewId] = useState<string | null>(null);
  const { selectedId, setSelectedId } = useSelectedId();
  const { user } = useAuth();
  const { scope } = useTenant();
  const { settings } = useSettings();
  const { showSuccess, showError } = useToast();
  const queryClient = useQueryClient();
  const listQuery = useInfiniteInvoices(search, status);
  const detailQuery = useInvoiceDetail(selectedId);

  const items = useMemo(
    () => listQuery.data?.pages.flatMap((p) => p.invoices) ?? [],
    [listQuery.data],
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
    mutationFn: () => duplicateInvoice(requireScope(scope), detail!.id),
    onSuccess: (invoice) => {
      void queryClient.invalidateQueries({ queryKey: invoicesQueryKeys.all });
      setSelectedId(invoice.id);
      showSuccess(`Facture dupliquée en ${invoice.number}.`);
    },
    onError: (error) => showError(toUserFacingError(error.message)),
  });

  const sendMutation = useMutation({
    mutationFn: () => updateInvoiceStatus(requireScope(scope), detail!.id, 'sent'),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: invoicesQueryKeys.all });
      showSuccess('Facture marquée comme envoyée.');
    },
    onError: (error) => showError(toUserFacingError(error.message)),
  });

  return (
    <div className="flex h-full min-h-0 flex-col">
      <WorkspaceToolbar
        subtitle={`${items.length} facture(s)`}
        title="Factures">
        <Link
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_24px_-10px_rgba(37,99,235,0.65)] transition duration-150 hover:bg-primary-dark"
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
            ) : !detail ? (
              <PdfPreviewPanel document={null} kind="invoice" templateId={previewTemplateId} />
            ) : (
              <div className="flex h-full min-h-0 flex-col">
                <div className="min-h-0 flex-1">
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
                    dueOrValid={detail.dueAt}
                    issuedAt={detail.issuedAt}
                    kind="invoice"
                    number={detail.number}
                    onDownload={() => void runPdfAction('download')}
                    onDuplicate={() => duplicateMutation.mutate()}
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
                  />
                </div>
                <div className="h-[320px] shrink-0 border-t border-app-border">
                  <PdfPreviewPanel
                    document={detail}
                    kind="invoice"
                    templateId={previewTemplateId}
                  />
                </div>
              </div>
            )
          }
          detailOpen={Boolean(selectedId)}
          detailTitle="Facture"
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
          onCloseDetail={() => setSelectedId(null)}
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
  const { selectedId, setSelectedId } = useSelectedId();
  const { user } = useAuth();
  const { scope } = useTenant();
  const { settings } = useSettings();
  const { showSuccess, showError } = useToast();
  const queryClient = useQueryClient();
  const listQuery = useInfiniteQuotes(search, status);
  const detailQuery = useQuoteDetail(selectedId);

  const items = useMemo(
    () => listQuery.data?.pages.flatMap((p) => p.quotes) ?? [],
    [listQuery.data],
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
    mutationFn: () => duplicateQuote(requireScope(scope), detail!.id),
    onSuccess: (quote) => {
      void queryClient.invalidateQueries({ queryKey: quotesQueryKeys.all });
      setSelectedId(quote.id);
      showSuccess(`Devis dupliqué en ${quote.number}.`);
    },
    onError: (error) => showError(toUserFacingError(error.message)),
  });

  const sendMutation = useMutation({
    mutationFn: () => updateQuoteStatus(requireScope(scope), detail!.id, 'sent'),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: quotesQueryKeys.all });
      showSuccess('Devis marqué comme envoyé.');
    },
    onError: (error) => showError(toUserFacingError(error.message)),
  });

  return (
    <div className="flex h-full min-h-0 flex-col">
      <WorkspaceToolbar subtitle={`${items.length} devis`} title="Devis">
        <Link
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_24px_-10px_rgba(37,99,235,0.65)] transition duration-150 hover:bg-primary-dark"
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
            ) : !detail ? (
              <PdfPreviewPanel document={null} kind="quote" templateId={previewTemplateId} />
            ) : (
              <div className="flex h-full min-h-0 flex-col">
                <div className="min-h-0 flex-1">
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
                </div>
                <div className="h-[320px] shrink-0 border-t border-app-border">
                  <PdfPreviewPanel document={detail} kind="quote" templateId={previewTemplateId} />
                </div>
              </div>
            )
          }
          detailOpen={Boolean(selectedId)}
          detailTitle="Devis"
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
          onCloseDetail={() => setSelectedId(null)}
        />
      </div>
    </div>
  );
}
