import { calculateDocumentTotals, calculateLineTotals } from '@/lib/calculations/totals';
import { parseDecimalInput } from '@/lib/products/mappers';
import type { CreateQuoteInput, QuoteLineValue } from '@/types/quote';
import type { QuoteInsert, QuoteLineInsert } from '@/types/database';

export function mapQuoteLineValueToTotals(line: QuoteLineValue) {
  const quantity = parseDecimalInput(line.quantity);
  const unitPrice = parseDecimalInput(line.unitPrice);
  const vatRate = parseDecimalInput(line.vatRate);

  return calculateLineTotals(quantity, unitPrice, vatRate);
}

export function mapQuoteLinesToDocumentTotals(lines: QuoteLineValue[]) {
  const lineTotals = lines.map((line) => mapQuoteLineValueToTotals(line));
  return calculateDocumentTotals(lineTotals);
}

export function mapCreateQuoteInputToInsert(
  userId: string,
  number: string,
  input: CreateQuoteInput,
): { quote: QuoteInsert; lines: Omit<QuoteLineInsert, 'quote_id'>[] } {
  const totals = mapQuoteLinesToDocumentTotals(input.lines);
  const now = new Date().toISOString();

  const quote: QuoteInsert = {
    user_id: userId,
    client_id: input.clientId,
    number,
    status: 'draft',
    subtotal_ht: totals.subtotalHt,
    total_vat: totals.totalVat,
    total_ttc: totals.totalTtc,
    issued_at: now,
    updated_at: now,
  };

  const lines = input.lines.map((line, index) => {
    const lineTotals = mapQuoteLineValueToTotals(line);

    return {
      user_id: userId,
      product_id: line.productId,
      position: index,
      description: line.description.trim(),
      quantity: parseDecimalInput(line.quantity),
      unit: line.unit.trim(),
      unit_price: parseDecimalInput(line.unitPrice),
      vat_rate: parseDecimalInput(line.vatRate),
      line_total_ht: lineTotals.lineTotalHt,
    };
  });

  return { quote, lines };
}
