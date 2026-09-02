'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Copy,
  Download,
  FileText,
  Package,
  Pencil,
  Plus,
  ReceiptText,
  Sparkles,
  Trash2,
  Upload,
  Wrench,
} from 'lucide-react';

import { ActionMenu } from '@/components/app/action-menu';
import { AppDialog } from '@/components/app/app-dialog';
import { AppSearchInput, AppTopBar } from '@/components/app/app-shell';
import { EmptyState, NoResultsState } from '@/components/app/empty-state';
import {
  DangerButton,
  FormActions,
  FormField,
  FormSection,
  GhostButton,
  PrimaryButton,
  SecondaryButton,
  TextArea,
  TextInput,
} from '@/components/app/form-fields';
import { MasterDetailLayout } from '@/components/app/master-detail';
import { DetailSkeleton, TableSkeleton } from '@/components/app/skeleton';
import { Badge, DataTable, LoadingState, type DataTableColumn } from '@/components/app/ui';
import { analyzeProductImage } from '@/lib/domain/ai/product-image-analysis';
import { formatCurrency } from '@/lib/domain/format/currency';
import { productsQueryKeys } from '@/lib/domain/supabase/query-keys';
import {
  createProduct,
  deleteProduct,
  fetchProducts,
  updateProduct,
} from '@/lib/domain/supabase/products';
import { requireScope } from '@/lib/domain/tenant/scope';
import { toUserFacingError } from '@/lib/errors/messages';
import { cn } from '@/lib/utils';
import { useAuth } from '@/providers/auth-provider';
import { useTenant } from '@/providers/company-provider';
import { useToast } from '@/providers/toast-provider';
import {
  createEmptyProductFormValues,
  mapProductToFormValues,
  type Product,
  type ProductFormValues,
  type ProductType,
} from '@/types/product';

function formatNumericInput(value: number): string {
  return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(2)));
}

const PRODUCT_IMPORT_TEMPLATE_HEADERS = [
  'Nom',
  'Description',
  'Référence',
  'Catégorie',
  'Marque',
  'Prix HT',
  'Prix TTC',
  'TVA',
  'Unité',
  'Quantité en stock',
  "Seuil d'alerte",
  'Code-barres (EAN)',
  'SKU',
  'Fournisseur',
  'Actif',
  'Notes',
] as const;

const IMPORT_DEBUG_PREFIX = '[ProductImport]';

const HEADER_ALIASES = {
  name: ['nom', 'name', 'titre', 'produit', 'designation', 'nomduproduit', 'productname'],
  description: ['description', 'details', 'detail', 'desc'],
  reference: ['reference', 'ref', 'referenceproduit'],
  category: ['categorie', 'category', 'famille'],
  brand: ['marque', 'brand', 'fabricant'],
  priceHt: ['prixht', 'prixunitaireht', 'priceht', 'unitprice', 'unitpriceht', 'puht'],
  priceTtc: ['prixttc', 'pricettc', 'puttc', 'prixunitairettc'],
  vat: ['tva', 'vat', 'vatrate', 'tauxtva', 'taxe'],
  unit: ['unite', 'unit'],
  stockQty: ['quantiteenstock', 'stock', 'stockquantity', 'qtestock', 'quantitestock'],
  stockAlert: ['seuildalerte', 'stockminimum', 'alertthreshold', 'stockmin'],
  barcode: ['codebarresean', 'codebarres', 'ean', 'barcode', 'gencode'],
  sku: ['sku', 'referenceinterne'],
  supplier: ['fournisseur', 'supplier', 'vendor'],
  active: ['actif', 'active', 'isactive', 'enabled'],
  notes: ['notes', 'note', 'commentaire', 'commentaires'],
} as const;

function computePriceHt(priceTtc: number, vatRate: number): number {
  const divider = 1 + Math.max(vatRate, 0) / 100;
  return divider > 0 ? priceTtc / divider : priceTtc;
}

function normalizeHeader(value: string): string {
  return value
    .replace(/\uFEFF/g, '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

function debugImport(message: string, payload?: unknown): void {
  void message;
  void payload;
}

function matchHeaderAlias(entry: string, aliases: readonly string[]): boolean {
  return aliases.some((alias) => entry === alias);
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

function parseVat(value: string, fallback = 20): number {
  const raw = value.trim();
  if (!raw) {
    return fallback;
  }
  const parsed = parseFlexibleNumber(raw, fallback);
  if (raw.includes('%')) {
    return parsed;
  }
  return parsed >= 0 && parsed <= 1 ? parsed * 100 : parsed;
}

function parseBooleanLike(value: string, fallback = true): boolean {
  const normalized = value.trim().toLowerCase();
  if (!normalized) {
    return fallback;
  }
  if (['1', 'true', 'vrai', 'oui', 'yes', 'actif'].includes(normalized)) {
    return true;
  }
  if (['0', 'false', 'faux', 'non', 'no', 'inactif'].includes(normalized)) {
    return false;
  }
  return fallback;
}

function isDuplicateReferenceError(error: unknown): boolean {
  const message =
    error && typeof error === 'object' && 'message' in error && typeof error.message === 'string'
      ? error.message
      : '';
  const code =
    error && typeof error === 'object' && 'code' in error && typeof error.code === 'string'
      ? error.code
      : '';
  return code === '23505' || message.includes('products_user_reference_unique_idx');
}

function mapAnalysisToFormValues(analysis: {
  title: string;
  description: string;
  reference: string;
  unit: string;
  price_ht: number | null;
  price_ttc: number | null;
  vat: number | null;
}): ProductFormValues {
  const vatRate = analysis.vat ?? 20;
  const unitPrice =
    analysis.price_ht ??
    (analysis.price_ttc !== null ? computePriceHt(analysis.price_ttc, vatRate) : null);

  return {
    name: analysis.title?.trim() || '',
    description: analysis.description?.trim() || '',
    unitPrice: unitPrice === null ? '0' : formatNumericInput(unitPrice),
    priceTtc:
      analysis.price_ttc === null || analysis.price_ttc === undefined
        ? ''
        : formatNumericInput(analysis.price_ttc),
    vatRate: formatNumericInput(vatRate),
    unit: analysis.unit?.trim() || 'unité',
    reference: analysis.reference?.trim() || '',
    sku: '',
    barcodeEan: '',
    category: '',
    brand: '',
    supplier: '',
    stockQuantity: '0',
    stockAlertThreshold: '0',
    notes: '',
    imageUrl: '',
    isActive: true,
  };
}

function buildProductsFromTabularRows(headers: string[], rows: string[][]): ProductFormValues[] {
  const normalized = headers.map(normalizeHeader);
  const indexOf = (aliases: readonly string[]) =>
    normalized.findIndex((entry) => matchHeaderAlias(entry, aliases));

  const map = {
    name: indexOf(HEADER_ALIASES.name),
    description: indexOf(HEADER_ALIASES.description),
    reference: indexOf(HEADER_ALIASES.reference),
    category: indexOf(HEADER_ALIASES.category),
    brand: indexOf(HEADER_ALIASES.brand),
    priceHt: indexOf(HEADER_ALIASES.priceHt),
    priceTtc: indexOf(HEADER_ALIASES.priceTtc),
    vat: indexOf(HEADER_ALIASES.vat),
    unit: indexOf(HEADER_ALIASES.unit),
    stockQty: indexOf(HEADER_ALIASES.stockQty),
    stockAlert: indexOf(HEADER_ALIASES.stockAlert),
    barcode: indexOf(HEADER_ALIASES.barcode),
    sku: indexOf(HEADER_ALIASES.sku),
    supplier: indexOf(HEADER_ALIASES.supplier),
    active: indexOf(HEADER_ALIASES.active),
    notes: indexOf(HEADER_ALIASES.notes),
  };
  const recognizedColumns = Object.entries(map)
    .filter(([, index]) => index >= 0)
    .map(([key, index]) => ({ key, header: headers[index], index }));
  const rejectedColumns = headers
    .map((header, index) => ({ header, index }))
    .filter(({ index }) => !Object.values(map).includes(index));
  debugImport('Headers lus', headers);
  debugImport('Headers normalisés', normalized);
  debugImport('Colonnes reconnues', recognizedColumns);
  debugImport('Colonnes rejetées', rejectedColumns);

  const fallbackByTemplatePosition = {
    name: 0,
    description: 1,
    reference: 2,
    category: 3,
    brand: 4,
    priceHt: 5,
    priceTtc: 6,
    vat: 7,
    unit: 8,
    stockQty: 9,
    stockAlert: 10,
    barcode: 11,
    sku: 12,
    supplier: 13,
    active: 14,
    notes: 15,
  } as const;

  const output: ProductFormValues[] = [];
  for (const [rowIndex, row] of rows.entries()) {
    const read = (index: number, fallbackIndex: number) =>
      index >= 0
        ? (row[index] ?? '').trim()
        : ((row[fallbackIndex] ?? '').trim());
    const fallbackFirstText = row.find((cell) => cell && /[a-zA-Z]/.test(cell))?.trim() ?? '';
    const name = read(map.name, fallbackByTemplatePosition.name) || fallbackFirstText;
    const description = read(map.description, fallbackByTemplatePosition.description);
    const reference = read(map.reference, fallbackByTemplatePosition.reference);
    if (!name && !description && !reference) {
      debugImport(`Ligne ${rowIndex + 2} ignorée`, {
        reason: 'name/description/reference vides',
        row,
      });
      continue;
    }

    const vatRate = parseVat(read(map.vat, fallbackByTemplatePosition.vat), 20);
    const priceHtRaw = read(map.priceHt, fallbackByTemplatePosition.priceHt);
    const priceTtcRaw = read(map.priceTtc, fallbackByTemplatePosition.priceTtc);
    const priceHt = priceHtRaw
      ? parseFlexibleNumber(priceHtRaw, 0)
      : priceTtcRaw
        ? computePriceHt(parseFlexibleNumber(priceTtcRaw, 0), vatRate)
        : 0;
    const priceTtc = priceTtcRaw
      ? parseFlexibleNumber(priceTtcRaw, 0)
      : priceHt * (1 + Math.max(vatRate, 0) / 100);

    output.push({
      name: name || description || reference || 'Produit importé',
      description,
      reference,
      category: read(map.category, fallbackByTemplatePosition.category),
      brand: read(map.brand, fallbackByTemplatePosition.brand),
      unitPrice: formatNumericInput(priceHt),
      priceTtc: formatNumericInput(priceTtc),
      vatRate: formatNumericInput(vatRate),
      unit: read(map.unit, fallbackByTemplatePosition.unit) || 'unité',
      stockQuantity: formatNumericInput(
        parseFlexibleNumber(read(map.stockQty, fallbackByTemplatePosition.stockQty), 0),
      ),
      stockAlertThreshold: formatNumericInput(
        parseFlexibleNumber(read(map.stockAlert, fallbackByTemplatePosition.stockAlert), 0),
      ),
      barcodeEan: read(map.barcode, fallbackByTemplatePosition.barcode),
      sku: read(map.sku, fallbackByTemplatePosition.sku),
      supplier: read(map.supplier, fallbackByTemplatePosition.supplier),
      isActive: parseBooleanLike(read(map.active, fallbackByTemplatePosition.active), true),
      notes: read(map.notes, fallbackByTemplatePosition.notes),
      imageUrl: '',
    });
    debugImport(`Ligne ${rowIndex + 2} convertie`, output[output.length - 1]);
  }

  return output;
}

function buildProductsFromObjectRows(records: Array<Record<string, unknown>>): ProductFormValues[] {
  const output: ProductFormValues[] = [];

  for (const [recordIndex, record] of records.entries()) {
    const entries = Object.entries(record).map(([key, value]) => [
      normalizeHeader(String(key)),
      String(value ?? '').trim(),
    ] as const);

    const read = (aliases: readonly string[], fallback = '') =>
      entries.find(([key]) => matchHeaderAlias(key, aliases))?.[1] ?? fallback;

    const name = read(HEADER_ALIASES.name);
    const description = read(HEADER_ALIASES.description);
    const reference = read(HEADER_ALIASES.reference);
    if (!name && !description && !reference) {
      debugImport(`Objet ligne ${recordIndex + 1} ignoré`, {
        reason: 'name/description/reference vides',
        record,
      });
      continue;
    }

    const vatRate = parseVat(read(HEADER_ALIASES.vat, '20'), 20);
    const priceHtRaw = read(HEADER_ALIASES.priceHt);
    const priceTtcRaw = read(HEADER_ALIASES.priceTtc);
    const priceHt = priceHtRaw
      ? parseFlexibleNumber(priceHtRaw, 0)
      : priceTtcRaw
        ? computePriceHt(parseFlexibleNumber(priceTtcRaw, 0), vatRate)
        : 0;
    const priceTtc = priceTtcRaw
      ? parseFlexibleNumber(priceTtcRaw, 0)
      : priceHt * (1 + Math.max(vatRate, 0) / 100);

    output.push({
      name: name || description || reference || 'Produit importé',
      description,
      reference,
      category: read(HEADER_ALIASES.category),
      brand: read(HEADER_ALIASES.brand),
      unitPrice: formatNumericInput(priceHt),
      priceTtc: formatNumericInput(priceTtc),
      vatRate: formatNumericInput(vatRate),
      unit: read(HEADER_ALIASES.unit, 'unité'),
      stockQuantity: formatNumericInput(
        parseFlexibleNumber(read(HEADER_ALIASES.stockQty, '0'), 0),
      ),
      stockAlertThreshold: formatNumericInput(
        parseFlexibleNumber(read(HEADER_ALIASES.stockAlert, '0'), 0),
      ),
      barcodeEan: read(HEADER_ALIASES.barcode),
      sku: read(HEADER_ALIASES.sku),
      supplier: read(HEADER_ALIASES.supplier),
      isActive: parseBooleanLike(read(HEADER_ALIASES.active, 'oui'), true),
      notes: read(HEADER_ALIASES.notes),
      imageUrl: '',
    });
    debugImport(`Objet ligne ${recordIndex + 1} converti`, output[output.length - 1]);
  }

  return output;
}

function parseWorkbookRows(XLSX: Awaited<typeof import('xlsx')>, workbook: import('xlsx').WorkBook): ProductFormValues[] {
  const aggregated: ProductFormValues[] = [];
  debugImport('Sheets détectées', workbook.SheetNames);
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) {
      continue;
    }
    const rows = XLSX.utils.sheet_to_json<(string | number | null)[]>(sheet, {
      header: 1,
      blankrows: false,
      raw: false,
      defval: '',
    });
    debugImport(`Sheet "${sheetName}" - lignes brutes`, rows.length);
    if (!Array.isArray(rows) || rows.length <= 1) {
      debugImport(`Sheet "${sheetName}" ignorée`, 'moins de 2 lignes');
      continue;
    }
    const normalizedRows = rows
      .map((row) => row.map((cell) => String(cell ?? '').trim()))
      .filter((row) => row.some((cell) => cell));
    if (normalizedRows.length <= 1) {
      debugImport(`Sheet "${sheetName}" ignorée`, 'lignes normalisées insuffisantes');
      continue;
    }
    const { headers, rows: dataRows } = extractHeaderAndRows(normalizedRows);
    const fromTabular = buildProductsFromTabularRows(headers, dataRows);
    if (fromTabular.length > 0) {
      debugImport(`Sheet "${sheetName}" - parsing tabulaire OK`, fromTabular.length);
      aggregated.push(...fromTabular);
      continue;
    }

    const objectRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      raw: false,
      defval: '',
      blankrows: false,
    });
    const fromObjects = buildProductsFromObjectRows(objectRows);
    if (fromObjects.length > 0) {
      debugImport(`Sheet "${sheetName}" - parsing objet OK`, fromObjects.length);
      aggregated.push(...fromObjects);
      continue;
    }

    const fromRaw = buildProductsFromRawRows(normalizedRows.slice(1));
    debugImport(`Sheet "${sheetName}" - fallback brut`, fromRaw.length);
    aggregated.push(...fromRaw);
  }
  debugImport('Total produits extraits workbook', aggregated.length);
  return aggregated;
}

function buildProductsFromRawRows(rows: string[][]): ProductFormValues[] {
  const output: ProductFormValues[] = [];
  for (const [rowIndex, rawRow] of rows.entries()) {
    let cells = rawRow.map((cell) => cell.trim());
    if (cells.length === 1 && /[;,\t]/.test(cells[0] ?? '')) {
      const splitter = (cells[0] ?? '').includes('\t')
        ? '\t'
        : (cells[0] ?? '').includes(';')
          ? ';'
          : ',';
      cells = (cells[0] ?? '').split(splitter).map((cell) => cell.trim());
    }
    cells = cells.filter(Boolean);
    if (cells.length < 1) {
      debugImport(`Ligne brute ${rowIndex + 2} ignorée`, {
        reason: 'aucune cellule exploitable',
        rawRow,
      });
      continue;
    }

    const name = cells[0] ?? '';
    const description = cells[1] ?? '';
    const reference = cells[2] ?? '';
    const priceHt = parseFlexibleNumber(cells[5] ?? '', 0);
    const priceTtcRaw = cells[6] ?? '';
    const vat = parseVat(cells[7] ?? '', 20);
    const priceTtc = priceTtcRaw
      ? parseFlexibleNumber(priceTtcRaw, 0)
      : priceHt * (1 + Math.max(vat, 0) / 100);

    if (!name && !description && !reference) {
      debugImport(`Ligne brute ${rowIndex + 2} ignorée`, {
        reason: 'name/description/reference vides',
        cells,
      });
      continue;
    }

    output.push({
      name: name || description || reference || 'Produit importé',
      description,
      reference,
      category: cells[3] ?? '',
      brand: cells[4] ?? '',
      unitPrice: formatNumericInput(priceHt),
      priceTtc: formatNumericInput(priceTtc),
      vatRate: formatNumericInput(vat),
      unit: cells[8] ?? 'unité',
      stockQuantity: formatNumericInput(parseFlexibleNumber(cells[9] ?? '', 0)),
      stockAlertThreshold: formatNumericInput(parseFlexibleNumber(cells[10] ?? '', 0)),
      barcodeEan: cells[11] ?? '',
      sku: cells[12] ?? '',
      supplier: cells[13] ?? '',
      isActive: parseBooleanLike(cells[14] ?? 'oui', true),
      notes: cells[15] ?? '',
      imageUrl: '',
    });
    debugImport(`Ligne brute ${rowIndex + 2} convertie`, output[output.length - 1]);
  }
  return output;
}

function extractHeaderAndRows(rawRows: string[][]): { headers: string[]; rows: string[][] } {
  if (rawRows.length === 0) {
    return { headers: [], rows: [] };
  }

  const scoreRow = (row: string[]): number => {
    const normalized = row.map(normalizeHeader);
    const signals = [
      'nom',
      'name',
      'prixht',
      'prixttc',
      'tva',
      'reference',
      'unite',
      'sku',
      'stock',
      'fournisseur',
    ];
    return normalized.filter((entry) => signals.some((signal) => entry.includes(signal))).length;
  };

  let bestIndex = 0;
  let bestScore = -1;
  for (let index = 0; index < Math.min(rawRows.length, 12); index += 1) {
    const score = scoreRow(rawRows[index]);
    if (score > bestScore) {
      bestScore = score;
      bestIndex = index;
    }
  }

  const headers = rawRows[bestIndex].map((cell) => cell.trim());
  const rows = rawRows.slice(bestIndex + 1);
  return { headers, rows };
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      const [, base64 = ''] = result.split(',');
      if (!base64) {
        reject(new Error('Fichier image invalide.'));
        return;
      }
      resolve(base64);
    };
    reader.onerror = () => reject(new Error("Impossible de lire l'image."));
    reader.readAsDataURL(file);
  });
}

type CatalogChip = 'active' | 'low' | 'archived';

function isLowStock(product: Product): boolean {
  return product.stockAlertThreshold > 0 && product.stockQuantity <= product.stockAlertThreshold;
}

function productInitials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('') || '·'
  );
}

function StockChip({ product, kind }: { product: Product; kind: ProductType }) {
  if (kind === 'service') {
    return <span className="text-[13px] text-app-muted">{product.unit || '—'}</span>;
  }

  const low = isLowStock(product);
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-app-chip px-2 py-0.5 text-[11.5px] font-semibold',
        low
          ? 'bg-app-warning-tint text-app-warning-text'
          : 'bg-app-success-tint text-app-success-text',
      )}>
      {low ? `${product.stockQuantity} · seuil ${product.stockAlertThreshold}` : `${product.stockQuantity} en stock`}
    </span>
  );
}

function ProductFormPanel({
  type,
  product,
  onClose,
  onSaved,
}: {
  type: ProductType;
  product: Product | null;
  onClose: () => void;
  onSaved: (savedProduct: Product) => void;
}) {
  const { scope } = useTenant();
  const queryClient = useQueryClient();
  const [values, setValues] = useState<ProductFormValues>(
    product ? mapProductToFormValues(product) : createEmptyProductFormValues(),
  );
  const [error, setError] = useState<string | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analysisSuccess, setAnalysisSuccess] = useState<string | null>(null);
  const [analysisFileName, setAnalysisFileName] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isImportingSpreadsheet, setIsImportingSpreadsheet] = useState(false);
  const [detectedProducts, setDetectedProducts] = useState<ProductFormValues[]>([]);
  const [overwriteExistingByReference, setOverwriteExistingByReference] = useState(true);
  const [duplicateReferences, setDuplicateReferences] = useState<string[]>([]);
  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const spreadsheetInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setValues(product ? mapProductToFormValues(product) : createEmptyProductFormValues());
    setAnalysisError(null);
    setAnalysisSuccess(null);
    setAnalysisFileName('');
    setDetectedProducts([]);
    setOverwriteExistingByReference(true);
    setDuplicateReferences([]);
  }, [product, type]);

  const mutation = useMutation({
    mutationFn: async () => {
      const activeScope = requireScope(scope);
      if (!values.name.trim()) throw new Error('Le nom est obligatoire.');
      if (product) {
        return updateProduct(activeScope, product.id, values);
      }
      return createProduct(activeScope, type, values);
    },
    onSuccess: (savedProduct) => {
      void queryClient.invalidateQueries({ queryKey: productsQueryKeys.all });
      onSaved(savedProduct);
    },
    onError: (err: Error) => {
      if (isDuplicateReferenceError(err)) {
        setError('Référence déjà existante. Modifiez la référence ou laissez-la vide.');
        return;
      }
      setError(err.message);
    },
  });

  const batchMutation = useMutation({
    mutationFn: async () => {
      const activeScope = requireScope(scope);
      if (detectedProducts.length === 0) {
        throw new Error('Aucun produit détecté à créer.');
      }

      const createdOrUpdated: Product[] = [];
      let createdCount = 0;
      let updatedCount = 0;
      const duplicates: string[] = [];
      for (const item of detectedProducts) {
        if (!item.name.trim()) {
          continue;
        }
        try {
          const productEntry = await createProduct(activeScope, 'product', item);
          createdOrUpdated.push(productEntry);
          createdCount += 1;
        } catch (error) {
          if (!isDuplicateReferenceError(error) || !item.reference.trim()) {
            throw error;
          }
          duplicates.push(`${item.name.trim() || 'Produit'} (réf. ${item.reference.trim()})`);

          if (overwriteExistingByReference) {
            const existingProducts = await fetchProducts(activeScope, 'product', item.reference.trim());
            const existing = existingProducts.find(
              (product) =>
                (product.reference ?? '').trim().toLowerCase() === item.reference.trim().toLowerCase(),
            );
            if (!existing) {
              throw error;
            }
            const updated = await updateProduct(activeScope, existing.id, item);
            createdOrUpdated.push(updated);
            updatedCount += 1;
          }
        }
      }
      return {
        products: createdOrUpdated,
        createdCount,
        updatedCount,
        duplicates,
      };
    },
    onSuccess: ({ products, createdCount, updatedCount, duplicates }) => {
      void queryClient.invalidateQueries({ queryKey: productsQueryKeys.all });
      setDetectedProducts([]);
      setAnalysisFileName('');
      setDuplicateReferences(duplicates);
      if (products.length > 0) {
        onSaved(products[0]);
      }
      const duplicatesMessage =
        duplicates.length > 0
          ? overwriteExistingByReference
            ? ` · ${duplicates.length} doublon(s) détecté(s)`
            : ` · ${duplicates.length} doublon(s) ignoré(s)`
          : '';
      setAnalysisSuccess(`${createdCount} créé(s), ${updatedCount} mis à jour${duplicatesMessage}.`);
    },
    onError: (err: Error) => {
      if (isDuplicateReferenceError(err)) {
        setError('Référence déjà existante. Vérifiez la colonne Référence ou laissez-la vide.');
        return;
      }
      setError(err.message);
    },
  });

  function setField<K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleAiImageSelection(files: FileList | null) {
    const selectedFiles = Array.from(files ?? []);
    if (selectedFiles.length === 0) {
      return;
    }

    setAnalysisError(null);
    setAnalysisSuccess(null);
    setError(null);
    setIsAnalyzing(true);
    setDetectedProducts([]);
    setDuplicateReferences([]);
    setAnalysisFileName(selectedFiles.map((entry) => entry.name).join(', '));
    try {
      const aggregated: ProductFormValues[] = [];

      for (const file of selectedFiles) {
        const base64 = await fileToBase64(file);
        const analysis = await analyzeProductImage({
          imageBase64: base64,
          mimeType: file.type || 'image/jpeg',
        });
        const candidates = Array.isArray(analysis.products) && analysis.products.length > 0
          ? analysis.products
          : [analysis];

        for (const candidate of candidates) {
          const mapped = mapAnalysisToFormValues(candidate);
          if (mapped.name || mapped.description || mapped.reference) {
            aggregated.push(mapped);
          }
        }
      }

      if (aggregated.length === 0) {
        throw new Error("Aucun produit exploitable détecté dans l'image.");
      }

      setValues((prev) => {
        const first = aggregated[0];
        return {
          ...prev,
          name: first.name || prev.name,
          description: first.description || prev.description,
          unitPrice: first.unitPrice || prev.unitPrice,
          vatRate: first.vatRate || prev.vatRate,
          unit: first.unit || prev.unit || 'unité',
          reference: first.reference || prev.reference,
        };
      });
      setDetectedProducts(aggregated);
      setAnalysisSuccess(`${aggregated.length} produit(s) détecté(s).`);
    } catch (err) {
      setAnalysisError(err instanceof Error ? err.message : 'Analyse IA indisponible.');
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function handleSpreadsheetImport(files: FileList | null) {
    const selectedFiles = Array.from(files ?? []);
    if (selectedFiles.length === 0) {
      return;
    }

    setAnalysisError(null);
    setAnalysisSuccess(null);
    setError(null);
    setIsImportingSpreadsheet(true);
    setDuplicateReferences([]);
    try {
      const imported: ProductFormValues[] = [];
      const XLSX = await import('xlsx');
      debugImport('Début import tableur', {
        files: selectedFiles.map((entry) => ({
          name: entry.name,
          type: entry.type,
          size: entry.size,
        })),
      });

      for (const file of selectedFiles) {
        const lowerName = file.name.toLowerCase();
        debugImport('Traitement fichier', file.name);
        if (lowerName.endsWith('.csv') || lowerName.endsWith('.txt')) {
          const text = await file.text();
          const parsed = XLSX.read(text, { type: 'string' });
          const fromWorkbook = parseWorkbookRows(XLSX, parsed);
          if (fromWorkbook.length > 0) {
            imported.push(...fromWorkbook);
            debugImport(`Fichier ${file.name} importé via workbook`, fromWorkbook.length);
          } else {
            const rawLines = text
              .split(/\r?\n/)
              .map((line) => {
                const delimiter = line.includes('\t') ? '\t' : line.includes(';') ? ';' : ',';
                return line.split(delimiter).map((entry) => entry.trim());
              })
              .filter((row) => row.some((cell) => cell));
            imported.push(...buildProductsFromRawRows(rawLines.slice(1)));
            debugImport(`Fichier ${file.name} importé via fallback texte`, imported.length);
          }
          continue;
        }

        try {
          const workbook = XLSX.read(await file.arrayBuffer(), {
            type: 'array',
            dense: true,
          });
          const fromWorkbook = parseWorkbookRows(XLSX, workbook);
          if (fromWorkbook.length > 0) {
            imported.push(...fromWorkbook);
            debugImport(`Fichier ${file.name} importé via workbook binaire`, fromWorkbook.length);
            continue;
          }

          const firstSheetName = workbook.SheetNames[0];
          const firstSheet = firstSheetName ? workbook.Sheets[firstSheetName] : null;
          if (firstSheet) {
            const rawRows = XLSX.utils.sheet_to_json<(string | number | null)[]>(firstSheet, {
              header: 1,
              blankrows: false,
              raw: false,
              defval: '',
            })
              .map((row) => row.map((cell) => String(cell ?? '').trim()))
              .filter((row) => row.some((cell) => cell));
            imported.push(...buildProductsFromRawRows(rawRows.slice(1)));
            debugImport(`Fichier ${file.name} importé via fallback sheet brut`, rawRows.length);
          }
        } catch (error) {
          debugImport(`Erreur parsing fichier ${file.name}`, error);
        }
      }

      if (imported.length === 0) {
        debugImport('Aucun produit extrait après traitement');
        throw new Error(
          "Aucune ligne exploitable trouvée. Vérifiez que la première ligne contient les en-têtes ou utilisez le modèle INVEQ.",
        );
      }

      setDetectedProducts(imported);
      const first = imported[0];
      setValues((prev) => ({ ...prev, ...first }));
      setAnalysisFileName(selectedFiles.map((entry) => entry.name).join(', '));
      setAnalysisSuccess(`${imported.length} ligne(s) importée(s) avec succès.`);
      debugImport('Import terminé', imported.length);
    } catch (err) {
      debugImport('Import tableur en échec', err);
      setAnalysisError(err instanceof Error ? err.message : 'Import tableur indisponible.');
    } finally {
      setIsImportingSpreadsheet(false);
    }
  }

  async function downloadExcelTemplate() {
    const XLSX = await import('xlsx');
    const workbook = XLSX.utils.book_new();
    const sheetData = [Array.from(PRODUCT_IMPORT_TEMPLATE_HEADERS)];
    const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Produits');

    const binary = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
    const blob = new Blob([binary], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'INVEQ-modele-import-produits.xlsx';
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="h-full overflow-y-auto p-5">
      <div className="space-y-4">
        <div>
          <h2 className="text-[16px] font-semibold tracking-[-0.01em] text-app-text">
            {product ? 'Modifier' : 'Nouveau'} {type === 'product' ? 'produit' : 'prestation'}
          </h2>
          <p className="mt-1 text-[13px] text-app-muted">
            Ces éléments peuvent être réutilisés dans vos devis et factures.
          </p>
        </div>

        {!product && type === 'product' ? (
          <FormSection
            description="Saisie manuelle, photo (IA) ou tableur. Le premier élément détecté pré-remplit le formulaire."
            title="Ajout simplifié">
            <div className="grid gap-2 sm:grid-cols-2">
              <SecondaryButton
                onClick={() => {
                  nameInputRef.current?.focus();
                }}
                type="button">
                Saisie manuelle
              </SecondaryButton>
              <SecondaryButton onClick={() => fileInputRef.current?.click()} type="button">
                <Sparkles size={15} />
                {isAnalyzing ? 'Analyse IA en cours…' : 'Scanner image (IA)'}
              </SecondaryButton>
            </div>

            <div className="space-y-2 rounded-[11px] border border-dashed border-app-accent-border bg-app-subtle p-3">
              <p className="text-[12px] text-app-muted">
                Importez une capture d&apos;écran ou une photo (Amazon, fournisseur, etc.).
              </p>
              <input
                accept="image/*"
                className="hidden"
                multiple
                onChange={(event) => {
                  void handleAiImageSelection(event.target.files);
                  event.target.value = '';
                }}
                ref={fileInputRef}
                type="file"
              />
              {analysisFileName ? (
                <p className="text-[12px] text-app-muted">Fichier : {analysisFileName}</p>
              ) : null}
              {detectedProducts.length > 0 ? (
                <div className="rounded-[9px] border border-app-success/20 bg-app-success-tint px-3 py-2 text-[12px] text-app-success-text">
                  {detectedProducts.length} produit(s) détecté(s). Le premier a été pré-rempli dans le
                  formulaire.
                </div>
              ) : null}
              {analysisError ? (
                <p className="text-[12px] font-medium text-app-danger">{analysisError}</p>
              ) : null}
              {analysisSuccess ? (
                <p className="text-[12px] font-medium text-app-success-text">{analysisSuccess}</p>
              ) : null}
            </div>

            <div className="space-y-2 rounded-[11px] border border-dashed border-app-border bg-app-surface p-3">
              <p className="text-[12px] text-app-muted">
                Import tableur (.xlsx, .xls, .csv) avec nettoyage automatique TVA/montants.
              </p>
              <input
                accept=".xlsx,.xls,.xlsm,.xlsb,.csv,.txt"
                className="hidden"
                multiple
                onChange={(event) => {
                  void handleSpreadsheetImport(event.target.files);
                  event.target.value = '';
                }}
                ref={spreadsheetInputRef}
                type="file"
              />
              <div className="grid gap-2 sm:grid-cols-2">
                <SecondaryButton onClick={() => void downloadExcelTemplate()} type="button">
                  <Download size={15} />
                  Télécharger un modèle Excel
                </SecondaryButton>
                <SecondaryButton onClick={() => spreadsheetInputRef.current?.click()} type="button">
                  <Upload size={15} />
                  {isImportingSpreadsheet ? 'Import en cours…' : 'Importer un fichier'}
                </SecondaryButton>
              </div>
              <label className="flex items-center gap-2 text-[12px] text-app-text-2">
                <input
                  checked={overwriteExistingByReference}
                  className="h-[15px] w-[15px] [accent-color:var(--app-accent)]"
                  onChange={(event) => setOverwriteExistingByReference(event.target.checked)}
                  type="checkbox"
                />
                Mettre à jour les produits existants (même référence)
              </label>
              {duplicateReferences.length > 0 ? (
                <div className="rounded-[9px] border border-app-warning/30 bg-app-warning-tint px-3 py-2 text-[12px] text-app-warning-text">
                  <p className="font-semibold">Produits en doublon détectés :</p>
                  <p className="mt-1">{duplicateReferences.join(' | ')}</p>
                </div>
              ) : null}
            </div>
          </FormSection>
        ) : null}

        {error ? (
          <div className="rounded-[11px] border border-app-danger-border bg-app-danger-tint px-4 py-3 text-[13px] text-app-danger-text">
            {error}
          </div>
        ) : null}

        <FormSection title="Identité">
          <FormField label="Nom *">
            <TextInput
              onChange={(e) => setField('name', e.target.value)}
              placeholder={type === 'product' ? 'Matériel, fourniture…' : 'Prestation, service…'}
              ref={nameInputRef}
              value={values.name}
            />
          </FormField>
          <FormField label="Description">
            <TextArea
              onChange={(e) => setField('description', e.target.value)}
              value={values.description}
            />
          </FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Référence">
              <TextInput onChange={(e) => setField('reference', e.target.value)} value={values.reference} />
            </FormField>
            <FormField label="SKU">
              <TextInput onChange={(e) => setField('sku', e.target.value)} value={values.sku} />
            </FormField>
            <FormField label="Code-barres (EAN)">
              <TextInput
                onChange={(e) => setField('barcodeEan', e.target.value)}
                value={values.barcodeEan}
              />
            </FormField>
            <FormField label="Catégorie">
              <TextInput onChange={(e) => setField('category', e.target.value)} value={values.category} />
            </FormField>
            <FormField label="Marque">
              <TextInput onChange={(e) => setField('brand', e.target.value)} value={values.brand} />
            </FormField>
            <FormField label="Fournisseur">
              <TextInput onChange={(e) => setField('supplier', e.target.value)} value={values.supplier} />
            </FormField>
            <FormField className="sm:col-span-2" label="Image (URL)">
              <TextInput onChange={(e) => setField('imageUrl', e.target.value)} value={values.imageUrl} />
            </FormField>
          </div>
          <label className="flex items-center gap-2 text-[13px] text-app-text-2">
            <input
              checked={values.isActive}
              className="h-[15px] w-[15px] [accent-color:var(--app-accent)]"
              onChange={(e) => setField('isActive', e.target.checked)}
              type="checkbox"
            />
            Actif
          </label>
        </FormSection>

        <FormSection title="Prix et TVA">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Prix unitaire HT">
              <TextInput
                onChange={(e) => setField('unitPrice', e.target.value)}
                value={values.unitPrice}
              />
            </FormField>
            <FormField label="Prix TTC">
              <TextInput
                onChange={(e) => setField('priceTtc', e.target.value)}
                value={values.priceTtc}
              />
            </FormField>
            <FormField label="TVA (%)">
              <TextInput onChange={(e) => setField('vatRate', e.target.value)} value={values.vatRate} />
            </FormField>
            <FormField label="Unité">
              <TextInput onChange={(e) => setField('unit', e.target.value)} value={values.unit} />
            </FormField>
          </div>
        </FormSection>

        {type === 'product' ? (
          <FormSection title="Stock">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Stock disponible">
                <TextInput
                  onChange={(e) => setField('stockQuantity', e.target.value)}
                  value={values.stockQuantity}
                />
              </FormField>
              <FormField label="Seuil d’alerte">
                <TextInput
                  onChange={(e) => setField('stockAlertThreshold', e.target.value)}
                  value={values.stockAlertThreshold}
                />
              </FormField>
            </div>
          </FormSection>
        ) : null}

        <FormSection title="Notes">
          <FormField label="Notes">
            <TextArea onChange={(e) => setField('notes', e.target.value)} value={values.notes} />
          </FormField>
        </FormSection>

        <FormActions>
          <SecondaryButton onClick={onClose}>Annuler</SecondaryButton>
          {detectedProducts.length > 1 && !product ? (
            <SecondaryButton onClick={() => batchMutation.mutate()} type="button">
              {batchMutation.isPending
                ? 'Création du lot…'
                : `Créer le lot (${detectedProducts.length} produits)`}
            </SecondaryButton>
          ) : null}
          <PrimaryButton loading={mutation.isPending} onClick={() => mutation.mutate()} type="button">
            Enregistrer
          </PrimaryButton>
        </FormActions>
      </div>
    </div>
  );
}

function CatalogDetailPanel({
  product,
  type,
  onEdit,
  onDelete,
  deleting,
}: {
  product: Product;
  type: ProductType;
  onEdit: () => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  const Icon = type === 'product' ? Package : Wrench;

  return (
    <div className="flex flex-col">
      <div className="border-b border-app-border-soft px-5 py-[18px]">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-app-accent-tint text-app-accent">
            <Icon size={20} strokeWidth={1.75} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h2 className="truncate text-[17px] font-semibold tracking-[-0.01em] text-app-text">
                {product.name}
              </h2>
              <Badge variant={product.isActive ? 'success' : 'default'}>
                {product.isActive ? 'Actif' : 'Archivé'}
              </Badge>
            </div>
            <p className="mt-0.5 truncate text-[12.5px] text-app-muted">
              {product.category || (type === 'product' ? 'Produit' : 'Prestation')}
              {product.reference ? ` · Réf. ${product.reference}` : ''}
            </p>
          </div>
        </div>
        <p className="app-num mt-4 text-[27px] font-semibold tracking-[-0.03em] text-app-text">
          {formatCurrency(product.unitPrice)}
          <span className="ml-1 text-[13px] font-medium text-app-muted">HT</span>
        </p>
        <div className="mt-3.5 flex items-center gap-2">
          <PrimaryButton className="flex-1 py-2.5 text-[12.5px]" onClick={onEdit}>
            <Pencil size={14} />
            Modifier
          </PrimaryButton>
          <DangerButton
            aria-label="Supprimer"
            className="w-[38px] shrink-0 px-0 py-2.5"
            disabled={deleting}
            onClick={onDelete}>
            <Trash2 size={15} />
          </DangerButton>
        </div>
      </div>

      <dl className="space-y-0 border-b border-app-border-soft px-5 py-4">
        <div className="flex items-center justify-between gap-3 py-[3px]">
          <dt className="text-[13px] text-app-muted">TVA</dt>
          <dd className="app-num text-[13px] font-medium text-app-text">{product.vatRate} %</dd>
        </div>
        <div className="flex items-center justify-between gap-3 py-[3px]">
          <dt className="text-[13px] text-app-muted">Unité</dt>
          <dd className="text-[13px] font-medium text-app-text">{product.unit || '—'}</dd>
        </div>
        {type === 'product' ? (
          <div className="flex items-center justify-between gap-3 py-[3px]">
            <dt className="text-[13px] text-app-muted">Stock</dt>
            <dd>
              <StockChip kind={type} product={product} />
            </dd>
          </div>
        ) : null}
      </dl>

      <div className="px-5 py-4">
        <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.1em] text-app-faint">
          Références
        </p>
        <p className="text-[13px] text-app-text-2">SKU {product.sku || '—'} · EAN {product.barcodeEan || '—'}</p>
        <p className="mt-1 text-[13px] text-app-text-2">
          {product.brand || '—'} · {product.supplier || '—'}
        </p>
        {product.description ? (
          <p className="mt-3 whitespace-pre-line text-[13px] leading-relaxed text-app-text-2">
            {product.description}
          </p>
        ) : null}
        {product.notes ? (
          <p className="mt-3 whitespace-pre-line text-[13px] leading-relaxed text-app-muted">
            {product.notes}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function CatalogWorkspaceInner({ type }: { type: ProductType }) {
  const [search, setSearch] = useState('');
  const [chip, setChip] = useState<CatalogChip>('active');
  const [mode, setMode] = useState<'list' | 'form'>('list');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [pendingDelete, setPendingDelete] = useState<'single' | 'bulk' | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const selectedId = searchParams.get('selected');
  const { user } = useAuth();
  const { scope } = useTenant();
  const { showSuccess, showError } = useToast();
  const queryClient = useQueryClient();

  const setSelectedId = useCallback(
    (id: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (id) params.set('selected', id);
      else params.delete('selected');
      const qs = params.toString();
      router.replace(qs ? `?${qs}` : '?', { scroll: false });
    },
    [router, searchParams],
  );

  const query = useQuery({
    queryKey: productsQueryKeys.list(user?.id ?? '', type, search),
    queryFn: () => fetchProducts(requireScope(scope), type, search),
    enabled: Boolean(scope?.companyId && user?.id),
  });

  const products = query.data ?? [];
  const selected = products.find((p) => p.id === selectedId) ?? null;

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteProduct(requireScope(scope), id),
    onSuccess: () => {
      setSelectedId(null);
      setPendingDelete(null);
      void queryClient.invalidateQueries({ queryKey: productsQueryKeys.all });
      showSuccess('Élément supprimé.');
    },
    onError: (error) => showError(toUserFacingError(error.message)),
  });
  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const activeScope = requireScope(scope);
      for (const id of ids) {
        await deleteProduct(activeScope, id);
      }
    },
    onSuccess: (_data, ids) => {
      setSelectedIds([]);
      setSelectedId(null);
      setPendingDelete(null);
      void queryClient.invalidateQueries({ queryKey: productsQueryKeys.all });
      showSuccess(`${ids.length} élément(s) supprimé(s).`);
    },
    onError: (error) => showError(toUserFacingError(error.message)),
  });
  const duplicateMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const activeScope = requireScope(scope);
      const created: Product[] = [];
      for (const id of ids) {
        const source = products.find((item) => item.id === id);
        if (!source) continue;
        const values = mapProductToFormValues(source);
        values.name = `${values.name} (copie)`;
        values.reference = '';
        created.push(await createProduct(activeScope, type, values));
      }
      return created;
    },
    onSuccess: (created) => {
      setSelectedIds([]);
      void queryClient.invalidateQueries({ queryKey: productsQueryKeys.all });
      showSuccess(`${created.length} élément(s) dupliqué(s).`);
    },
    onError: (error) => showError(toUserFacingError(error.message)),
  });

  useEffect(() => {
    setSelectedIds((prev) => prev.filter((id) => products.some((product) => product.id === id)));
  }, [products]);

  const counts = useMemo(
    () => ({
      active: products.filter((item) => item.isActive).length,
      low: products.filter(isLowStock).length,
      archived: products.filter((item) => !item.isActive).length,
    }),
    [products],
  );

  const visible = useMemo(() => {
    if (chip === 'active') return products.filter((item) => item.isActive);
    if (chip === 'archived') return products.filter((item) => !item.isActive);
    return products.filter(isLowStock);
  }, [chip, products]);

  const isFiltered = search.trim().length > 0 || chip !== 'active';
  const title = type === 'product' ? 'Produits' : 'Prestations';
  const lastColLabel = type === 'product' ? 'Stock' : 'Durée';
  const noun = type === 'product' ? 'produit' : 'prestation';

  const handleCreateDocumentFromSelection = useCallback(
    (target: 'invoice' | 'quote') => {
      if (selectedIds.length === 0) return;
      const base = target === 'invoice' ? '/app/invoices?create=1' : '/app/quotes?create=1';
      router.push(`${base}&fromProducts=${encodeURIComponent(selectedIds.join(','))}`);
    },
    [router, selectedIds],
  );

  const openCreate = useCallback(() => {
    setSelectedId(null);
    setMode('form');
  }, [setSelectedId]);

  const columns: DataTableColumn[] = [
    { key: 'name', label: 'Désignation' },
    { key: 'reference', label: 'Référence', className: 'max-lg:hidden' },
    { key: 'unit', label: 'Unité', className: 'max-[1023px]:hidden' },
    { key: 'price', label: 'Prix HT', align: 'right' },
    { key: 'vat', label: 'TVA', align: 'right', className: 'max-md:hidden' },
    { key: 'stock', label: lastColLabel },
    { key: 'actions', label: '', className: 'w-[56px]' },
  ];

  const rows = visible.map((product) => ({
    id: product.id,
    name: (
      <div className="flex items-center gap-2.5">
        <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-app-icon bg-app-border-soft text-[11px] font-bold text-app-muted-2">
          {productInitials(product.name)}
        </span>
        <div className="min-w-0">
          <p className="truncate font-semibold text-app-text">{product.name}</p>
          <p className="truncate text-[11.5px] text-app-muted-2">{product.category || '—'}</p>
        </div>
      </div>
    ),
    reference: (
      <span className="app-num text-app-muted">{product.reference || '—'}</span>
    ),
    unit: <span className="text-app-muted">{product.unit || '—'}</span>,
    price: formatCurrency(product.unitPrice),
    vat: <span className="app-num text-app-muted">{product.vatRate} %</span>,
    stock: <StockChip kind={type} product={product} />,
    actions: (
      <div className="flex items-center justify-end transition-opacity duration-150 max-lg:opacity-100 lg:opacity-0 lg:group-focus-within:opacity-100 lg:group-hover:opacity-100">
        <ActionMenu
          items={[
            {
              key: 'open',
              label: 'Ouvrir',
              icon: type === 'product' ? Package : Wrench,
              onSelect: () => {
                setMode('list');
                setSelectedId(product.id);
              },
            },
            {
              key: 'edit',
              label: 'Modifier',
              icon: Pencil,
              onSelect: () => {
                setSelectedId(product.id);
                setMode('form');
              },
            },
            {
              key: 'quote',
              label: 'Créer un devis',
              icon: FileText,
              onSelect: () =>
                router.push(`/app/quotes?create=1&fromProducts=${encodeURIComponent(product.id)}`),
            },
            {
              key: 'delete',
              label: 'Supprimer',
              icon: Trash2,
              tone: 'danger',
              onSelect: () => {
                setSelectedId(product.id);
                setPendingDelete('single');
              },
            },
          ]}
        />
      </div>
    ),
  }));

  const chips: { value: CatalogChip; label: string }[] = [
    { value: 'active', label: 'Actifs' },
    ...(type === 'product' ? [{ value: 'low' as const, label: 'Stock bas' }] : []),
    { value: 'archived', label: 'Archivés' },
  ];

  return (
    <>
      <AppTopBar
        count={products.length}
        title={title}
        toolbar={
          <>
            <div className="w-full min-w-[220px] flex-1 sm:max-w-[340px]">
              <AppSearchInput
                onChange={setSearch}
                placeholder="Nom, référence, SKU…"
                value={search}
              />
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {chips.map((item) => {
                const active = item.value === chip;
                return (
                  <button
                    aria-pressed={active}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-app-chip border px-[11px] py-[7px] text-[12.5px] font-semibold transition-colors duration-150',
                      active
                        ? 'border-app-accent-border bg-app-accent-tint text-app-accent-strong'
                        : 'border-app-border bg-app-surface text-app-text-3 hover:border-app-accent-border',
                    )}
                    key={item.value}
                    onClick={() => setChip(item.value)}
                    type="button">
                    {item.label}
                    <span
                      className={cn(
                        'app-num text-[11px] font-semibold',
                        active ? 'text-app-accent' : 'text-app-faint',
                      )}>
                      {counts[item.value]}
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        }>
        <SecondaryButton onClick={openCreate} type="button">
          <Upload size={15} />
          Importer CSV
        </SecondaryButton>
        <PrimaryButton onClick={openCreate} type="button">
          <Plus size={16} />
          {type === 'product' ? 'Nouveau produit' : 'Nouvelle prestation'}
        </PrimaryButton>
      </AppTopBar>

      <div className="min-h-0 flex-1">
        <MasterDetailLayout
          detail={
            mode === 'form' ? (
              <ProductFormPanel
                onClose={() => setMode('list')}
                onSaved={(savedProduct) => {
                  setMode('list');
                  setSelectedId(savedProduct.id);
                }}
                product={selectedId ? (selected ?? null) : null}
                type={type}
              />
            ) : query.isLoading ? (
              <DetailSkeleton />
            ) : !selected ? (
              <div className="p-5">
                <EmptyState
                  action={
                    <SecondaryButton onClick={() => setSelectedId(null)}>Fermer</SecondaryButton>
                  }
                  description="Sélectionnez un élément dans le tableau."
                  title="Aucune sélection"
                />
              </div>
            ) : (
              <CatalogDetailPanel
                deleting={deleteMutation.isPending}
                onDelete={() => setPendingDelete('single')}
                onEdit={() => setMode('form')}
                product={selected}
                type={type}
              />
            )
          }
          detailOpen={mode === 'form' || Boolean(selectedId)}
          detailTitle={type === 'product' ? 'Produit' : 'Prestation'}
          list={
            query.isLoading ? (
              <div className="p-6">
                <TableSkeleton rows={8} />
              </div>
            ) : visible.length === 0 ? (
              <div className="p-6">
                {isFiltered ? (
                  <NoResultsState
                    description={`Aucun ${noun} ne correspond à cette recherche ou à ce filtre.`}
                    onClear={() => {
                      setSearch('');
                      setChip('active');
                    }}
                    query={search}
                  />
                ) : (
                  <EmptyState
                    action={
                      <PrimaryButton onClick={openCreate} type="button">
                        <Plus size={15} />
                        Ajouter {type === 'product' ? 'un produit' : 'une prestation'}
                      </PrimaryButton>
                    }
                    description="Ajoutez vos articles pour les réutiliser dans vos devis et factures."
                    icon={type === 'product' ? Package : Wrench}
                    title={`Aucun ${noun} pour le moment`}
                  />
                )}
              </div>
            ) : (
              <div className="flex h-full min-h-0 flex-col">
                {selectedIds.length > 0 ? (
                  <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-app-accent-border bg-app-accent-tint px-6 py-2.5">
                    <p className="app-num text-[12.5px] font-semibold text-app-accent-strong">
                      {selectedIds.length} élément{selectedIds.length > 1 ? 's' : ''} sélectionné
                      {selectedIds.length > 1 ? 's' : ''}
                    </p>
                    <div className="ml-auto flex flex-wrap items-center gap-2">
                      <SecondaryButton
                        onClick={() => handleCreateDocumentFromSelection('quote')}
                        type="button">
                        <FileText className="text-app-muted-2" size={15} />
                        Créer un devis
                      </SecondaryButton>
                      {type === 'product' ? (
                        <SecondaryButton
                          onClick={() => handleCreateDocumentFromSelection('invoice')}
                          type="button">
                          <ReceiptText className="text-app-muted-2" size={15} />
                          Créer une facture
                        </SecondaryButton>
                      ) : null}
                      <SecondaryButton
                        disabled={duplicateMutation.isPending}
                        onClick={() => duplicateMutation.mutate(selectedIds)}
                        type="button">
                        <Copy className="text-app-muted-2" size={15} />
                        Dupliquer
                      </SecondaryButton>
                      <DangerButton
                        disabled={bulkDeleteMutation.isPending}
                        onClick={() => setPendingDelete('bulk')}
                        type="button">
                        <Trash2 size={15} />
                        Supprimer
                      </DangerButton>
                      <GhostButton onClick={() => setSelectedIds([])}>Tout désélectionner</GhostButton>
                    </div>
                  </div>
                ) : null}

                <DataTable
                  activeRowId={mode === 'form' ? null : selectedId}
                  className="min-h-0 flex-1 rounded-none border-0 max-[899px]:hidden"
                  columns={columns}
                  onRowClick={(row) => {
                    setMode('list');
                    setSelectedId(String(row.id));
                  }}
                  onSelectionChange={setSelectedIds}
                  rows={rows}
                  selectable
                  selectedIds={selectedIds}
                />

                <ul className="min-h-0 flex-1 divide-y divide-app-border-soft overflow-y-auto min-[900px]:hidden">
                  {visible.map((product) => (
                    <li key={product.id}>
                      <button
                        className={cn(
                          'flex min-h-11 w-full items-center gap-3 px-4 py-3 text-left transition-colors duration-150',
                          product.id === selectedId ? 'bg-app-accent-soft' : 'hover:bg-app-hover',
                        )}
                        onClick={() => {
                          setMode('list');
                          setSelectedId(product.id);
                        }}
                        type="button">
                        <input
                          aria-label={`Sélectionner ${product.name}`}
                          checked={selectedIds.includes(product.id)}
                          className="h-[15px] w-[15px] shrink-0 [accent-color:var(--app-accent)]"
                          onChange={() =>
                            setSelectedIds((prev) =>
                              prev.includes(product.id)
                                ? prev.filter((id) => id !== product.id)
                                : [...prev, product.id],
                            )
                          }
                          onClick={(event) => event.stopPropagation()}
                          type="checkbox"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13.5px] font-semibold text-app-text">
                            {product.name}
                          </span>
                          <span className="block truncate text-[12px] text-app-muted-2">
                            {product.reference || product.category || '—'}
                          </span>
                        </span>
                        <span className="app-num shrink-0 text-[13px] font-semibold text-app-text">
                          {formatCurrency(product.unitPrice)}
                        </span>
                        <StockChip kind={type} product={product} />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )
          }
          onCloseDetail={() => {
            setMode('list');
            setSelectedId(null);
          }}
        />
      </div>

      <AppDialog
        description={
          pendingDelete === 'bulk'
            ? `Les ${selectedIds.length} éléments seront retirés du catalogue. Les devis et factures déjà émis ne sont pas modifiés.`
            : 'L’élément sera retiré du catalogue. Les devis et factures déjà émis ne sont pas modifiés.'
        }
        footer={
          <>
            <SecondaryButton
              onClick={() => setPendingDelete(null)}
              type="button">
              Annuler
            </SecondaryButton>
            <DangerButton
              disabled={deleteMutation.isPending || bulkDeleteMutation.isPending}
              onClick={() => {
                if (pendingDelete === 'bulk') {
                  bulkDeleteMutation.mutate(selectedIds);
                  return;
                }
                if (selectedId) deleteMutation.mutate(selectedId);
              }}
              type="button"
              variant="solid">
              Supprimer
            </DangerButton>
          </>
        }
        icon={Trash2}
        onClose={() => setPendingDelete(null)}
        open={pendingDelete !== null}
        title={
          pendingDelete === 'bulk'
            ? `Supprimer ${selectedIds.length} ${noun}${selectedIds.length > 1 ? 's' : ''} ?`
            : `Supprimer ce ${noun} ?`
        }
        tone="danger"
      />
    </>
  );
}

export function CatalogWorkspace({ type }: { type: ProductType }) {
  return (
    <Suspense fallback={<LoadingState />}>
      <CatalogWorkspaceInner type={type} />
    </Suspense>
  );
}
