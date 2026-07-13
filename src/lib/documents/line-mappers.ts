import { parseDecimalInput } from '@/lib/format/decimal';
import { formatDecimalForInput } from '@/types/quote';
import type { QuoteItemRow } from '@/types/database';
import type { QuoteLineValue } from '@/types/quote';
import type { InvoiceLineValue } from '@/types/invoice';

export function mapQuoteItemRowToLineValue(row: QuoteItemRow): QuoteLineValue {
  return {
    id: row.id,
    productId: row.product_id,
    description: row.description,
    quantity: formatDecimalForInput(row.quantity),
    unit: row.unit,
    unitPrice: formatDecimalForInput(row.unit_price),
    vatRate: formatDecimalForInput(row.vat_rate),
    discountPercent: formatDecimalForInput(row.discount_percent ?? 0),
  };
}

export function mapInvoiceItemRowToLineValue(row: {
  id: string;
  product_id: string | null;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  vat_rate: number;
  discount_percent?: number;
}): InvoiceLineValue {
  return {
    id: row.id,
    productId: row.product_id,
    description: row.description,
    quantity: formatDecimalForInput(row.quantity),
    unit: row.unit,
    unitPrice: formatDecimalForInput(row.unit_price),
    vatRate: formatDecimalForInput(row.vat_rate),
    discountPercent: formatDecimalForInput(row.discount_percent ?? 0),
  };
}

export function mapQuoteLinesToInvoiceLines(lines: QuoteLineValue[]): InvoiceLineValue[] {
  return lines.map((line) => ({
    id: line.id,
    productId: line.productId,
    description: line.description,
    quantity: line.quantity,
    unit: line.unit,
    unitPrice: line.unitPrice,
    vatRate: line.vatRate,
    discountPercent: line.discountPercent,
  }));
}

export function isInvoiceLineValid(line: InvoiceLineValue): boolean {
  if (!line.description.trim() || !line.unit.trim()) {
    return false;
  }

  const quantity = parseDecimalInput(line.quantity);
  const unitPrice = parseDecimalInput(line.unitPrice);
  const vatRate = parseDecimalInput(line.vatRate);
  const discount = parseDecimalInput(line.discountPercent || '0');

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
