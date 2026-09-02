'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import { Send } from 'lucide-react';

import { CatalogPicker } from '@/components/app/catalog-picker';
import { ComposerClientCard, composerClientLabel } from '@/components/app/document-composer/client-card';
import { ComposerCard } from '@/components/app/document-composer/composer-card';
import {
  ComposerHeader,
  ComposerSaveIndicator,
  type ComposerSaveState,
} from '@/components/app/document-composer/composer-header';
import { ComposerErrorBanner } from '@/components/app/document-composer/field-errors';
import { ComposerLinesCard, type LineFieldName } from '@/components/app/document-composer/lines-card';
import { ComposerPreviewColumn } from '@/components/app/document-composer/preview-column';
import { ComposerTemplateBar } from '@/components/app/document-composer/template-bar';
import { ComposerTermsCard } from '@/components/app/document-composer/terms-card';
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
import { PrimaryButton, SecondaryButton, TextArea } from '@/components/app/form-fields';
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
import type { DraftDocumentInput } from '@/lib/domain/pdf/draft-pdf';
import { requireScope } from '@/lib/domain/tenant/scope';
import { createEmptyInvoiceLine } from '@inveq/types/invoice';
import { createEmptyQuoteLine, createLocalLineId } from '@inveq/types/quote';
import type { Product } from '@/types/product';
import { CLIENTS_PAGE_SIZE } from '@inveq/types/clients-list';

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

export function DocumentComposer({ kind }: { kind: 'invoice' | 'quote' }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedClient = searchParams.get('client') ?? '';
  const fromProductsParam = searchParams.get('fromProducts') ?? '';
  const { user, loading: authLoading } = useAuth();
  const { scope, loading: tenantLoading } = useTenant();
  const { settings, loading: settingsLoading } = useSettings();
  const queryClient = useQueryClient();
  const isWizard = useWizardLayout();

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
  const [step, setStep] = useState(0);
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const initializedFromProductsRef = useRef(false);

  const clientRef = useRef<HTMLElement>(null);
  const linesRef = useRef<HTMLElement>(null);
  const lineFieldRefs = useRef<
    Record<string, Partial<Record<LineFieldName, HTMLInputElement[]>>>
  >({});

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
    const perLine: Record<string, number> = {};
    for (const line of lines) {
      if (!line.description.trim()) {
        perLine[line.id] = 0;
        continue;
      }
      const result = calculateLineTotals(
        parseDecimal(line.quantity),
        parseDecimal(line.unitPrice),
        parseDecimal(line.vatRate),
        parseDecimal(line.discountPercent),
      );
      perLine[line.id] = result.lineTotalTtc;
      subtotal += result.lineTotalHt;
      vat += result.lineVat;
    }
    return { subtotal, vat, total: subtotal + vat, perLine };
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
      setStep(target.type === 'client' ? 0 : 1);

      const reveal = () => {
        if (target.type === 'client') {
          clientRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
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

  function handleClientChange(id: string) {
    setClientId(id);
    if (submitAttempted) {
      setFieldErrors(validateDocumentDraft(id, lines));
    }
  }

  function handleCancel() {
    router.replace(kind === 'quote' ? '/app/quotes' : '/app/invoices');
  }

  if (authLoading || tenantLoading || settingsLoading) {
    return <LoadingState message="Préparation de l’éditeur…" />;
  }

  const clients = clientsQuery.data?.clients ?? [];
  const title = kind === 'invoice' ? 'Nouvelle facture' : 'Nouveau devis';
  const submitLabel = kind === 'invoice' ? 'Créer la facture' : 'Créer le devis';
  const paymentTermsDays = settings?.paymentTermsDays ?? DEFAULT_PAYMENT_TERMS_DAYS;
  const selectedClient = clients.find((client) => client.id === clientId) ?? null;

  /** Reproduit le format de `reserve_next_*_number` sans requête supplémentaire. */
  const forecastNumber = settings
    ? `${
        (kind === 'invoice' ? settings.invoicePrefix : settings.quotePrefix)?.trim() ||
        (kind === 'invoice' ? 'FAC' : 'DEV')
      }-${new Date().getUTCFullYear()}-${String(
        kind === 'invoice' ? settings.nextInvoiceNumber : settings.nextQuoteNumber,
      ).padStart(6, '0')}`
    : null;

  const saveState: ComposerSaveState = createMutation.isPending
    ? 'saving'
    : createMutation.isSuccess
      ? 'saved'
      : 'draft';

  const draft: DraftDocumentInput = {
    kind,
    clientId,
    notes,
    templateId,
    lines: lines.map((line) => ({
      description: line.description,
      quantity: line.quantity,
      unit: line.unit,
      unitPrice: line.unitPrice,
      vatRate: line.vatRate,
      discountPercent: line.discountPercent,
    })),
  };

  const bannerMessages = [fieldErrors.clientId, fieldErrors.linesGlobal].filter(
    (message): message is string => Boolean(message),
  );

  const errorBanner =
    submitAttempted && bannerMessages.length > 0 ? (
      <ComposerErrorBanner className="mb-3" messages={bannerMessages} />
    ) : null;

  const clientCard = (
    <ComposerClientCard
      clients={clients}
      containerRef={clientRef}
      errorMessage={submitAttempted ? fieldErrors.clientId : undefined}
      hasError={submitAttempted && Boolean(fieldErrors.clientId)}
      loading={clientsQuery.isLoading}
      onChange={handleClientChange}
      value={clientId}
    />
  );

  const termsCard = <ComposerTermsCard kind={kind} paymentTermsDays={paymentTermsDays} />;

  const notesCard = (
    <ComposerCard title="Notes affichées sur le document">
      <TextArea
        className="min-h-[74px]"
        onChange={(event) => setNotes(event.target.value)}
        placeholder="Conditions, remarques…"
        rows={3}
        value={notes}
      />
    </ComposerCard>
  );

  const linesCard = (
    <ComposerLinesCard
      containerRef={linesRef}
      fieldErrors={fieldErrors}
      importFeedback={importFeedback}
      isImporting={isImportingAi}
      lineTotals={totals.perLine}
      lines={lines}
      onAddLine={addLine}
      onOpenCatalog={() => setCatalogOpen(true)}
      onOpenImport={() => importInputRef.current?.click()}
      onRemoveLine={removeLine}
      onUpdateLine={updateLine}
      registerLineField={registerLineField}
      submitAttempted={submitAttempted}
      totals={totals}
    />
  );

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-app-canvas">
      <CatalogPicker
        onClose={() => setCatalogOpen(false)}
        onSelectMany={addFromCatalogMany}
        open={catalogOpen}
      />

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

      <ComposerHeader
        actions={
          isWizard ? null : (
            <>
              <ComposerSaveIndicator className="hidden min-[1180px]:flex" state={saveState} />
              <SecondaryButton onClick={handleCancel}>Annuler</SecondaryButton>
              <PrimaryButton disabled={createMutation.isPending} onClick={handleSubmit}>
                <Send size={15} strokeWidth={1.9} />
                {createMutation.isPending ? 'Création…' : submitLabel}
              </PrimaryButton>
            </>
          )
        }
        meta={
          isWizard
            ? `Étape ${step + 1} sur ${COMPOSER_WIZARD_STEPS.length} · ${COMPOSER_WIZARD_STEPS[step]}`
            : (forecastNumber ?? undefined)
        }
        onBack={isWizard && step > 0 ? () => setStep(step - 1) : handleCancel}
        title={title}>
        {isWizard ? <ComposerWizardProgress step={step} /> : null}
      </ComposerHeader>

      {isWizard ? (
        <ComposerWizardShell
          onPrimary={step < COMPOSER_WIZARD_STEPS.length - 1 ? () => setStep(step + 1) : handleSubmit}
          primaryDisabled={createMutation.isPending}
          primaryLabel={
            step < COMPOSER_WIZARD_STEPS.length - 1
              ? 'Continuer'
              : createMutation.isPending
                ? 'Création…'
                : submitLabel
          }
          total={totals.total}>
          {errorBanner}
          {step === 0 ? (
            <>
              {clientCard}
              {termsCard}
              {notesCard}
            </>
          ) : null}
          {step === 1 ? linesCard : null}
          {step === 2 ? (
            <>
              <ComposerRecapCard
                clientName={selectedClient ? composerClientLabel(selectedClient) : null}
                kind={kind}
                lineCount={lines.filter((line) => line.description.trim()).length}
                paymentTermsDays={paymentTermsDays}
                totals={totals}
              />
              <ComposerCard title="Modèle PDF">
                <ComposerTemplateBar onChange={setTemplateId} value={templateId} />
              </ComposerCard>
            </>
          ) : null}
        </ComposerWizardShell>
      ) : (
        <div className="sb min-h-0 flex-1 overflow-auto px-4 pb-6 pt-4 lg:px-5">
          {errorBanner}
          <div className="grid grid-cols-1 items-start gap-3.5 min-[900px]:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)_300px]">
            <div className="flex min-w-0 flex-col gap-3">
              {clientCard}
              {termsCard}
              {notesCard}
            </div>

            {linesCard}

            <ComposerPreviewColumn
              className="min-[900px]:col-span-2 min-[900px]:grid min-[900px]:grid-cols-2 xl:col-span-1 xl:flex"
              draft={draft}
              onTemplateChange={setTemplateId}
              scope={scope}
              templateId={templateId}
              userEmail={user?.email}
            />
          </div>
        </div>
      )}
    </div>
  );
}
