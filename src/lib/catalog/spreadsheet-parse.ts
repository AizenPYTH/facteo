import * as XLSX from 'xlsx';

/**
 * Import d'un catalogue depuis un tableur (Excel, CSV) : même lecture que le
 * site (colonnes reconnues par leur nom, modèle INVEQ, séparateurs , ; tab).
 */

/** Ordre des colonnes du modèle INVEQ (site et application). */
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

export const SPREADSHEET_EXTENSIONS = ['xlsx', 'xls', 'xlsm', 'xlsb', 'csv', 'txt'] as const;

/** Types MIME proposés au sélecteur de fichiers. */
export const SPREADSHEET_MIME_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'application/vnd.ms-excel.sheet.macroEnabled.12',
  'application/vnd.ms-excel.sheet.binary.macroEnabled.12',
  'text/csv',
  'text/comma-separated-values',
  'text/plain',
  'text/tab-separated-values',
];

export type ImportedProduct = {
  name: string;
  description: string;
  reference: string;
  category: string;
  brand: string;
  unitPrice: number;
  priceTtc: number;
  vatRate: number;
  unit: string;
  stockQuantity: number;
  stockAlertThreshold: number;
  barcodeEan: string;
  sku: string;
  supplier: string;
  isActive: boolean;
  notes: string;
};

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

type ColumnKey = keyof typeof HEADER_ALIASES;

/** Position de chaque colonne dans le modèle INVEQ, quand l'en-tête n'est pas reconnu. */
const TEMPLATE_POSITION: Record<ColumnKey, number> = {
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
};

function normalizeHeader(value: string): string {
  return value
    .replace(/﻿/g, '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

export function parseFlexibleNumber(value: string, fallback = 0): number {
  const raw = value
    .trim()
    .replace(/ /g, ' ')
    .replace(/[€$£%]/g, '')
    .replace(/\s/g, '');

  if (!raw) return fallback;

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

/** « 20 », « 20 % », « 0,2 » : toujours un taux en pourcentage. */
export function parseVat(value: string, fallback = 20): number {
  const raw = value.trim();
  if (!raw) return fallback;
  const parsed = parseFlexibleNumber(raw, fallback);
  if (raw.includes('%')) return parsed;
  return parsed > 0 && parsed < 1 ? parsed * 100 : parsed;
}

function parseBooleanLike(value: string, fallback = true): boolean {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return fallback;
  if (['1', 'true', 'vrai', 'oui', 'yes', 'actif', 'x'].includes(normalized)) return true;
  if (['0', 'false', 'faux', 'non', 'no', 'inactif'].includes(normalized)) return false;
  return fallback;
}

const round2 = (value: number) => Math.round(value * 100) / 100;

function buildProduct(read: (key: ColumnKey) => string, fallbackName = ''): ImportedProduct | null {
  const name = read('name') || fallbackName;
  const description = read('description');
  const reference = read('reference');
  if (!name && !description && !reference) return null;

  const vatRate = Math.max(0, parseVat(read('vat'), 20));
  const priceHtRaw = read('priceHt');
  const priceTtcRaw = read('priceTtc');
  const priceHt = priceHtRaw
    ? parseFlexibleNumber(priceHtRaw, 0)
    : priceTtcRaw
      ? parseFlexibleNumber(priceTtcRaw, 0) / (1 + vatRate / 100)
      : 0;
  const priceTtc = priceTtcRaw ? parseFlexibleNumber(priceTtcRaw, 0) : priceHt * (1 + vatRate / 100);

  return {
    name: (name || description || reference || 'Produit importé').slice(0, 200),
    description,
    reference: reference.slice(0, 100),
    category: read('category'),
    brand: read('brand'),
    unitPrice: round2(Math.max(0, priceHt)),
    priceTtc: round2(Math.max(0, priceTtc)),
    vatRate: round2(vatRate),
    unit: read('unit') || 'unité',
    stockQuantity: parseFlexibleNumber(read('stockQty'), 0),
    stockAlertThreshold: parseFlexibleNumber(read('stockAlert'), 0),
    barcodeEan: read('barcode'),
    sku: read('sku'),
    supplier: read('supplier'),
    isActive: parseBooleanLike(read('active'), true),
    notes: read('notes'),
  };
}

/** Ligne d'en-têtes : la plus « parlante » parmi les 12 premières. */
function extractHeaderAndRows(rawRows: string[][]): { headers: string[]; rows: string[][] } {
  if (rawRows.length === 0) return { headers: [], rows: [] };
  const signals = ['nom', 'name', 'prixht', 'prixttc', 'tva', 'reference', 'unite', 'sku', 'stock', 'fournisseur'];
  const scoreRow = (row: string[]) =>
    row.map(normalizeHeader).filter((entry) => signals.some((signal) => entry.includes(signal))).length;

  let bestIndex = 0;
  let bestScore = -1;
  for (let index = 0; index < Math.min(rawRows.length, 12); index += 1) {
    const score = scoreRow(rawRows[index]);
    if (score > bestScore) {
      bestScore = score;
      bestIndex = index;
    }
  }
  return { headers: rawRows[bestIndex].map((cell) => cell.trim()), rows: rawRows.slice(bestIndex + 1) };
}

function productsFromTabularRows(headers: string[], rows: string[][]): ImportedProduct[] {
  const normalized = headers.map(normalizeHeader);
  const columns = Object.fromEntries(
    (Object.keys(HEADER_ALIASES) as ColumnKey[]).map((key) => [
      key,
      normalized.findIndex((entry) => (HEADER_ALIASES[key] as readonly string[]).includes(entry)),
    ]),
  ) as Record<ColumnKey, number>;

  const output: ImportedProduct[] = [];
  for (const row of rows) {
    // Colonne absente du fichier : vide (pas de lecture « à la position du modèle »,
    // qui prenait le prix pour la description).
    const read = (key: ColumnKey) => (columns[key] >= 0 ? (row[columns[key]] ?? '').trim() : '');
    const fallbackName = row.find((cell) => cell && /[a-zA-Z]/.test(cell))?.trim() ?? '';
    const product = buildProduct(read, fallbackName);
    if (product) output.push(product);
  }
  return output;
}

/** Lignes sans en-têtes reconnus (une seule cellule « a;b;c » comprise) : ordre du modèle INVEQ. */
function productsFromRawRows(rows: string[][]): ImportedProduct[] {
  const output: ImportedProduct[] = [];
  for (const rawRow of rows) {
    let cells = rawRow.map((cell) => cell.trim());
    if (cells.length === 1 && /[;,\t]/.test(cells[0] ?? '')) {
      const first = cells[0] ?? '';
      const splitter = first.includes('\t') ? '\t' : first.includes(';') ? ';' : ',';
      cells = first.split(splitter).map((cell) => cell.trim());
    }
    const read = (key: ColumnKey) => cells[TEMPLATE_POSITION[key]] ?? '';
    const product = buildProduct(read);
    if (product) output.push(product);
  }
  return output;
}

export function productsFromWorkbook(workbook: XLSX.WorkBook): ImportedProduct[] {
  const aggregated: ImportedProduct[] = [];
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;
    const rows = XLSX.utils
      .sheet_to_json<(string | number | null)[]>(sheet, { header: 1, blankrows: false, raw: false, defval: '' })
      .map((row) => row.map((cell) => String(cell ?? '').trim()))
      .filter((row) => row.some((cell) => cell));
    if (rows.length <= 1) continue;

    const { headers, rows: dataRows } = extractHeaderAndRows(rows);
    const recognized = headers.filter((header) =>
      Object.values(HEADER_ALIASES).some((aliases) => (aliases as readonly string[]).includes(normalizeHeader(header))),
    ).length;
    // Au moins deux en-têtes connus : lecture par nom de colonne. Sinon, ou si
    // rien n'en sort, ordre des colonnes du modèle INVEQ.
    const fromHeaders = recognized >= 2 ? productsFromTabularRows(headers, dataRows) : [];
    aggregated.push(...(fromHeaders.length > 0 ? fromHeaders : productsFromRawRows(rows.slice(1))));
  }
  return aggregated;
}
