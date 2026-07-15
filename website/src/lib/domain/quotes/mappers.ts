import { calculateDocumentTotals, calculateLineTotals } from '@/lib/calculations/totals';
import { parseDecimalInput } from '@/lib/format/decimal';
import type { QuoteItemInsert, QuoteInsert } from '@/types/database';
import type { CreateQuoteInput, QuoteLineValue, UpdateQuoteInput } from '@/types/quote';
import type { DataScope } from '@/types/tenant';

export function mapLineValueToTotals(
  line: Pick<QuoteLineValue, 'quantity' | 'unitPrice' | 'vatRate' | 'discountPercent'>,
) {
  const quantity = parseDecimalInput(line.quantity);
  const unitPrice = parseDecimalInput(line.unitPrice);
  const vatRate = parseDecimalInput(line.vatRate);
  const discountPercent = parseDecimalInput(line.discountPercent || '0');

  return calculateLineTotals(quantity, unitPrice, vatRate, discountPercent);
}

/** @deprecated Use mapLineValueToTotals */
export const mapQuoteLineValueToTotals = mapLineValueToTotals;

export function mapLinesToDocumentTotals(lines: QuoteLineValue[]) {
  const lineTotals = lines.map((line) => mapLineValueToTotals(line));
  return calculateDocumentTotals(lineTotals);
}

/** @deprecated Use mapLinesToDocumentTotals */
export const mapQuoteLinesToDocumentTotals = mapLinesToDocumentTotals;

function mapLineToInsert(
  scope: DataScope,
  line: QuoteLineValue,
  index: number,
): Omit<QuoteItemInsert, 'quote_id'> {
  const lineTotals = mapLineValueToTotals(line);

  return {
    user_id: scope.userId,
    product_id: line.productId,
    position: index,
    description: line.description.trim(),
    quantity: parseDecimalInput(line.quantity),
    unit: line.unit.trim(),
    unit_price: parseDecimalInput(line.unitPrice),
    vat_rate: parseDecimalInput(line.vatRate),
    discount_percent: parseDecimalInput(line.discountPercent || '0'),
    line_total_ht: lineTotals.lineTotalHt,
  };
}

function mapQuoteMetadata(input: CreateQuoteInput | UpdateQuoteInput, now: string) {
  return {
    issued_at: input.issuedAt ?? now,
    valid_until: input.validUntil ?? null,
    payment_terms_days: input.paymentTermsDays ?? null,
    notes: input.notes?.trim() || null,
    internal_notes: input.internalNotes?.trim() || null,
  };
}

export function mapCreateQuoteInputToInsert(
  scope: DataScope,
  number: string,
  input: CreateQuoteInput,
): { quote: QuoteInsert; lines: Omit<QuoteItemInsert, 'quote_id'>[] } {
  const totals = mapLinesToDocumentTotals(input.lines);
  const now = new Date().toISOString();

  const quote: QuoteInsert = {
    user_id: scope.userId,
    company_id: scope.companyId,
    client_id: input.clientId,
    number,
    status: 'draft',
    subtotal_ht: totals.subtotalHt,
    total_vat: totals.totalVat,
    total_ttc: totals.totalTtc,
    ...mapQuoteMetadata(input, now),
    updated_at: now,
  };

  const lines = input.lines.map((line, index) => mapLineToInsert(scope, line, index));

  return { quote, lines };
}

export function mapUpdateQuoteInputToInsert(
  scope: DataScope,
  input: UpdateQuoteInput,
): { quote: Partial<QuoteInsert>; lines: Omit<QuoteItemInsert, 'quote_id'>[] } {
  const totals = mapLinesToDocumentTotals(input.lines);
  const now = new Date().toISOString();

  const quote: Partial<QuoteInsert> = {
    client_id: input.clientId,
    subtotal_ht: totals.subtotalHt,
    total_vat: totals.totalVat,
    total_ttc: totals.totalTtc,
    ...mapQuoteMetadata(input, input.issuedAt ?? now),
    updated_at: now,
  };

  const lines = input.lines.map((line, index) => mapLineToInsert(scope, line, index));

  return { quote, lines };
}
