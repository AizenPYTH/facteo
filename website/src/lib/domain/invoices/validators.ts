import { z } from 'zod';

import { frenchDateInputToIso } from '@/lib/format/date-input';
import { parseDecimalInput } from '@/lib/format/decimal';
import type { InvoiceInfoValues, InvoiceLineValue } from '@/types/invoice';

export { areInvoiceLinesValid, isInvoiceLineValid } from '@/lib/documents/line-mappers';

export function parsePaymentAmount(value: string): number {
  return parseDecimalInput(value);
}

export function isPaymentAmountValid(amount: number, maxAmount: number): boolean {
  return amount > 0 && amount <= maxAmount;
}

export function createEmptyPaymentForm() {
  return {
    amount: '',
    paidAt: '',
    paymentMethod: '',
    paymentReference: '',
    notes: '',
  };
}

const optionalDate = z
  .string()
  .trim()
  .refine((value) => !value || frenchDateInputToIso(value) !== null, 'Date invalide.');

export const invoiceInfoSchema = z.object({
  issuedAt: z
    .string()
    .trim()
    .min(1, 'Champ obligatoire.')
    .refine((value) => frenchDateInputToIso(value) !== null, 'Date invalide.'),
  dueAt: optionalDate,
  paymentTermsDays: z
    .string()
    .trim()
    .refine((value) => !value || (/^\d+$/.test(value) && Number(value) > 0), {
      message: 'Délai de paiement invalide.',
    }),
  notes: z.string(),
});

export function parseInvoiceInfoValues(info: InvoiceInfoValues) {
  const parsed = invoiceInfoSchema.parse(info);

  return {
    issuedAt: frenchDateInputToIso(parsed.issuedAt),
    dueAt: parsed.dueAt ? frenchDateInputToIso(parsed.dueAt) : null,
    paymentTermsDays: parsed.paymentTermsDays
      ? Number(parsed.paymentTermsDays)
      : null,
    notes: parsed.notes.trim() || undefined,
  };
}

export function isInvoiceInfoValid(info: InvoiceInfoValues): boolean {
  return invoiceInfoSchema.safeParse(info).success;
}

export function mapInvoiceLineToQuoteLine(line: InvoiceLineValue) {
  return line;
}
