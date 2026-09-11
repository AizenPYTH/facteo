/**
 * Lecture des imports de catalogue : modèle de tableur INVEQ, analyse des
 * en-têtes et conversion des lignes en `ProductFormValues`.
 *
 * Extrait de `components/app/catalog-workspace.tsx` sans changement de
 * comportement : l'écran « Outils IA » (`app/app/ai`) et la modale du
 * catalogue partagent désormais le même lecteur.
 */
import type { ProductFormValues } from '@/types/product';

function formatNumericInput(value: number): string {
  return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(2)));
}


export const PRODUCT_IMPORT_TEMPLATE_HEADERS = [
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

/** Point d'accroche de débogage de l'import : volontairement muet en production. */
export function debugImport(message: string, payload?: unknown): void {
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

export function isDuplicateReferenceError(error: unknown): boolean {
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

export function mapAnalysisToFormValues(analysis: {
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

export function parseWorkbookRows(XLSX: Awaited<typeof import('xlsx')>, workbook: import('xlsx').WorkBook): ProductFormValues[] {
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

export function buildProductsFromRawRows(rows: string[][]): ProductFormValues[] {
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

export function extractHeaderAndRows(rawRows: string[][]): { headers: string[]; rows: string[][] } {
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

export async function fileToBase64(file: File): Promise<string> {
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

/**
 * Modèles de tableur proposés avant tout import (§6 du handoff v2 : le
 * téléchargement du modèle vient toujours avant le dépôt du fichier).
 */
export const SPREADSHEET_TEMPLATES = {
  products: {
    id: 'products',
    label: 'Produits',
    sheetName: 'Produits',
    fileName: 'INVEQ-modele-import-produits.xlsx',
    headers: PRODUCT_IMPORT_TEMPLATE_HEADERS as readonly string[],
  },
  prestations: {
    id: 'prestations',
    label: 'Prestations',
    sheetName: 'Prestations',
    fileName: 'INVEQ-modele-import-prestations.xlsx',
    headers: [
      'Nom',
      'Description',
      'Référence',
      'Catégorie',
      'Prix HT',
      'Prix TTC',
      'TVA',
      'Unité',
      'Actif',
      'Notes',
    ] as readonly string[],
  },
  clients: {
    id: 'clients',
    label: 'Clients',
    sheetName: 'Clients',
    fileName: 'INVEQ-modele-import-clients.xlsx',
    headers: [
      'Type (professionnel/particulier)',
      'Raison sociale',
      'Prénom',
      'Nom',
      'E-mail',
      'Téléphone',
      'Adresse',
      'Code postal',
      'Ville',
      'Pays',
      'SIRET',
      'N° TVA',
      'Notes',
    ] as readonly string[],
  },
} as const;

export type SpreadsheetTemplateId = keyof typeof SPREADSHEET_TEMPLATES;

/** Génère et télécharge le modèle vide demandé. Aucune dépendance nouvelle : `xlsx` est déjà utilisé par l'import. */
export async function downloadSpreadsheetTemplate(id: SpreadsheetTemplateId = 'products') {
  const template = SPREADSHEET_TEMPLATES[id];
  const XLSX = await import('xlsx');
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet([[...template.headers]]);
  XLSX.utils.book_append_sheet(workbook, worksheet, template.sheetName);

  const binary = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
  const blob = new Blob([binary], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = template.fileName;
  link.click();
  URL.revokeObjectURL(url);
}

/** Erreur levée lorsqu'aucune ligne n'est exploitable : le fichier n'est pas au modèle INVEQ. */
export class SpreadsheetTemplateMismatchError extends Error {
  constructor() {
    super(
      "Aucune ligne exploitable trouvée. Vérifiez que la première ligne contient les en-têtes ou utilisez le modèle INVEQ.",
    );
    this.name = 'SpreadsheetTemplateMismatchError';
  }
}

/**
 * Lit un ou plusieurs fichiers (.xlsx, .xls, .csv, .txt) et renvoie les lignes
 * converties. Lève `SpreadsheetTemplateMismatchError` si rien n'est exploitable.
 */
export async function readCatalogSpreadsheet(files: File[]): Promise<ProductFormValues[]> {
  const imported: ProductFormValues[] = [];
  const XLSX = await import('xlsx');

  debugImport('Début import tableur', {
    files: files.map((entry) => ({ name: entry.name, type: entry.type, size: entry.size })),
  });

  for (const file of files) {
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
      const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array', dense: true });
      const fromWorkbook = parseWorkbookRows(XLSX, workbook);
      if (fromWorkbook.length > 0) {
        imported.push(...fromWorkbook);
        debugImport(`Fichier ${file.name} importé via workbook binaire`, fromWorkbook.length);
        continue;
      }

      const firstSheetName = workbook.SheetNames[0];
      const firstSheet = firstSheetName ? workbook.Sheets[firstSheetName] : null;
      if (firstSheet) {
        const rawRows = XLSX.utils
          .sheet_to_json<(string | number | null)[]>(firstSheet, {
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
    throw new SpreadsheetTemplateMismatchError();
  }

  debugImport('Import terminé', imported.length);
  return imported;
}
