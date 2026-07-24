'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  FileSpreadsheet,
  Library,
  Plus,
  Save,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react';

import { CatalogPicker } from '@/components/app/catalog-picker';
import { ClientPicker } from '@/components/app/client-picker';
import { ComposerErrorBanner, InlineFieldError } from '@/components/app/document-composer/field-errors';
import { ComposerTemplateBar } from '@/components/app/document-composer/template-bar';
import {
  getFirstErrorTarget,
  hasValidationErrors,
  validateDocumentDraft,
  type FieldErrors,
  type LineValue,
} from '@/components/app/document-composer/validation';
import { LoadingState } from '@/components/app/ui';
import { TextArea, TextInput } from '@/components/app/form-fields';
import { useAuth } from '@/providers/auth-provider';
import { useTenant } from '@/providers/company-provider';
import { useSettings } from '@/hooks/use-settings';
import { fetchClientsPage } from '@/lib/domain/supabase/clients';
import { createInvoice } from '@/lib/domain/supabase/invoices';
import { createQuote } from '@/lib/domain/supabase/quotes';
import { enforcePlanLimit } from '@/lib/subscription/limit-guard';
import { PlanLimitError } from '@/types/subscription';
import { fetchProductsByIds } from '@/lib/domain/supabase/products';
import { clientsQueryKeys, invoicesQueryKeys, quotesQueryKeys } from '@/lib/domain/supabase/query-keys';
import { analyzeProductImage, type ProductImageAnalysis } from '@/lib/domain/ai/product-image-analysis';
import { calculateLineTotals } from '@/lib/calculations/totals';
import { getDefaultComposerTemplateId } from '@/lib/domain/pdf/composer-templates';
import { requireScope } from '@/lib/domain/tenant/scope';
import { formatCurrency } from '@/lib/domain/format/currency';
import { createEmptyInvoiceLine } from '@inveq/types/invoice';
import { createEmptyQuoteLine, createLocalLineId } from '@inveq/types/quote';
import type { Product } from '@/types/product';
import { CLIENTS_PAGE_SIZE } from '@inveq/types/clients-list';
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

function lineFromAiProduct(item: ProductImageAnalysis, kind: 'invoice' | 'quote'): LineValue {
  const base = kind === 'invoice' ? createEmptyInvoiceLine() : createEmptyQuoteLine();
  const vatRate = item.vat ?? 20;
  const unitPrice =
    item.price_ht ??
    (item.price_ttc !== null ? item.price_ttc / (1 + Math.max(vatRate, 0) / 100) : 0);

  return {
    ...base,
    id: createLocalLineId(),
    productId: null,
    description: item.title?.trim() || item.description?.trim() || 'Produit IA',
    quantity: String(Math.max(1, item.quantity || 1)),
    unit: item.unit || 'unité',
    unitPrice: String(Number(unitPrice.toFixed(2))),
    vatRate: String(vatRate),
    discountPercent: '0',
  };
}

async function readFileText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => reject(new Error('Impossible de lire le fichier.'));
    reader.readAsText(file);
  });
}

function normalizeHeader(header: string): string {
  return header
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

function parseFlexibleNumber(value: string, fallback = 0): number {
  const raw = value
    .trim()
    .replace(/\u00a0/g, ' ')
    .replace(/[€$£]/g, '')
    .replace(/\s/g, '');
  if (!raw) {
    return fallback;
  }
  const hasComma = raw.includes(',');
  const hasDot = raw.includes('.');
  let normalized = raw;
  if (hasComma && hasDot) {
    const comma = raw.lastIndexOf(',');
    const dot = raw.lastIndexOf('.');
    normalized = comma > dot ? raw.replace(/\./g, '').replace(',', '.') : raw.replace(/,/g, '');
  } else if (hasComma) {
    normalized = raw.replace(',', '.');
  }
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseVatRate(value: string, fallback = 20): number {
  const raw = value.trim();
  if (!raw) return fallback;
  const parsed = parseFlexibleNumber(raw, fallback);
  if (raw.includes('%')) return parsed;
  return parsed >= 0 && parsed <= 1 ? parsed * 100 : parsed;
}

function buildLinesFromTabularRows(
  headers: string[],
  rows: string[][],
  kind: 'invoice' | 'quote',
): LineValue[] {
  const normalizedHeaders = headers.map(normalizeHeader);
  const findHeaderIndex = (aliases: string[]) =>
    normalizedHeaders.findIndex((entry) => aliases.includes(entry));

  const index = {
    title: findHeaderIndex(['titre', 'title', 'nom', 'name', 'produit', 'designation']),
    description: findHeaderIndex(['description', 'details', 'detail']),
    quantity: findHeaderIndex(['quantite', 'qty', 'quantity', 'qte']),
    unitPrice: findHeaderIndex([
      'prixht',
      'prixunitaireht',
      'priceht',
      'unitprice',
      'unitpriceht',
      'prix',
      'price',
    ]),
    vat: findHeaderIndex(['tva', 'vat', 'vatrate', 'tauxtva']),
    unit: findHeaderIndex(['unite', 'unit']),
  };

  const mapped: LineValue[] = [];
  for (const cells of rows) {
    const title = index.title >= 0 ? (cells[index.title] ?? '').trim() : '';
    const extra = index.description >= 0 ? (cells[index.description] ?? '').trim() : '';
    const description = [title, extra].filter(Boolean).join(' ').trim();
    if (!description) {
      continue;
    }
    const base = kind === 'invoice' ? createEmptyInvoiceLine() : createEmptyQuoteLine();
    mapped.push({
      ...base,
      id: createLocalLineId(),
      description,
      quantity: String(parseFlexibleNumber((index.quantity >= 0 ? cells[index.quantity] : '') || '1', 1)),
      unit: (index.unit >= 0 ? cells[index.unit] : '') || 'unité',
      unitPrice: String(parseFlexibleNumber((index.unitPrice >= 0 ? cells[index.unitPrice] : '') || '0', 0)),
      vatRate: String(parseVatRate((index.vat >= 0 ? cells[index.vat] : '') || '20', 20)),
      discountPercent: '0',
    });
  }

  return mapped;
}

function parseCsvLines(raw: string, kind: 'invoice' | 'quote'): LineValue[] {
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length <= 1) {
    return [];
  }

  const delimiter = lines[0].includes(';') ? ';' : ',';
  const headers = lines[0].split(delimiter).map((entry) => entry.trim());
  const rows = lines.slice(1).map((line) => line.split(delimiter).map((entry) => entry.trim()));
  return buildLinesFromTabularRows(headers, rows, kind);
}

async function parseExcelLines(file: File, kind: 'invoice' | 'quote'): Promise<LineValue[]> {
  const XLSX = await import('xlsx');
  const workbook = XLSX.read(await file.arrayBuffer(), {
    type: 'array',
    dense: true,
  });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    return [];
  }
  const worksheet = workbook.Sheets[firstSheetName];
  const rawRows = XLSX.utils.sheet_to_json<(string | number | null)[]>(worksheet, {
    header: 1,
    blankrows: false,
  });
  if (!Array.isArray(rawRows) || rawRows.length <= 1) {
    return [];
  }

  const headers = rawRows[0].map((entry) => String(entry ?? '').trim());
  const rows = rawRows
    .slice(1)
    .map((row) => row.map((entry) => String(entry ?? '').trim()))
    .filter((row) => row.some((cell) => cell));

  return buildLinesFromTabularRows(headers, rows, kind);
}

export function DocumentComposer({ kind }: { kind: 'invoice' | 'quote' }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedClient = searchParams.get('client') ?? '';
  const fromProductsParam = searchParams.get('fromProducts') ?? '';
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
  const [isImportingAi, setIsImportingAi] = useState(false);
  const [importFeedback, setImportFeedback] = useState<string | null>(null);
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const initializedFromProductsRef = useRef(false);

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

  useEffect(() => {
    if (initializedFromProductsRef.current) {
      return;
    }
    const productIds = fromProductsParam
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean);
    if (productIds.length === 0 || !scope?.userId) {
      initializedFromProductsRef.current = true;
      return;
    }

    initializedFromProductsRef.current = true;
    const activeScope = requireScope(scope);
    void (async () => {
      const picked = await fetchProductsByIds(activeScope, 'product', productIds);
      if (picked.length === 0) {
        return;
      }
      addFromCatalogMany(picked);
      setImportFeedback(`${picked.length} produit(s) ajouté(s) depuis le catalogue.`);
    })();
  }, [fromProductsParam, scope]);

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

      await enforcePlanLimit('documents', () => undefined);

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
      if (err.message === 'VALIDATION') {
        return;
      }
      if (err instanceof PlanLimitError || err.message === 'PLAN_LIMIT_REACHED') {
        setFieldErrors({
          linesGlobal:
            'Limite de documents atteinte pour votre offre. Passez à une offre supérieure.',
        });
        setSubmitAttempted(true);
        return;
      }
      setFieldErrors({ linesGlobal: err.message });
      setSubmitAttempted(true);
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
    setLines((prev) => {
      const next = prev.map((line) => (line.id === id ? { ...line, ...patch } : line));
      if (submitAttempted) {
        setFieldErrors(validateDocumentDraft(clientId, next));
      }
      return next;
    });
  }

  function addLine() {
    setLines((prev) => {
      const next = [
        ...prev,
        kind === 'invoice' ? createEmptyInvoiceLine() : createEmptyQuoteLine(),
      ];
      if (submitAttempted) {
        setFieldErrors(validateDocumentDraft(clientId, next));
      }
      return next;
    });
  }

  function addFromCatalogMany(items: Product[]) {
    if (items.length === 0) {
      return;
    }
    setLines((prev) => {
      const next = [...prev];
      for (const item of items) {
        const emptyIndex = next.findIndex((l) => !l.description.trim());
        const newLine = lineFromCatalog(item, kind);
        if (emptyIndex >= 0) {
          next[emptyIndex] = newLine;
        } else {
          next.push(newLine);
        }
      }
      if (submitAttempted) {
        setFieldErrors(validateDocumentDraft(clientId, next));
      }
      return next;
    });
  }

  async function handleImportFiles(files: FileList | null) {
    if (!files || files.length === 0) {
      return;
    }

    setIsImportingAi(true);
    setImportFeedback(null);
    try {
      const imported: LineValue[] = [];
      for (const file of Array.from(files)) {
        if (file.type.includes('image/')) {
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const result = typeof reader.result === 'string' ? reader.result : '';
              const [, encoded = ''] = result.split(',');
              if (!encoded) {
                reject(new Error('Image invalide.'));
                return;
              }
              resolve(encoded);
            };
            reader.onerror = () => reject(new Error('Lecture image impossible.'));
            reader.readAsDataURL(file);
          });

          const analysis = await analyzeProductImage({
            imageBase64: base64,
            mimeType: file.type || 'image/jpeg',
          });
          const products =
            Array.isArray(analysis.products) && analysis.products.length > 0
              ? analysis.products
              : [analysis];
          imported.push(...products.map((entry) => lineFromAiProduct(entry, kind)));
          continue;
        }

        if (
          file.type.includes('csv') ||
          file.name.toLowerCase().endsWith('.csv') ||
          file.name.toLowerCase().endsWith('.txt')
        ) {
          const text = await readFileText(file);
          imported.push(...parseCsvLines(text, kind));
          continue;
        }

        if (file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls')) {
          imported.push(...(await parseExcelLines(file, kind)));
          continue;
        }
      }

      if (imported.length === 0) {
        throw new Error('Aucun produit exploitable detecte.');
      }

      setLines((prev) => {
        const next = [...prev];
        for (const newLine of imported) {
          const emptyIndex = next.findIndex((line) => !line.description.trim());
          if (emptyIndex >= 0) {
            next[emptyIndex] = newLine;
          } else {
            next.push(newLine);
          }
        }
        if (submitAttempted) {
          setFieldErrors(validateDocumentDraft(clientId, next));
        }
        return next;
      });
      setImportFeedback(`${imported.length} produit(s) ajoute(s)`);
    } catch (error) {
      setImportFeedback(error instanceof Error ? error.message : 'Import impossible.');
    } finally {
      setIsImportingAi(false);
    }
  }

  function removeLine(id: string) {
    setLines((prev) => {
      const next = prev.length <= 1 ? prev : prev.filter((l) => l.id !== id);
      if (submitAttempted) {
        setFieldErrors(validateDocumentDraft(clientId, next));
      }
      return next;
    });
  }

  function handleCancel() {
    router.replace(kind === 'quote' ? '/app/quotes' : '/app/invoices');
  }

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
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[#F4F6F9]">
      <CatalogPicker onClose={() => setCatalogOpen(false)} onSelectMany={addFromCatalogMany} open={catalogOpen} />

      {/* Barre supérieure */}
      <header className="shrink-0 border-b border-slate-200/90 bg-white/95 backdrop-blur-sm">
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
              <h1 className="truncate text-lg font-semibold tracking-tight text-slate-900">{title}</h1>
              <p className="text-xs text-slate-500">Éditeur clair et simplifié</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              className="rounded-xl border border-slate-200/90 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition duration-150 hover:-translate-y-0.5 hover:bg-slate-50"
              onClick={handleCancel}
              type="button">
              Annuler
            </button>
            <button
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_24px_-10px_rgba(37,99,235,0.65)] transition duration-150 hover:-translate-y-0.5 hover:bg-primary-dark disabled:opacity-60 disabled:hover:translate-y-0"
              disabled={createMutation.isPending}
              onClick={handleSubmit}
              type="button">
              <Save size={16} />
              {createMutation.isPending ? 'Création…' : `Créer la ${label}`}
            </button>
          </div>
        </div>
        <div className="border-t border-slate-100 bg-slate-50/60 px-4 py-2.5 lg:px-5">
          <ComposerTemplateBar onChange={setTemplateId} value={templateId} />
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <div className="grid min-w-0 flex-1 grid-cols-1 md:grid-cols-[260px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)]">
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
              <ClientPicker
                clients={clients}
                error={Boolean(fieldErrors.clientId)}
                loading={clientsQuery.isLoading}
                onChange={(id) => {
                  setClientId(id);
                  if (submitAttempted) {
                    setFieldErrors(validateDocumentDraft(id, lines));
                  }
                }}
                value={clientId}
              />
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
        <main className="flex min-h-0 flex-col border-b border-slate-200 bg-white lg:border-b-0" ref={linesRef}>
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Prestations & produits
            </h2>
            <div className="flex flex-wrap gap-2">
              <button
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                onClick={addLine}
                type="button">
                <Plus size={14} />
                Manuel
              </button>
              <button
                className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-blue-100"
                onClick={() => setCatalogOpen(true)}
                type="button">
                <Library size={14} />
                Catalogue (multi)
              </button>
              <button
                className="inline-flex items-center gap-1.5 rounded-lg border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700 transition hover:bg-violet-100"
                onClick={() => importInputRef.current?.click()}
                type="button">
                <Sparkles size={14} />
                IA (image/CSV)
              </button>
            </div>
          </div>

          <input
            accept="image/*,.csv,.txt,.xlsx,.xls"
            className="hidden"
            multiple
            onChange={(event) => {
              void handleImportFiles(event.target.files);
              event.target.value = '';
            }}
            ref={importInputRef}
            type="file"
          />
          {importFeedback ? (
            <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-4 py-2 text-xs text-slate-600">
              <Upload size={14} />
              <span>{importFeedback}</span>
            </div>
          ) : null}
          {isImportingAi ? (
            <div className="flex items-center gap-2 border-b border-slate-100 bg-blue-50 px-4 py-2 text-xs font-medium text-primary">
              <FileSpreadsheet size={14} />
              Analyse IA/import en cours...
            </div>
          ) : null}

          <InlineFieldError
            message={submitAttempted ? fieldErrors.linesGlobal : undefined}
          />

          <div className="min-h-0 flex-1 overflow-auto">
            <div className="hidden xl:block">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50/95 text-xs font-semibold uppercase tracking-wider text-slate-500 backdrop-blur-sm">
                <tr>
                  <th className="px-3 py-2.5">Description</th>
                  <th className="w-20 px-2 py-2.5">Qté</th>
                  <th className="w-24 px-2 py-2.5">Unité</th>
                  <th className="w-28 px-2 py-2.5">Prix HT</th>
                  <th className="w-20 px-2 py-2.5">TVA</th>
                  <th className="w-28 px-2 py-2.5 text-right">Total TTC</th>
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
                    <tr className="border-b border-slate-100/90 align-top transition-colors duration-150 hover:bg-slate-50/80" key={line.id}>
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
                          className="py-1.5 text-sm"
                          onChange={(e) => updateLine(line.id, { unit: e.target.value })}
                          value={line.unit}
                        />
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
                      <td className="px-2 py-2 text-right font-semibold tabular-nums text-slate-800">
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

            <div className="space-y-3 p-3 xl:hidden">
              {lines.map((line, index) => {
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
                  <article className="rounded-xl border border-slate-200 p-3 shadow-sm" key={line.id}>
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Ligne {index + 1}
                      </p>
                      <button
                        className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-30"
                        disabled={lines.length <= 1}
                        onClick={() => removeLine(line.id)}
                        type="button">
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <TextInput
                          className={cn(rowErrors?.description && 'border-red-300')}
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
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <TextInput
                            className={cn(rowErrors?.quantity && 'border-red-300')}
                            onChange={(e) => updateLine(line.id, { quantity: e.target.value })}
                            placeholder="Qté"
                            value={line.quantity}
                          />
                          <InlineFieldError message={submitAttempted ? rowErrors?.quantity : undefined} />
                        </div>
                        <TextInput
                          onChange={(e) => updateLine(line.id, { unit: e.target.value })}
                          placeholder="Unité"
                          value={line.unit}
                        />
                        <div>
                          <TextInput
                            className={cn(rowErrors?.unitPrice && 'border-red-300')}
                            onChange={(e) => updateLine(line.id, { unitPrice: e.target.value })}
                            placeholder="Prix HT"
                            value={line.unitPrice}
                          />
                          <InlineFieldError message={submitAttempted ? rowErrors?.unitPrice : undefined} />
                        </div>
                        <TextInput
                          onChange={(e) => updateLine(line.id, { vatRate: e.target.value })}
                          placeholder="TVA %"
                          value={line.vatRate}
                        />
                      </div>

                      <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                        <span className="text-xs font-medium text-slate-500">Total TTC</span>
                        <span className="text-sm font-semibold tabular-nums text-slate-900">
                          {formatCurrency(lineTotal)}
                        </span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </main>
        </div>
      </div>
    </div>
  );
}
