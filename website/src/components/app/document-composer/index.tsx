'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Library,
  Plus,
  Save,
  Trash2,
} from 'lucide-react';

import { CatalogPicker } from '@/components/app/catalog-picker';
import { ComposerErrorBanner, InlineFieldError } from '@/components/app/document-composer/field-errors';
import { ComposerLivePreview } from '@/components/app/document-composer/live-preview';
import { ResizeHandle, usePreviewPanelWidth } from '@/components/app/resize-handle';
import { ComposerTemplateBar } from '@/components/app/document-composer/template-bar';
import {
  getFirstErrorTarget,
  hasValidationErrors,
  validateDocumentDraft,
  type FieldErrors,
  type LineValue,
} from '@/components/app/document-composer/validation';
import { LoadingState } from '@/components/app/ui';
import { SelectInput, TextArea, TextInput } from '@/components/app/form-fields';
import { useAuth } from '@/providers/auth-provider';
import { useTenant } from '@/providers/company-provider';
import { useSettings } from '@/hooks/use-settings';
import { fetchClientsPage } from '@/lib/domain/supabase/clients';
import { createInvoice } from '@/lib/domain/supabase/invoices';
import { createQuote } from '@/lib/domain/supabase/quotes';
import { clientsQueryKeys, invoicesQueryKeys, quotesQueryKeys } from '@/lib/domain/supabase/query-keys';
import { calculateLineTotals } from '@/lib/calculations/totals';
import { getDefaultComposerTemplateId } from '@/lib/domain/pdf/composer-templates';
import type { DraftDocumentInput } from '@/lib/domain/pdf/draft-pdf';
import { requireScope } from '@/lib/domain/tenant/scope';
import { formatCurrency } from '@/lib/domain/format/currency';
import { createEmptyInvoiceLine } from '@facteo/types/invoice';
import { createEmptyQuoteLine, createLocalLineId } from '@facteo/types/quote';
import type { Product } from '@/types/product';
import { CLIENTS_PAGE_SIZE } from '@facteo/types/clients-list';
import { cn } from '@/lib/utils';

function parseDecimal(value: string): number {
  const normalized = value.replace(/\s/g, '').replace(',', '.');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function lineFromCatalog(item: Product, kind: 'invoice' | 'quote'): LineValue {
  const base = kind === 'invoice' ? createEmptyInvoiceLine() : createEmptyQuoteLine();
  return {
    ...base,
    id: createLocalLineId(),
    productId: item.id,
    description: item.name,
    quantity: '1',
    unit: item.unit,
    unitPrice: String(item.unitPrice),
    vatRate: String(item.vatRate),
    discountPercent: '0',
  };
}

export function DocumentComposer({ kind }: { kind: 'invoice' | 'quote' }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedClient = searchParams.get('client') ?? '';
  const { user, loading: authLoading } = useAuth();
  const { scope, loading: tenantLoading } = useTenant();
  const { settings, loading: settingsLoading } = useSettings();
  const queryClient = useQueryClient();

  const [clientId, setClientId] = useState(preselectedClient);
  const [notes, setNotes] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [lines, setLines] = useState<LineValue[]>([
    kind === 'invoice' ? createEmptyInvoiceLine() : createEmptyQuoteLine(),
  ]);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const clientRef = useRef<HTMLDivElement>(null);
  const linesRef = useRef<HTMLDivElement>(null);
  const lineFieldRefs = useRef<Record<string, Partial<Record<string, HTMLInputElement | null>>>>({});

  useEffect(() => {
    if (settings && !templateId) {
      setTemplateId(getDefaultComposerTemplateId(kind, settings));
    }
  }, [settings, templateId, kind]);

  const clientsQuery = useQuery({
    queryKey: clientsQueryKeys.list(scope?.companyId ?? '', ''),
    queryFn: () => fetchClientsPage(requireScope(scope), { page: 0, pageSize: CLIENTS_PAGE_SIZE }),
    enabled: Boolean(scope?.companyId && user?.id),
  });

  const totals = useMemo(() => {
    let subtotal = 0;
    let vat = 0;
    for (const line of lines) {
      if (!line.description.trim()) continue;
      const result = calculateLineTotals(
        parseDecimal(line.quantity),
        parseDecimal(line.unitPrice),
        parseDecimal(line.vatRate),
        parseDecimal(line.discountPercent),
      );
      subtotal += result.lineTotalHt;
      vat += result.lineVat;
    }
    return { subtotal, vat, total: subtotal + vat };
  }, [lines]);

  const draftInput: DraftDocumentInput = useMemo(
    () => ({
      kind,
      clientId,
      lines,
      notes,
      templateId: templateId || getDefaultComposerTemplateId(kind, settings),
    }),
    [kind, clientId, lines, notes, templateId, settings],
  );

  const scrollToFirstError = useCallback(
    (errors: FieldErrors) => {
      const target = getFirstErrorTarget(errors, lines);
      if (!target) return;

      if (target.type === 'client') {
        clientRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }

      if (target.type === 'lines') {
        linesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }

      const input = lineFieldRefs.current[target.lineId]?.[target.field];
      input?.focus();
      input?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    },
    [lines],
  );

  const createMutation = useMutation({
    mutationFn: async () => {
      const errors = validateDocumentDraft(clientId, lines);
      if (hasValidationErrors(errors)) {
        setFieldErrors(errors);
        setSubmitAttempted(true);
        scrollToFirstError(errors);
        throw new Error('VALIDATION');
      }

      const activeScope = requireScope(scope);
      const validLines = lines.filter((l) => l.description.trim());

      if (kind === 'quote') {
        return createQuote(activeScope, {
          clientId,
          lines: validLines,
          notes: notes.trim() || undefined,
        });
      }

      return createInvoice(activeScope, {
        clientId,
        lines: validLines,
        notes: notes.trim() || undefined,
      });
    },
    onSuccess: (doc) => {
      void queryClient.invalidateQueries({
        queryKey: kind === 'quote' ? quotesQueryKeys.all : invoicesQueryKeys.all,
      });
      void queryClient.invalidateQueries({ queryKey: clientsQueryKeys.all });
      const base = kind === 'quote' ? '/app/quotes' : '/app/invoices';
      router.replace(`${base}?selected=${doc.id}`);
    },
    onError: (err: Error) => {
      if (err.message !== 'VALIDATION') {
        setFieldErrors({ linesGlobal: err.message });
        setSubmitAttempted(true);
      }
    },
  });

  function handleSubmit() {
    const errors = validateDocumentDraft(clientId, lines);
    setFieldErrors(errors);
    setSubmitAttempted(true);
    if (hasValidationErrors(errors)) {
      scrollToFirstError(errors);
      return;
    }
    createMutation.mutate();
  }

  function updateLine(id: string, patch: Partial<LineValue>) {
    setLines((prev) => prev.map((line) => (line.id === id ? { ...line, ...patch } : line)));
    if (submitAttempted) {
      setFieldErrors(validateDocumentDraft(clientId, lines));
    }
  }

  function addLine() {
    setLines((prev) => [
      ...prev,
      kind === 'invoice' ? createEmptyInvoiceLine() : createEmptyQuoteLine(),
    ]);
  }

  function addFromCatalog(item: Product) {
    setLines((prev) => {
      const emptyIndex = prev.findIndex((l) => !l.description.trim());
      const newLine = lineFromCatalog(item, kind);
      if (emptyIndex >= 0) {
        return prev.map((line, i) => (i === emptyIndex ? newLine : line));
      }
      return [...prev, newLine];
    });
  }

  function removeLine(id: string) {
    setLines((prev) => (prev.length <= 1 ? prev : prev.filter((l) => l.id !== id)));
  }

  function handleCancel() {
    router.replace(kind === 'quote' ? '/app/quotes' : '/app/invoices');
  }

  const [previewWidth, setPreviewWidth] = usePreviewPanelWidth(480);

  if (authLoading || tenantLoading || settingsLoading) {
    return <LoadingState message="Préparation de l’éditeur…" />;
  }

  const clients = clientsQuery.data?.clients ?? [];
  const title = kind === 'invoice' ? 'Nouvelle facture' : 'Nouveau devis';
  const label = kind === 'invoice' ? 'facture' : 'devis';

  const bannerMessages = [
    fieldErrors.clientId,
    fieldErrors.linesGlobal,
  ].filter((m): m is string => Boolean(m));

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-slate-50">
      <CatalogPicker onClose={() => setCatalogOpen(false)} onSelect={addFromCatalog} open={catalogOpen} />

      {/* Barre supérieure */}
      <header className="shrink-0 border-b border-slate-200 bg-white">
        <div className="flex items-center justify-between gap-4 px-4 py-3 lg:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <button
              className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
              onClick={handleCancel}
              type="button">
              <ArrowLeft size={16} />
              Retour
            </button>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-bold text-slate-900">{title}</h1>
              <p className="text-xs text-slate-500">Éditeur professionnel · aperçu en direct</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              onClick={handleCancel}
              type="button">
              Annuler
            </button>
            <button
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition hover:bg-primary-dark disabled:opacity-60"
              disabled={createMutation.isPending}
              onClick={handleSubmit}
              type="button">
              <Save size={16} />
              {createMutation.isPending ? 'Création…' : `Créer la ${label}`}
            </button>
          </div>
        </div>
        <div className="border-t border-slate-100 bg-slate-50/50 px-4 py-2.5 lg:px-5">
          <ComposerTemplateBar onChange={setTemplateId} value={templateId} />
        </div>
      </header>

      {/* Zone principale + aperçu redimensionnable */}
      <div className="flex min-h-0 flex-1">
        <div className="grid min-w-0 flex-1 grid-cols-1 md:grid-cols-[260px_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,1fr)]">
        {/* Colonne gauche — Client & totaux */}
        <aside className="flex min-h-0 flex-col border-b border-slate-200 bg-white lg:border-b-0 lg:border-r">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
            {submitAttempted && bannerMessages.length > 0 ? (
              <ComposerErrorBanner messages={bannerMessages} />
            ) : null}

            <section ref={clientRef}>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Client
              </h2>
              <SelectInput
                className={cn(fieldErrors.clientId && 'border-red-300 ring-2 ring-red-100')}
                onChange={(e) => {
                  setClientId(e.target.value);
                  if (submitAttempted) {
                    setFieldErrors(validateDocumentDraft(e.target.value, lines));
                  }
                }}
                value={clientId}>
                <option value="">— Choisir un client —</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.company ||
                      `${client.firstName} ${client.lastName}`.trim() ||
                      client.lastName}
                  </option>
                ))}
              </SelectInput>
              <InlineFieldError message={submitAttempted ? fieldErrors.clientId : undefined} />
            </section>

            <section>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Notes
              </h2>
              <TextArea
                className="min-h-[72px] text-sm"
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Conditions, remarques…"
                rows={2}
                value={notes}
              />
            </section>
          </div>

          <div className="shrink-0 border-t border-slate-100 bg-slate-50 p-4">
            <dl className="grid grid-cols-3 gap-2 text-center">
              <div>
                <dt className="text-[10px] uppercase text-slate-400">HT</dt>
                <dd className="text-sm font-bold text-slate-900">{formatCurrency(totals.subtotal)}</dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase text-slate-400">TVA</dt>
                <dd className="text-sm font-bold text-slate-900">{formatCurrency(totals.vat)}</dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase text-slate-400">TTC</dt>
                <dd className="text-base font-bold text-primary">{formatCurrency(totals.total)}</dd>
              </div>
            </dl>
          </div>
        </aside>

        {/* Colonne centrale — Lignes */}
        <main className="flex min-h-0 flex-col border-b border-slate-200 bg-white lg:border-b-0 lg:border-r" ref={linesRef}>
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Prestations & produits
            </h2>
            <div className="flex gap-2">
              <button
                className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-blue-100"
                onClick={() => setCatalogOpen(true)}
                type="button">
                <Library size={14} />
                Catalogue
              </button>
              <button
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                onClick={addLine}
                type="button">
                <Plus size={14} />
                Ligne
              </button>
            </div>
          </div>

          <InlineFieldError
            message={submitAttempted ? fieldErrors.linesGlobal : undefined}
          />

          <div className="min-h-0 flex-1 overflow-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50/95 text-xs font-semibold uppercase tracking-wider text-slate-500 backdrop-blur-sm">
                <tr>
                  <th className="px-3 py-2.5">Description</th>
                  <th className="w-16 px-2 py-2.5">Qté</th>
                  <th className="w-24 px-2 py-2.5">Prix HT</th>
                  <th className="w-16 px-2 py-2.5">TVA</th>
                  <th className="w-24 px-2 py-2.5 text-right">Total</th>
                  <th className="w-10 px-2 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {lines.map((line) => {
                  const lineTotal = line.description.trim()
                    ? calculateLineTotals(
                        parseDecimal(line.quantity),
                        parseDecimal(line.unitPrice),
                        parseDecimal(line.vatRate),
                        parseDecimal(line.discountPercent),
                      ).lineTotalTtc
                    : 0;
                  const rowErrors = fieldErrors.lineErrors?.[line.id];

                  return (
                    <tr className="border-b border-slate-100 align-top transition-colors hover:bg-slate-50/60" key={line.id}>
                      <td className="px-3 py-2">
                        <TextInput
                          className={cn('py-1.5 text-sm', rowErrors?.description && 'border-red-300')}
                          onChange={(e) => updateLine(line.id, { description: e.target.value })}
                          placeholder="Description"
                          ref={(el) => {
                            if (!lineFieldRefs.current[line.id]) {
                              lineFieldRefs.current[line.id] = {};
                            }
                            lineFieldRefs.current[line.id].description = el;
                          }}
                          value={line.description}
                        />
                        {line.productId ? (
                          <span className="mt-1 inline-block rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                            Catalogue
                          </span>
                        ) : null}
                      </td>
                      <td className="px-2 py-2">
                        <TextInput
                          className={cn('py-1.5 text-sm', rowErrors?.quantity && 'border-red-300')}
                          onChange={(e) => updateLine(line.id, { quantity: e.target.value })}
                          ref={(el) => {
                            if (!lineFieldRefs.current[line.id]) {
                              lineFieldRefs.current[line.id] = {};
                            }
                            lineFieldRefs.current[line.id].quantity = el;
                          }}
                          value={line.quantity}
                        />
                        <InlineFieldError message={submitAttempted ? rowErrors?.quantity : undefined} />
                      </td>
                      <td className="px-2 py-2">
                        <TextInput
                          className={cn('py-1.5 text-sm', rowErrors?.unitPrice && 'border-red-300')}
                          onChange={(e) => updateLine(line.id, { unitPrice: e.target.value })}
                          ref={(el) => {
                            if (!lineFieldRefs.current[line.id]) {
                              lineFieldRefs.current[line.id] = {};
                            }
                            lineFieldRefs.current[line.id].unitPrice = el;
                          }}
                          value={line.unitPrice}
                        />
                        <InlineFieldError message={submitAttempted ? rowErrors?.unitPrice : undefined} />
                      </td>
                      <td className="px-2 py-2">
                        <TextInput
                          className="py-1.5 text-sm"
                          onChange={(e) => updateLine(line.id, { vatRate: e.target.value })}
                          value={line.vatRate}
                        />
                      </td>
                      <td className="px-2 py-2 text-right font-semibold text-slate-800">
                        {formatCurrency(lineTotal)}
                      </td>
                      <td className="px-2 py-2">
                        <button
                          className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-30"
                          disabled={lines.length <= 1}
                          onClick={() => removeLine(line.id)}
                          type="button">
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </main>
        </div>

        <ResizeHandle onResize={(delta) => setPreviewWidth((w) => w + delta)} />

        <section
          className="hidden min-h-0 shrink-0 flex-col border-l border-slate-200 bg-white lg:flex"
          style={{ width: previewWidth }}>
          <ComposerLivePreview draft={draftInput} scope={scope} userEmail={user?.email} />
        </section>
      </div>

      {/* Aperçu mobile */}
      <div className="h-72 shrink-0 border-t border-slate-200 lg:hidden">
        <ComposerLivePreview draft={draftInput} scope={scope} userEmail={user?.email} />
      </div>
    </div>
  );
}
