import { z } from 'zod';

import { frenchDateInputToIso } from '@/lib/format/date-input';
import { parseDecimalInput } from '@/lib/format/decimal';
import type { QuoteInfoValues, QuoteLineValue } from '@/types/quote';

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

const optionalDate = z
  .string()
  .trim()
  .refine((value) => !value || frenchDateInputToIso(value) !== null, 'Date invalide.');

export const quoteInfoSchema = z.object({
  issuedAt: z
    .string()
    .trim()
    .min(1, 'Champ obligatoire.')
    .refine((value) => frenchDateInputToIso(value) !== null, 'Date invalide.'),
  validUntil: optionalDate,
  paymentTermsDays: z
    .string()
    .trim()
    .refine((value) => !value || (/^\d+$/.test(value) && Number(value) > 0), {
      message: 'Délai de paiement invalide.',
    }),
  notes: z.string(),
  internalNotes: z.string(),
});

export function parseQuoteInfoValues(info: QuoteInfoValues) {
  const parsed = quoteInfoSchema.parse(info);

  return {
    issuedAt: frenchDateInputToIso(parsed.issuedAt),
    validUntil: parsed.validUntil ? frenchDateInputToIso(parsed.validUntil) : null,
    paymentTermsDays: parsed.paymentTermsDays
      ? Number(parsed.paymentTermsDays)
      : null,
    notes: parsed.notes.trim() || undefined,
    internalNotes: parsed.internalNotes.trim() || undefined,
  };
}

export function isQuoteInfoValid(info: QuoteInfoValues): boolean {
  return quoteInfoSchema.safeParse(info).success;
}
