import { calculateDocumentTotals, calculateLineTotals } from '@/lib/calculations/totals';
import { parseAmountInput, parseVatRateForTotals } from '@/lib/format/decimal';
import type { CreateInvoiceInput, InvoiceLineValue, UpdateInvoiceInput } from '@/types/invoice';
import type { InvoiceInsert, InvoiceItemInsert } from '@/types/database';
import type { DataScope } from '@/types/tenant';

export function mapInvoiceLineValueToTotals(
  line: Pick<InvoiceLineValue, 'quantity' | 'unitPrice' | 'vatRate' | 'discountPercent'>,
) {
  const quantity = parseAmountInput(line.quantity);
  const unitPrice = parseAmountInput(line.unitPrice);
  const vatRate = parseVatRateForTotals(line.vatRate);
  const discountPercent = parseAmountInput(line.discountPercent);

  return calculateLineTotals(quantity, unitPrice, vatRate, discountPercent);
}

export function mapInvoiceLinesToDocumentTotals(lines: InvoiceLineValue[]) {
  const lineTotals = lines.map((line) => mapInvoiceLineValueToTotals(line));
  return calculateDocumentTotals(lineTotals);
}

function mapLineToInsert(
  scope: DataScope,
  line: InvoiceLineValue,
  index: number,
): Omit<InvoiceItemInsert, 'invoice_id'> {
  const lineTotals = mapInvoiceLineValueToTotals(line);

  return {
    user_id: scope.userId,
    product_id: line.productId,
    position: index,
    title: line.title?.trim() || null,
    description: line.description.trim(),
    quantity: parseAmountInput(line.quantity),
    unit: line.unit.trim(),
    unit_price: parseAmountInput(line.unitPrice),
    vat_rate: parseVatRateForTotals(line.vatRate),
    discount_percent: parseAmountInput(line.discountPercent),
    line_total_ht: lineTotals.lineTotalHt,
  };
}

function mapInvoiceMetadata(
  input: CreateInvoiceInput | UpdateInvoiceInput,
  fallbackIssuedAt: string,
  fallbackDueAt: string | null,
) {
  return {
    issued_at: input.issuedAt ?? fallbackIssuedAt,
    due_at: input.dueAt ?? fallbackDueAt,
    notes: input.notes?.trim() || null,
  };
}

export function mapCreateInvoiceInputToInsert(
  scope: DataScope,
  number: string,
  input: CreateInvoiceInput,
  defaultDueAt: string | null,
): { invoice: InvoiceInsert; lines: Omit<InvoiceItemInsert, 'invoice_id'>[] } {
  const totals = mapInvoiceLinesToDocumentTotals(input.lines);
  const now = new Date().toISOString();

  const invoice: InvoiceInsert = {
    user_id: scope.userId,
    company_id: scope.companyId,
    client_id: input.clientId,
    quote_id: input.quoteId ?? null,
    number,
    status: 'draft',
    subtotal_ht: totals.subtotalHt,
    total_vat: totals.totalVat,
    total_ttc: totals.totalTtc,
    ...mapInvoiceMetadata(input, now, defaultDueAt),
    updated_at: now,
  };

  const lines = input.lines.map((line, index) => mapLineToInsert(scope, line, index));

  return { invoice, lines };
}

export function mapUpdateInvoiceInputToInsert(
  scope: DataScope,
  input: UpdateInvoiceInput,
  existingIssuedAt: string | null,
  existingDueAt: string | null,
): { invoice: Partial<InvoiceInsert>; lines: Omit<InvoiceItemInsert, 'invoice_id'>[] } {
  const totals = mapInvoiceLinesToDocumentTotals(input.lines);
  const now = new Date().toISOString();

  const invoice: Partial<InvoiceInsert> = {
    client_id: input.clientId,
    subtotal_ht: totals.subtotalHt,
    total_vat: totals.totalVat,
    total_ttc: totals.totalTtc,
    ...mapInvoiceMetadata(input, existingIssuedAt ?? now, existingDueAt),
    updated_at: now,
  };

  const lines = input.lines.map((line, index) => mapLineToInsert(scope, line, index));

  return { invoice, lines };
}
