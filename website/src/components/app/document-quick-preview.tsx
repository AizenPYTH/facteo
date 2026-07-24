'use client';

import { Eye, X } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useEffect, useState } from 'react';

import { PdfPreviewPanel } from '@/components/app/pdf-preview';
import { useInvoiceDetail } from '@/hooks/use-invoice-detail';
import { useQuoteDetail } from '@/hooks/use-quote-detail';
import { formatCurrency } from '@/lib/domain/format/currency';
import { INVOICE_STATUS_LABELS, type InvoiceStatus } from '@inveq/types/invoice';
import { QUOTE_STATUS_LABELS, type QuoteStatus } from '@inveq/types/quote';
import { cn } from '@/lib/utils';

type PreviewItem = {
  id: string;
  number: string;
  clientName: string;
  issuedAt: string | null;
  totalTtc: number;
  status: string;
};

export function DocumentHoverCard({
  item,
  kind,
  visible,
}: {
  item: PreviewItem;
  kind: 'invoice' | 'quote';
  visible: boolean;
}) {
  const labels = kind === 'invoice' ? INVOICE_STATUS_LABELS : QUOTE_STATUS_LABELS;
  const statusKey = item.status as InvoiceStatus & QuoteStatus;

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          animate={{ opacity: 1, height: 'auto' }}
          className="overflow-hidden border-t border-dashed border-slate-200/80 bg-gradient-to-r from-blue-50/50 to-transparent"
          exit={{ opacity: 0, height: 0 }}
          initial={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.18 }}>
          <div className="flex items-center justify-between gap-2 px-4 py-2">
            <p className="truncate text-[11px] text-slate-500">
              <span className="font-semibold text-slate-700">{item.number}</span>
              {' · '}
              {formatCurrency(item.totalTtc)}
              {' · '}
              {labels[statusKey as keyof typeof labels] ?? item.status}
            </p>
            <span className="shrink-0 text-[10px] font-medium text-primary">Œil = PDF</span>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export function DocumentQuickPreviewButton({
  onClick,
  className,
}: {
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      aria-label="Aperçu rapide"
      className={cn(
        'rounded-lg p-1.5 text-slate-400 opacity-70 transition duration-150 hover:bg-white hover:text-primary group-hover:opacity-100 focus:opacity-100 sm:opacity-0 sm:group-hover:opacity-100',
        className,
      )}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      type="button">
      <Eye size={15} />
    </button>
  );
}

export function DocumentQuickPreviewModal({
  open,
  kind,
  documentId,
  onClose,
}: {
  open: boolean;
  kind: 'invoice' | 'quote';
  documentId: string | null;
  onClose: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const invoiceQuery = useInvoiceDetail(kind === 'invoice' ? documentId : null);
  const quoteQuery = useQuoteDetail(kind === 'quote' ? documentId : null);
  const detail = kind === 'invoice' ? invoiceQuery.data : quoteQuery.data;
  const loading = kind === 'invoice' ? invoiceQuery.isLoading : quoteQuery.isLoading;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && documentId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.button
            animate={{ opacity: 1 }}
            aria-label="Fermer"
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            onClick={onClose}
            transition={{ duration: reduceMotion ? 0 : 0.2 }}
            type="button"
          />
          <motion.div
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="relative flex h-[min(88vh,820px)] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_32px_80px_-24px_rgba(15,23,42,0.45)]"
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            initial={reduceMotion ? false : { opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: reduceMotion ? 0 : 0.22, ease: [0.22, 1, 0.36, 1] }}>
            <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-3.5">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Aperçu rapide
                </p>
                <p className="truncate text-sm font-semibold text-slate-900">
                  {detail?.number ?? (loading ? 'Chargement…' : 'Document')}
                </p>
              </div>
              <button
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                onClick={onClose}
                type="button">
                <X size={18} />
              </button>
            </div>
            <div className="min-h-0 flex-1">
              {loading && !detail ? (
                <div className="flex h-full items-center justify-center text-sm text-slate-500">
                  Chargement de l’aperçu…
                </div>
              ) : (
                <PdfPreviewPanel document={detail ?? null} kind={kind} />
              )}
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}

/** Hook léger pour le survol différé (évite les popovers trop brusques). */
export function useHoverPreview() {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [timer, setTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  function onEnter(id: string) {
    if (timer) clearTimeout(timer);
    const next = setTimeout(() => setHoveredId(id), 280);
    setTimer(next);
  }

  function onLeave() {
    if (timer) clearTimeout(timer);
    setTimer(null);
    setHoveredId(null);
  }

  useEffect(
    () => () => {
      if (timer) clearTimeout(timer);
    },
    [timer],
  );

  return { hoveredId, onEnter, onLeave };
}
