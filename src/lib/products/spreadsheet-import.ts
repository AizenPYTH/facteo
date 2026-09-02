/**
 * Client-side spreadsheet import for invoice/quote lines.
 * Mirrors website document-composer + catalog template semantics (no secrets).
 */
import * as XLSX from 'xlsx';

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
  'Seuil d\'alerte',
  'Code-barres (EAN)',
  'SKU',
  'Fournisseur',
  'Actif',
  'Notes',
] as const;

export type ImportedProductRow = {
  name: string;
  description: string;
  reference: string;
  brand: string;
  sku: string;
  ean: string;
  unit: string;
  quantity: number;
  unitPriceHt: number | null;
  unitPriceTtc: number | null;
  /** null = TVA non fournie — ne pas inventer */
  vatRate: number | null;
  confidence: number;
  source: 'excel';
};

function normalizeHeader(header: string): string {
  return header
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

function parseFlexibleNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value !== 'string') {
    return null;
  }
  const raw = value
    .trim()
    .replace(/\u00a0/g, ' ')
    .replace(/[€$£]/g, '')
    .replace(/\s/g, '');
  if (!raw) {
    return null;
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
  return Number.isFinite(parsed) ? parsed : null;
}

/** Returns null when empty — never invents a VAT rate. */
function parseVatRate(value: unknown): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  if (typeof value === 'string' && !value.trim()) {
    return null;
  }
  const raw = String(value).trim();
  const parsed = parseFlexibleNumber(raw);
  if (parsed === null) {
    return null;
  }
  if (raw.includes('%')) {
    return parsed;
  }
  return parsed >= 0 && parsed <= 1 ? parsed * 100 : parsed;
}

function cellString(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  return String(value).trim();
}

const HEADER_ALIASES: Record<string, keyof MappedColumns> = {
  nom: 'name',
  name: 'name',
  produit: 'name',
  title: 'name',
  designation: 'name',
  description: 'description',
  desc: 'description',
  reference: 'reference',
  ref: 'reference',
  modele: 'reference',
  model: 'reference',
  marque: 'brand',
  brand: 'brand',
  sku: 'sku',
  ean: 'ean',
  codebarres: 'ean',
  codebarre: 'ean',
  codebarresean: 'ean',
  barcode: 'ean',
  barcodeean: 'ean',
  gtin: 'ean',
  upc: 'ean',
  quantiteenstock: 'quantity',
  stockquantity: 'quantity',
  prixht: 'priceHt',
  prixunitaireht: 'priceHt',
  unitprice: 'priceHt',
  prixhtunite: 'priceHt',
  prixttc: 'priceTtc',
  prixunitairettc: 'priceTtc',
  tva: 'vat',
  tauxtva: 'vat',
  vat: 'vat',
  vatrate: 'vat',
  unite: 'unit',
  unit: 'unit',
  quantite: 'quantity',
  qty: 'quantity',
  quantity: 'quantity',
  qte: 'quantity',
};

type MappedColumns = {
  name?: number;
  description?: number;
  reference?: number;
  brand?: number;
  sku?: number;
  ean?: number;
  priceHt?: number;
  priceTtc?: number;
  vat?: number;
  unit?: number;
  quantity?: number;
};

function detectHeaderRow(rows: unknown[][]): { headerIndex: number; map: MappedColumns } | null {
  const limit = Math.min(12, rows.length);
  for (let i = 0; i < limit; i += 1) {
    const row = rows[i] ?? [];
    const map: MappedColumns = {};
    let hits = 0;
    row.forEach((cell, col) => {
      const key = HEADER_ALIASES[normalizeHeader(cellString(cell))];
      if (key && map[key] === undefined) {
        map[key] = col;
        hits += 1;
      }
    });
    if (hits >= 1 && map.name !== undefined) {
      return { headerIndex: i, map };
    }
  }
  return null;
}

function rowToProduct(row: unknown[], map: MappedColumns): ImportedProductRow | null {
  const name = cellString(map.name !== undefined ? row[map.name] : '');
  const description = cellString(map.description !== undefined ? row[map.description] : '');
  const reference = cellString(map.reference !== undefined ? row[map.reference] : '');
  if (!name && !description && !reference) {
    return null;
  }

  let unitPriceHt = map.priceHt !== undefined ? parseFlexibleNumber(row[map.priceHt]) : null;
  let unitPriceTtc = map.priceTtc !== undefined ? parseFlexibleNumber(row[map.priceTtc]) : null;
  const vatRate = map.vat !== undefined ? parseVatRate(row[map.vat]) : null;

  if (unitPriceHt === null && unitPriceTtc !== null && vatRate !== null) {
    unitPriceHt = unitPriceTtc / (1 + Math.max(0, vatRate) / 100);
  }
  if (unitPriceTtc === null && unitPriceHt !== null && vatRate !== null) {
    unitPriceTtc = unitPriceHt * (1 + Math.max(0, vatRate) / 100);
  }

  const quantityRaw =
    map.quantity !== undefined ? parseFlexibleNumber(row[map.quantity]) : null;

  return {
    name: name || description || 'Produit importé',
    description,
    reference,
    brand: cellString(map.brand !== undefined ? row[map.brand] : ''),
    sku: cellString(map.sku !== undefined ? row[map.sku] : ''),
    ean: cellString(map.ean !== undefined ? row[map.ean] : ''),
    unit: cellString(map.unit !== undefined ? row[map.unit] : '') || 'pièce',
    quantity: Math.max(1, quantityRaw ?? 1),
    unitPriceHt,
    unitPriceTtc,
    vatRate,
    confidence: 1,
    source: 'excel',
  };
}

function parseSheetRows(rows: unknown[][]): ImportedProductRow[] {
  if (rows.length === 0) {
    return [];
  }

  const detected = detectHeaderRow(rows);
  if (!detected) {
    // Fallback: positional template order (Nom, Description, Référence, …)
    const products: ImportedProductRow[] = [];
    for (let i = 1; i < rows.length; i += 1) {
      const row = rows[i] ?? [];
      const mapped = rowToProduct(row, {
        name: 0,
        description: 1,
        reference: 2,
        brand: 4,
        priceHt: 5,
        priceTtc: 6,
        vat: 7,
        unit: 8,
        ean: 11,
        sku: 12,
        quantity: 9,
      });
      if (mapped) {
        products.push(mapped);
      }
    }
    return products;
  }

  const products: ImportedProductRow[] = [];
  for (let i = detected.headerIndex + 1; i < rows.length; i += 1) {
    const mapped = rowToProduct(rows[i] ?? [], detected.map);
    if (mapped) {
      products.push(mapped);
    }
  }
  return products;
}

function writeXlsxBytes(workbook: XLSX.WorkBook): Uint8Array {
  const out = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' }) as
    | ArrayBuffer
    | Uint8Array
    | number[];

  if (out instanceof ArrayBuffer) {
    return new Uint8Array(out);
  }
  if (out instanceof Uint8Array) {
    return out;
  }
  return Uint8Array.from(out);
}

export function parseProductSpreadsheet(input: ArrayBuffer | Uint8Array): ImportedProductRow[] {
  const workbook = XLSX.read(input instanceof Uint8Array ? input : new Uint8Array(input), {
    type: 'array',
  });
  const products: ImportedProductRow[] = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) {
      continue;
    }
    const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
      header: 1,
      defval: '',
      raw: false,
    });
    products.push(...parseSheetRows(rows));
  }

  return products;
}

export function parseProductCsv(text: string): ImportedProductRow[] {
  const workbook = XLSX.read(text, { type: 'string' });
  const sheetName = workbook.SheetNames[0];
  const sheet = sheetName ? workbook.Sheets[sheetName] : undefined;
  if (!sheet) {
    return [];
  }
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: '',
    raw: false,
  });
  return parseSheetRows(rows);
}

export function buildProductImportTemplateBytes(): Uint8Array {
  const workbook = XLSX.utils.book_new();
  const sheet = XLSX.utils.aoa_to_sheet([Array.from(PRODUCT_IMPORT_TEMPLATE_HEADERS)]);
  XLSX.utils.book_append_sheet(workbook, sheet, 'Produits');
  return writeXlsxBytes(workbook);
}

/** @deprecated Prefer buildProductImportTemplateBytes */
export function buildProductImportTemplateArrayBuffer(): ArrayBuffer {
  const bytes = buildProductImportTemplateBytes();
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

export function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}
