import { parseDecimalInput, parseVatRateInput } from '@/lib/format/decimal';
import { formatDecimalForInput } from '@/types/quote';
import type { QuoteItemRow } from '@/types/database';
import type { QuoteLineValue } from '@/types/quote';
import type { InvoiceLineValue } from '@/types/invoice';

type StoredLineRow = {
  id: string;
  product_id: string | null;
  title?: string | null;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  vat_rate: number;
  discount_percent?: number;
};

function mapStoredLine(row: StoredLineRow) {
  return {
    id: row.id,
    productId: row.product_id,
    title: row.title ?? '',
    description: row.description ?? '',
    quantity: formatDecimalForInput(row.quantity),
    unit: row.unit,
    unitPrice: formatDecimalForInput(row.unit_price),
    vatRate: formatDecimalForInput(row.vat_rate),
    discountPercent: formatDecimalForInput(row.discount_percent ?? 0),
  };
}

export function mapQuoteItemRowToLineValue(row: QuoteItemRow): QuoteLineValue {
  return mapStoredLine(row);
}

export function mapInvoiceItemRowToLineValue(row: StoredLineRow): InvoiceLineValue {
  return mapStoredLine(row);
}

export function mapQuoteLinesToInvoiceLines(lines: QuoteLineValue[]): InvoiceLineValue[] {
  return lines.map((line) => ({
    id: line.id,
    productId: line.productId,
    title: line.title ?? '',
    description: line.description,
    quantity: line.quantity,
    unit: line.unit,
    unitPrice: line.unitPrice,
    vatRate: line.vatRate,
    discountPercent: line.discountPercent,
  }));
}

/**
 * Une prestation doit porter au moins une désignation : un titre **ou** une
 * description. On n'oblige jamais à renseigner les deux, et les lignes
 * historiques (description seule) restent valides.
 */
export function hasLineDesignation(line: { title?: string; description: string }): boolean {
  return Boolean(line.title?.trim() || line.description.trim());
}

export function isInvoiceLineValid(line: InvoiceLineValue): boolean {
  if (!hasLineDesignation(line) || !line.unit.trim()) {
    return false;
  }

  const quantity = parseDecimalInput(line.quantity);
  const unitPrice = parseDecimalInput(line.unitPrice);
  // Champ TVA vide = 0 % : `parseVatRateInput` le traduit, la ligne reste valide.
  const vatRate = parseVatRateInput(line.vatRate);
  const discount = line.discountPercent.trim() ? parseDecimalInput(line.discountPercent) : 0;

  return (
    quantity > 0 &&
    unitPrice >= 0 &&
    vatRate >= 0 &&
    vatRate <= 100 &&
    discount >= 0 &&
    discount <= 100
  );
}

export function areInvoiceLinesValid(lines: InvoiceLineValue[]): boolean {
  return lines.length > 0 && lines.every(isInvoiceLineValid);
}
