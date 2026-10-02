'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus_Jakarta_Sans } from 'next/font/google';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';

import { CatalogPicker } from '@/components/app/catalog-picker';
import {
  ComposerClientDatesPanel,
  composerClientLabel,
} from '@/components/app/document-composer/client-panel';
import { ComposerHeader, ComposerTopBar } from '@/components/app/document-composer/composer-header';
import { ComposerErrorBanner } from '@/components/app/document-composer/field-errors';
import {
  ComposerLinesPanel,
  type LineFieldName,
} from '@/components/app/document-composer/lines-panel';
import { ComposerOptionsPanel } from '@/components/app/document-composer/options-panel';
import {
  buildComposerPdfInput,
  useComposerPreviewCompany,
  useDebouncedValue,
} from '@/components/app/document-composer/preview';
import {
  ComposerPreviewColumn,
  rememberTemplate,
} from '@/components/app/document-composer/preview-column';
import { ComposerTemplateGallery } from '@/components/app/document-composer/template-gallery';
import type { ComposerSaveTone } from '@/components/app/document-composer/ui';
import {
  COMPOSER_WIZARD_STEPS,
  ComposerRecapCard,
  ComposerWizardProgress,
  ComposerWizardShell,
} from '@/components/app/document-composer/wizard';
import {
  getFirstErrorTarget,
  hasValidationErrors,
  validateDocumentDraft,
  type FieldErrors,
  type LineValue,
} from '@/components/app/document-composer/validation';
import { LoadingState } from '@/components/app/ui';
import { useAuth } from '@/providers/auth-provider';
import { useTenant } from '@/providers/company-provider';
import { useImagePaste } from '@/hooks/use-image-paste';
import { useToast } from '@/providers/toast-provider';
import { useSettings } from '@/hooks/use-settings';
import { createClient, fetchClientsPage } from '@/lib/domain/supabase/clients';
import {
  createInvoice,
  fetchInvoiceById,
  fetchInvoicePdfOptions,
  updateInvoice,
} from '@/lib/domain/supabase/invoices';
import { createQuote } from '@/lib/domain/supabase/quotes';
import { enforcePlanLimit } from '@/lib/subscription/limit-guard';
import { PlanLimitError } from '@/types/subscription';
import { fetchProducts, fetchProductsByIds } from '@/lib/domain/supabase/products';
import type { VoiceCommandResult } from '@/lib/domain/ai/voice-command';
import {
  VoiceDictation,
  type VoiceDictationHandle,
} from '@/components/app/document-composer/voice-dictation';
import { createEmptyClientFormValues, type Client } from '@/types/client';
import { clientsQueryKeys, invoicesQueryKeys, quotesQueryKeys } from '@/lib/domain/supabase/query-keys';
import { analyzeProductImage, type ProductImageAnalysis } from '@/lib/domain/ai/product-image-analysis';
import { calculateLineTotals } from '@/lib/calculations/totals';
import {
  addCalendarDaysDateInput,
  frenchDateInputToIso,
  frenchLabelFromDateInput,
  isoToFrenchDateInput,
  todayDateInput,
} from '@/lib/domain/format/date-input';
import { getDefaultComposerTemplateId } from '@/lib/domain/pdf/composer-templates';
import { requireScope } from '@/lib/domain/tenant/scope';
import { cn } from '@/lib/utils';
import {
  createEmptyInvoiceLine,
  INVOICE_STATUS_LABELS,
  type InvoiceStatus,
} from '@inveq/types/invoice';
import { createEmptyQuoteLine, createLocalLineId } from '@inveq/types/quote';
import type { Product } from '@/types/product';
import {
  createDefaultInvoicePdfOptions,
  readRememberedLegalIds,
  rememberLegalIds,
  type InvoicePdfOptions,
} from '@/types/pdf-options';
import { CLIENTS_PAGE_SIZE } from '@inveq/types/clients-list';

/** Police de l'éditeur (handoff « Nouvelle facture ») : Plus Jakarta Sans. */
const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-iq',
  display: 'swap',
});

/** Sous ce palier le composer devient un assistant en 3 étapes (handoff §5). */
const WIZARD_QUERY = '(max-width: 899px)';

const DEFAULT_PAYMENT_TERMS_DAYS = 30;

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

function useWizardLayout(): boolean {
  const subscribe = useCallback((onStoreChange: () => void) => {
    const query = window.matchMedia(WIZARD_QUERY);
    query.addEventListener('change', onStoreChange);
    return () => query.removeEventListener('change', onStoreChange);
  }, []);

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(WIZARD_QUERY).matches,
    () => false,
  );
}

/** Facture existante, chargée pour modification. */
type InvoiceEditState = {
  id: string;
  clientId: string;
  issuedAt: string;
  paymentChoice: number | 'paid' | null;
  notes: string;
  number: string;
  pdfOptions: InvoicePdfOptions;
  lines: LineValue[];
  status: InvoiceStatus;
};

/** Modification d'une facture : charge la facture puis ouvre l'éditeur prérempli. */
export function InvoiceEditor({ invoiceId }: { invoiceId: string }) {
  const { scope } = useTenant();
  const query = useQuery({
    queryKey: ['invoice-edit', invoiceId],
    queryFn: async (): Promise<InvoiceEditState | null> => {
      const activeScope = requireScope(scope);
      const [invoice, pdfOptions] = await Promise.all([
        fetchInvoiceById(activeScope, invoiceId),
        fetchInvoicePdfOptions(activeScope, invoiceId),
      ]);
      if (!invoice) {
        return null;
      }
      const days =
        invoice.issuedAt && invoice.dueAt
          ? Math.round((Date.parse(invoice.dueAt) - Date.parse(invoice.issuedAt)) / 86_400_000)
          : null;
      return {
        id: invoice.id,
        clientId: invoice.clientId ?? '',
        issuedAt: isoToFrenchDateInput(invoice.issuedAt) || todayDateInput(),
        paymentChoice: invoice.status === 'paid' ? 'paid' : days !== null && days >= 0 ? days : null,
        notes: invoice.notes ?? '',
        number: invoice.number,
        pdfOptions,
        lines: invoice.lines.length > 0 ? invoice.lines : [createEmptyInvoiceLine()],
        status: invoice.status,
      };
    },
    enabled: Boolean(scope?.companyId),
    staleTime: 0,
    gcTime: 0,
  });

  if (query.isLoading || !scope?.companyId) {
    return <LoadingState message="Chargement de la facture…" />;
  }
  if (!query.data) {
    return <LoadingState message="Facture introuvable." />;
  }
  return <DocumentComposer edit={query.data} key={query.data.id} kind="invoice" />;
}

export function DocumentComposer({
  kind,
  edit,
}: {
  kind: 'invoice' | 'quote';
  /** Présent : modification de cette facture au lieu d'une création. */
  edit?: InvoiceEditState;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedClient = searchParams.get('client') ?? '';
  const fromProductsParam = searchParams.get('fromProducts') ?? '';
  const { user, loading: authLoading } = useAuth();
  const { scope, activeCompany, loading: tenantLoading } = useTenant();
  const { settings, loading: settingsLoading } = useSettings();
  const queryClient = useQueryClient();
  const { showError } = useToast();
  const isWizard = useWizardLayout();

  const [clientId, setClientId] = useState(edit?.clientId ?? preselectedClient);
  const [issuedAt, setIssuedAt] = useState(() => edit?.issuedAt ?? todayDateInput());
  const [paymentChoice, setPaymentChoice] = useState<number | 'paid' | null>(
    edit?.paymentChoice ?? null,
  );
  const [notes, setNotes] = useState(edit?.notes ?? '');
  const [templateId, setTemplateId] = useState(edit?.pdfOptions.templateId ?? '');
  const [customNumber, setCustomNumber] = useState(edit?.number ?? '');
  const [pdfOptions, setPdfOptions] = useState<InvoicePdfOptions>(
    () =>
      edit?.pdfOptions ?? {
        ...createDefaultInvoicePdfOptions(),
        legalIds: readRememberedLegalIds(),
      },
  );
  const [lines, setLines] = useState<LineValue[]>(
    () => edit?.lines ?? [kind === 'invoice' ? createEmptyInvoiceLine() : createEmptyQuoteLine()],
  );
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [catalogOpen, setCatalogOpen] = useState(false);
  /**
   * Client choisi par la dictée ou créé depuis l'éditeur, ajouté à la liste
   * s'il n'est pas (encore) sur la première page.
   */
  const [voiceClient, setVoiceClient] = useState<Client | null>(null);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [isImportingAi, setIsImportingAi] = useState(false);
  const [importFeedback, setImportFeedback] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [galleryOpen, setGalleryOpen] = useState(false);
  /** Nom du fichier en cours de lecture (bandeau « Lecture de … »). */
  const [importLabel, setImportLabel] = useState<string | null>(null);
  const spreadsheetInputRef = useRef<HTMLInputElement | null>(null);
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const voiceRef = useRef<VoiceDictationHandle>(null);
  const initializedFromProductsRef = useRef(false);

  const clientRef = useRef<HTMLDivElement>(null);
  const termsRef = useRef<HTMLDivElement>(null);
  const linesRef = useRef<HTMLElement>(null);
  const lineFieldRefs = useRef<
    Record<string, Partial<Record<LineFieldName, HTMLInputElement[]>>>
  >({});

  /** Modèle choisi, sinon celui des paramètres une fois chargés. */
  const effectiveTemplateId =
    templateId || (settings ? getDefaultComposerTemplateId(kind, settings) : '');

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
    let discount = 0;
    const perLine: Record<string, number> = {};
    const perLineHt: Record<string, number> = {};
    // Ventilation affichée sous les lignes : mêmes montants, regroupés par taux.
    const byRate = new Map<number, { base: number; amount: number }>();
    for (const line of lines) {
      if (!line.description.trim()) {
        perLine[line.id] = 0;
        perLineHt[line.id] = 0;
        continue;
      }
      const vatRate = parseDecimal(line.vatRate);
      const result = calculateLineTotals(
        parseDecimal(line.quantity),
        parseDecimal(line.unitPrice),
        vatRate,
        parseDecimal(line.discountPercent),
      );
      perLine[line.id] = result.lineTotalTtc;
      perLineHt[line.id] = result.lineTotalHt;
      subtotal += result.lineTotalHt;
      vat += result.lineVat;
      discount += result.discountAmount;
      const group = byRate.get(vatRate) ?? { base: 0, amount: 0 };
      group.base += result.lineTotalHt;
      group.amount += result.lineVat;
      byRate.set(vatRate, group);
    }
    const vatGroups = [...byRate.entries()]
      .sort(([a], [b]) => b - a)
      .map(([rate, group]) => ({ rate, ...group }));
    return { subtotal, vat, total: subtotal + vat, perLine, perLineHt, discount, vatGroups };
  }, [lines]);

  const registerLineField = useCallback(
    (lineId: string, field: LineFieldName, element: HTMLInputElement | null) => {
      const fields = (lineFieldRefs.current[lineId] ??= {});
      const kept = (fields[field] ?? []).filter(
        (node) => node.isConnected && node !== element,
      );
      if (element) {
        kept.push(element);
      }
      fields[field] = kept;
    },
    [],
  );

  const scrollToFirstError = useCallback(
    (errors: FieldErrors) => {
      const target = getFirstErrorTarget(errors, lines);
      if (!target) return;

      // En assistant, le champ fautif peut appartenir à une autre étape.
      setStep(target.type === 'lines' || target.type === 'line' ? 1 : 0);

      const reveal = () => {
        if (target.type === 'client') {
          clientRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return;
        }

        if (target.type === 'terms') {
          termsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return;
        }

        if (target.type === 'lines') {
          linesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          return;
        }

        const candidates = lineFieldRefs.current[target.lineId]?.[target.field] ?? [];
        const input = candidates.find((node) => node.offsetParent !== null) ?? candidates[0];
        input?.focus();
        input?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      };

      requestAnimationFrame(() => requestAnimationFrame(reveal));
    },
    [lines],
  );

  const settingsPaymentTerms = settings?.paymentTermsDays ?? DEFAULT_PAYMENT_TERMS_DAYS;
  const selectedPayment = paymentChoice ?? settingsPaymentTerms;
  const alreadyPaid = selectedPayment === 'paid';
  const paymentTermsDays = alreadyPaid ? null : selectedPayment;

  const createMutation = useMutation({
    mutationFn: async () => {
      const errors = validateDocumentDraft(clientId, lines, issuedAt);
      if (hasValidationErrors(errors)) {
        setFieldErrors(errors);
        setSubmitAttempted(true);
        scrollToFirstError(errors);
        throw new Error('VALIDATION');
      }

      const issuedAtIso = frenchDateInputToIso(issuedAt);
      if (!issuedAtIso) {
        throw new Error('VALIDATION');
      }

      const activeScope = requireScope(scope);
      const validLines = lines.filter((l) => l.description.trim());

      if (edit) {
        const dueDays = paymentTermsDays ?? settingsPaymentTerms;
        const dueDate = alreadyPaid ? null : addCalendarDaysDateInput(issuedAt, dueDays);
        return updateInvoice(activeScope, edit.id, {
          alreadyPaid,
          clientId,
          dueAt: dueDate ? frenchDateInputToIso(dueDate) : null,
          issuedAt: issuedAtIso,
          lines: validLines,
          notes: notes.trim() || undefined,
          number: customNumber.trim() || null,
          pdfOptions: { ...pdfOptions, templateId: effectiveTemplateId || null },
        });
      }

      await enforcePlanLimit('documents', () => undefined);

      if (kind === 'quote') {
        return createQuote(activeScope, {
          clientId,
          issuedAt: issuedAtIso,
          lines: validLines,
          notes: notes.trim() || undefined,
        });
      }

      if (alreadyPaid) {
        return createInvoice(activeScope, {
          alreadyPaid: true,
          clientId,
          dueAt: null,
          issuedAt: issuedAtIso,
          lines: validLines,
          notes: notes.trim() || undefined,
          number: customNumber.trim() || null,
          pdfOptions: { ...pdfOptions, templateId: effectiveTemplateId || null },
        });
      }

      const dueDays = paymentTermsDays ?? settingsPaymentTerms;
      const dueDate = addCalendarDaysDateInput(issuedAt, dueDays);
      const dueAtIso = dueDate ? frenchDateInputToIso(dueDate) : null;

      return createInvoice(activeScope, {
        clientId,
        dueAt: dueAtIso,
        issuedAt: issuedAtIso,
        lines: validLines,
        notes: notes.trim() || undefined,
        paymentTermsDays: dueDays,
        number: customNumber.trim() || null,
        pdfOptions: { ...pdfOptions, templateId: effectiveTemplateId || null },
      });
    },
    onSuccess: (doc) => {
      if (kind === 'invoice') rememberLegalIds(pdfOptions.legalIds);
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
      // Le bandeau d'erreur est en haut de l'éditeur, souvent hors de vue au
      // moment du clic : on l'annonce aussi par une notification.
      showError(err.message);
    },
  });

  function handleSubmit() {
    const errors = validateDocumentDraft(clientId, lines, issuedAt);
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
        setFieldErrors(validateDocumentDraft(clientId, next, issuedAt));
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
        setFieldErrors(validateDocumentDraft(clientId, next, issuedAt));
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
        setFieldErrors(validateDocumentDraft(clientId, next, issuedAt));
      }
      return next;
    });
  }

  async function handleImportFiles(files: FileList | File[] | null) {
    if (!files || files.length === 0) {
      return;
    }

    const fileList = Array.from(files);
    setImportLabel(
      fileList.length === 1 ? fileList[0].name || 'capture collée' : `${fileList.length} fichiers`,
    );
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
          setFieldErrors(validateDocumentDraft(clientId, next, issuedAt));
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

  // Une capture copiée se colle directement sur l'éditeur, sans l'enregistrer d'abord.
  useImagePaste(
    (images) => void handleImportFiles(images),
    !isImportingAi && !catalogOpen && !galleryOpen,
  );

  function removeLine(id: string) {
    setLines((prev) => {
      const next = prev.length <= 1 ? prev : prev.filter((l) => l.id !== id);
      if (submitAttempted) {
        setFieldErrors(validateDocumentDraft(clientId, next, issuedAt));
      }
      return next;
    });
  }

  /**
   * Résultat d'une dictée : client retrouvé (ou créé), lignes ajoutées avec le
   * prix du catalogue quand la dictée n'en donne pas, délai de paiement.
   */
  async function applyVoiceCommand({ command }: VoiceCommandResult): Promise<string> {
    const activeScope = requireScope(scope);
    const summary: string[] = [];
    const normalize = (value: string) =>
      value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();

    const spokenClient = command.client.trim();
    if (spokenClient) {
      const wanted = normalize(spokenClient);
      const { clients: found } = await fetchClientsPage(activeScope, {
        page: 0,
        pageSize: 20,
        search: spokenClient,
      });
      const match =
        found.find((client) => normalize(composerClientLabel(client)) === wanted) ??
        found.find((client) => normalize(composerClientLabel(client)).includes(wanted)) ??
        found[0];
      if (match) {
        setVoiceClient(match);
        setClientId(match.id);
        summary.push(`client ${composerClientLabel(match)}`);
      } else {
        const created = await createClient(activeScope, {
          ...createEmptyClientFormValues(),
          company: spokenClient,
        });
        void queryClient.invalidateQueries({ queryKey: clientsQueryKeys.all });
        setVoiceClient(created);
        setClientId(created.id);
        summary.push(`client ${spokenClient} créé`);
      }
    }

    if (command.items.length > 0) {
      const [products, services] = await Promise.all([
        fetchProducts(activeScope, 'product'),
        fetchProducts(activeScope, 'service'),
      ]);
      const catalog = [...products, ...services].map((item) => ({ item, key: normalize(item.name) }));
      const newLines = command.items.map((spoken) => {
        const key = normalize(spoken.description);
        const fromCatalog =
          catalog.find((entry) => entry.key === key) ??
          catalog.find((entry) => key.length > 3 && (entry.key.includes(key) || key.includes(entry.key)));
        const line: LineValue = fromCatalog
          ? lineFromCatalog(fromCatalog.item, kind)
          : {
              ...(kind === 'invoice' ? createEmptyInvoiceLine() : createEmptyQuoteLine()),
              id: createLocalLineId(),
              description: spoken.description,
            };
        return {
          ...line,
          productId: fromCatalog ? fromCatalog.item.id : null,
          quantity: String(spoken.quantity > 0 ? spoken.quantity : 1),
          unit: spoken.unit || line.unit,
          unitPrice: spoken.price_ht > 0 ? String(spoken.price_ht) : line.unitPrice,
          vatRate: command.vat !== null ? String(command.vat) : line.vatRate,
          discountPercent: command.discount ? String(command.discount) : '0',
        };
      });
      setLines((prev) => {
        const next = prev.filter((line) => line.description.trim());
        return [...next, ...newLines];
      });
      summary.push(`${newLines.length} ligne${newLines.length > 1 ? 's' : ''} ajoutée${newLines.length > 1 ? 's' : ''}`);
    }

    if (kind === 'invoice' && command.payment_terms !== null && command.payment_terms >= 0) {
      setPaymentChoice(Math.round(command.payment_terms));
      summary.push(`paiement à ${Math.round(command.payment_terms)} jours`);
    }

    if (summary.length === 0) {
      throw new Error('Rien d’exploitable dans la dictée. Précisez le client et les lignes.');
    }
    return `C’est rempli : ${summary.join(', ')}. Vérifiez puis validez.`;
  }

  function handleClientChange(id: string) {
    setClientId(id);
    if (submitAttempted) {
      setFieldErrors(validateDocumentDraft(id, lines, issuedAt));
    }
  }

  function handleIssuedAtChange(value: string) {
    setIssuedAt(value);
    if (submitAttempted) {
      setFieldErrors(validateDocumentDraft(clientId, lines, value));
    }
  }

  function handlePaymentTermsChange(value: number | 'paid') {
    setPaymentChoice(value);
  }

  function handleCancel() {
    router.replace(
      kind === 'quote' ? '/app/quotes' : edit ? `/app/invoices?selected=${edit.id}` : '/app/invoices',
    );
  }


  function handleTemplateChange(id: string) {
    setTemplateId(id);
  }

  function applyGalleryTemplate(id: string) {
    setTemplateId(id);
    rememberTemplate(id);
    setGalleryOpen(false);
  }

  // Ctrl D lance la dictée (pas en modification : la dictée n'y est pas proposée).
  useEffect(() => {
    if (edit) return;
    function onKey(event: KeyboardEvent) {
      if (
        (event.ctrlKey || event.metaKey) &&
        !event.altKey &&
        !event.shiftKey &&
        event.key.toLowerCase() === 'd'
      ) {
        event.preventDefault();
        voiceRef.current?.start();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [edit]);

  const closeGallery = useCallback(() => setGalleryOpen(false), []);
  const closeCatalog = useCallback(() => setCatalogOpen(false), []);

  const firstPageClients = clientsQuery.data?.clients ?? [];
  const clients =
    voiceClient && !firstPageClients.some((client) => client.id === voiceClient.id)
      ? [voiceClient, ...firstPageClients]
      : firstPageClients;
  const selectedClient = clients.find((client) => client.id === clientId) ?? null;
  const dueDateInput =
    kind === 'invoice' && paymentTermsDays !== null
      ? addCalendarDaysDateInput(issuedAt, paymentTermsDays)
      : null;

  /** Reproduit le format de `reserve_next_*_number` sans requête supplémentaire. */
  const forecastNumber = settings
    ? `${
        (kind === 'invoice' ? settings.invoicePrefix : settings.quotePrefix)?.trim() ||
        (kind === 'invoice' ? 'FAC' : 'DEV')
      }-${new Date().getUTCFullYear()}-${String(
        kind === 'invoice' ? settings.nextInvoiceNumber : settings.nextQuoteNumber,
      ).padStart(6, '0')}`
    : null;
  const shownNumber = customNumber.trim() || forecastNumber || (kind === 'invoice' ? 'FAC' : 'DEV');

  // Aperçu réel : le brouillon passe par le même moteur que le PDF final.
  const companyQuery = useComposerPreviewCompany();
  const previewCompany = companyQuery.data ?? null;
  const previewDueAt =
    kind === 'invoice'
      ? dueDateInput
      : addCalendarDaysDateInput(issuedAt, settings?.quoteValidityDays ?? 30);
  const previewInput = useMemo(
    () =>
      previewCompany
        ? buildComposerPdfInput(
            {
              kind,
              number: shownNumber,
              issuedAt,
              dueAt: previewDueAt,
              alreadyPaid: kind === 'invoice' && alreadyPaid,
              notes,
              lines,
              totals,
              client: selectedClient,
              templateId: effectiveTemplateId,
              pdfOptions: kind === 'invoice' ? pdfOptions : null,
            },
            previewCompany,
            settings,
          )
        : null,
    [
      alreadyPaid,
      effectiveTemplateId,
      issuedAt,
      kind,
      lines,
      notes,
      pdfOptions,
      previewCompany,
      previewDueAt,
      selectedClient,
      settings,
      shownNumber,
      totals,
    ],
  );
  const thumbnailsInput = useDebouncedValue(previewInput, 400);

  // Mode modification : « Modifications non enregistrées » dès qu'un champ change.
  const snapshot = JSON.stringify([
    clientId,
    issuedAt,
    paymentChoice,
    notes,
    templateId,
    customNumber,
    pdfOptions,
    lines,
  ]);
  const [initialSnapshot] = useState(snapshot);
  const dirty = snapshot !== initialSnapshot;

  if (authLoading || tenantLoading || settingsLoading) {
    return <LoadingState message="Préparation de l’éditeur…" />;
  }

  const documentLabel = kind === 'invoice' ? 'la facture' : 'le devis';
  const title = edit ? 'Modifier la facture' : kind === 'invoice' ? 'Nouvelle facture' : 'Nouveau devis';
  const submitLabel = edit
    ? 'Enregistrer les modifications'
    : kind === 'invoice'
      ? 'Créer la facture'
      : 'Créer le devis';
  const pendingLabel = edit ? 'Enregistrement…' : 'Création…';
  const pending = createMutation.isPending;
  const issuedAtLabel = frenchLabelFromDateInput(issuedAt) ?? '';
  const dueLabel =
    kind === 'quote'
      ? 'Non définie'
      : alreadyPaid
        ? 'Déjà payée'
        : (frenchLabelFromDateInput(dueDateInput ?? '') ?? '');
  const numberLine = edit
    ? `${shownNumber} · modifiable tant que la facture n’est pas réglée`
    : customNumber.trim()
      ? `${shownNumber} · numéro personnalisé`
      : `${shownNumber} · numéro attribué automatiquement`;

  const saveTone: ComposerSaveTone = pending
    ? 'saving'
    : edit
      ? dirty
        ? 'dirty'
        : 'saved'
      : createMutation.isSuccess
        ? 'saved'
        : 'neutral';
  const saveLabel = pending
    ? 'Enregistrement…'
    : edit
      ? dirty
        ? 'Modifications non enregistrées'
        : 'Aucune modification'
      : createMutation.isSuccess
        ? 'Enregistré'
        : 'Brouillon non enregistré';

  // Bandeau : chaque point à corriger, y compris ligne par ligne.
  const lineMessages = lines.flatMap((line, index) => {
    const row = fieldErrors.lineErrors?.[line.id];
    if (!row) return [];
    return [
      row.description ? `Ligne ${index + 1} : ${row.description.toLowerCase()}` : null,
      row.quantity ? `Ligne ${index + 1} : ${row.quantity.toLowerCase()}` : null,
      row.unitPrice ? `Ligne ${index + 1} : ${row.unitPrice.toLowerCase()}` : null,
    ].filter((message): message is string => Boolean(message));
  });
  const bannerMessages = [
    fieldErrors.clientId,
    fieldErrors.issuedAt,
    fieldErrors.linesGlobal,
    ...lineMessages,
  ].filter((message): message is string => Boolean(message));
  const validationFailed = hasValidationErrors(validateDocumentDraft(clientId, lines, issuedAt));
  const bannerTitle = validationFailed
    ? `${bannerMessages.length} point${bannerMessages.length > 1 ? 's' : ''} à corriger avant ${
        edit ? 'd’enregistrer' : `de créer ${documentLabel}`
      }`
    : `Impossible d’enregistrer ${documentLabel}`;

  const errorBanner =
    submitAttempted && bannerMessages.length > 0 ? (
      <ComposerErrorBanner messages={bannerMessages} title={bannerTitle} />
    ) : null;

  const voiceCard = edit ? null : (
    <VoiceDictation handleRef={voiceRef} kind={kind} onResult={applyVoiceCommand} />
  );

  const clientDatesPanel = (
    <ComposerClientDatesPanel
      clientError={submitAttempted ? fieldErrors.clientId : undefined}
      clientRef={clientRef}
      clients={clients}
      issuedAt={issuedAt}
      issuedAtError={submitAttempted ? fieldErrors.issuedAt : undefined}
      kind={kind}
      loading={clientsQuery.isLoading}
      onClientChange={handleClientChange}
      onClientCreated={(client) => {
        setVoiceClient(client);
        handleClientChange(client.id);
      }}
      onIssuedAtChange={handleIssuedAtChange}
      onPaymentTermsChange={handlePaymentTermsChange}
      paymentTermsDays={paymentTermsDays}
      termsRef={termsRef}
      value={clientId}
    />
  );

  const linesPanel = (
    <ComposerLinesPanel
      containerRef={linesRef}
      fieldErrors={fieldErrors}
      importFeedback={importFeedback}
      importLabel={importLabel}
      isImporting={isImportingAi}
      lines={lines}
      onAddLine={addLine}
      onImportPhoto={() => photoInputRef.current?.click()}
      onImportSpreadsheet={() => spreadsheetInputRef.current?.click()}
      onOpenCatalog={() => setCatalogOpen(true)}
      onRemoveLine={removeLine}
      onUpdateLine={updateLine}
      registerLineField={registerLineField}
      submitAttempted={submitAttempted}
      totals={totals}
    />
  );

  const notesField = (
    <div>
      <div className="mb-2 flex flex-wrap items-baseline gap-x-2.5">
        <label className="text-[15px] font-bold" htmlFor="composer-notes">
          Notes
        </label>
        <span className="text-[12.5px] text-iq-ink3">
          Affichées en bas {kind === 'invoice' ? 'de la facture' : 'du devis'}
        </span>
      </div>
      <textarea
        className="block min-h-[84px] w-full resize-y rounded-[14px] border border-iq-line bg-iq-surface px-3.5 py-3 text-[16px] leading-[1.55] text-iq-ink outline-none transition-[border-color,box-shadow] duration-150 focus:border-iq-accent focus:shadow-[0_0_0_3px_var(--iq-accent-soft)] sm:text-[14px]"
        id="composer-notes"
        onChange={(event) => setNotes(event.target.value)}
        placeholder="Conditions particulières, remerciements, références…"
        rows={3}
        value={notes}
      />
    </div>
  );

  const optionsPanel =
    kind === 'invoice' ? (
      <ComposerOptionsPanel
        company={activeCompany}
        forecastNumber={edit ? edit.number : forecastNumber}
        number={customNumber}
        onChange={setPdfOptions}
        onNumberChange={setCustomNumber}
        paid={alreadyPaid}
        value={pdfOptions}
      />
    ) : null;

  const previewColumn = (
    <ComposerPreviewColumn
      input={previewInput}
      onOpenGallery={() => setGalleryOpen(true)}
      onTemplateChange={handleTemplateChange}
      templateId={effectiveTemplateId}
      thumbnailsInput={thumbnailsInput}
    />
  );

  const filledLineCount = lines.filter((line) => line.description.trim()).length;

  return (
    <div
      className={cn(
        jakarta.variable,
        'iq-composer flex h-full min-h-0 flex-col overflow-hidden bg-iq-bg text-iq-ink',
        // Sur ordinateur, l'éditeur occupe tout l'écran (barre supérieure avec logo).
        'min-[1200px]:fixed min-[1200px]:inset-0 min-[1200px]:z-40',
      )}>
      <CatalogPicker
        kind={kind}
        onClose={closeCatalog}
        onSelectMany={addFromCatalogMany}
        open={catalogOpen}
      />

      {galleryOpen ? (
        <ComposerTemplateGallery
          input={thumbnailsInput ?? previewInput}
          onApply={applyGalleryTemplate}
          onClose={closeGallery}
          value={effectiveTemplateId}
        />
      ) : null}

      <input
        accept=".csv,.txt,.xlsx,.xls"
        className="hidden"
        multiple
        onChange={(event) => {
          void handleImportFiles(event.target.files);
          event.target.value = '';
        }}
        ref={spreadsheetInputRef}
        type="file"
      />
      <input
        accept="image/*"
        className="hidden"
        multiple
        onChange={(event) => {
          void handleImportFiles(event.target.files);
          event.target.value = '';
        }}
        ref={photoInputRef}
        type="file"
      />

      {isWizard ? (
        <>
          <ComposerHeader
            meta={`Étape ${step + 1} sur ${COMPOSER_WIZARD_STEPS.length} · ${COMPOSER_WIZARD_STEPS[step]}`}
            onBack={step > 0 ? () => setStep(step - 1) : handleCancel}
            title={title}>
            <ComposerWizardProgress step={step} />
          </ComposerHeader>
          <ComposerWizardShell
            lineCount={filledLineCount}
            onBack={step > 0 ? () => setStep(step - 1) : undefined}
            onPrimary={
              step < COMPOSER_WIZARD_STEPS.length - 1 ? () => setStep(step + 1) : handleSubmit
            }
            primaryDisabled={pending}
            primaryLabel={
              step < COMPOSER_WIZARD_STEPS.length - 1
                ? 'Continuer'
                : pending
                  ? pendingLabel
                  : submitLabel
            }
            total={totals.total}
            vat={totals.vat}>
            {errorBanner}
            {step === 0 ? (
              <>
                {voiceCard}
                {clientDatesPanel}
                {notesField}
              </>
            ) : null}
            {step === 1 ? linesPanel : null}
            {step === 2 ? (
              <>
                <ComposerRecapCard
                  clientName={selectedClient ? composerClientLabel(selectedClient) : null}
                  dueLabel={dueLabel}
                  issuedAtLabel={issuedAtLabel}
                  kind={kind}
                  lineCount={filledLineCount}
                  totals={totals}
                />
                {previewColumn}
                {optionsPanel}
              </>
            ) : null}
          </ComposerWizardShell>
        </>
      ) : (
        <>
          <ComposerTopBar
            crumbLabel={kind === 'invoice' ? 'Factures' : 'Devis'}
            onCancel={handleCancel}
            onCrumbClick={handleCancel}
            onSubmit={handleSubmit}
            pending={pending}
            saveLabel={saveLabel}
            saveTone={saveTone}
            submitLabel={pending ? pendingLabel : submitLabel}
            title={title}
            total={totals.total}
          />
          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="mx-auto grid max-w-[1680px] grid-cols-1 items-start gap-7 px-5 pb-16 pt-6 min-[1200px]:grid-cols-[minmax(0,1fr)_400px] min-[1200px]:px-6 min-[1200px]:pt-8 min-[1440px]:grid-cols-[minmax(0,1fr)_460px] min-[1440px]:gap-9 min-[1440px]:px-9">
              <div className="flex min-w-0 flex-col gap-5">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-[30px] font-extrabold leading-tight tracking-[-0.9px]">
                      {title}
                    </h1>
                    {edit ? <StatusPill status={edit.status} /> : null}
                  </div>
                  <p className="mt-1.5 text-[13.5px] text-iq-ink3">{numberLine}</p>
                </div>
                {errorBanner}
                {voiceCard}
                {clientDatesPanel}
                {linesPanel}
                {notesField}
                {optionsPanel}
              </div>
              <aside
                aria-label="Aperçu du document"
                className="w-full max-w-[460px] min-[1200px]:sticky min-[1200px]:top-8 min-[1200px]:max-w-none">
                {previewColumn}
              </aside>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/** Statut de la facture modifiée : « Envoyée », « En retard »… */
function StatusPill({ status }: { status: InvoiceStatus }) {
  return (
    <span className="flex h-[26px] items-center gap-1.5 rounded-full bg-iq-accent-soft px-2.5 text-[12px] font-bold text-iq-accent-ink">
      <span aria-hidden className="size-1.5 rounded-full bg-iq-accent" />
      {INVOICE_STATUS_LABELS[status]}
    </span>
  );
}
