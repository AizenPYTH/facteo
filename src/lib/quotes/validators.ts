import { parseDecimalInput } from '@/lib/products/mappers';
import type { QuoteLineValue } from '@/types/quote';

export function isQuoteLineValid(line: QuoteLineValue): boolean {
  if (!line.description.trim() || !line.unit.trim()) {
    return false;
  }

  const quantity = parseDecimalInput(line.quantity);
  const unitPrice = parseDecimalInput(line.unitPrice);
  const vatRate = parseDecimalInput(line.vatRate);

  return quantity > 0 && unitPrice >= 0 && vatRate >= 0 && vatRate <= 100;
}

export function areQuoteLinesValid(lines: QuoteLineValue[]): boolean {
  return lines.length > 0 && lines.every(isQuoteLineValid);
}
