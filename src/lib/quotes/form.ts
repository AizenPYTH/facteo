import { isoToFrenchDateInput } from '@/lib/format/date-input';
import {
  createEmptyQuoteInfoValues,
  createLocalLineId,
  type QuoteDetail,
  type QuoteInfoValues,
  type QuoteLineValue,
} from '@/types/quote';

export type QuoteWizardState = {
  clientId: string | null;
  clientName: string;
  lines: QuoteLineValue[];
  info: QuoteInfoValues;
};

export function createEmptyQuoteWizardState(): QuoteWizardState {
  return {
    clientId: null,
    clientName: '',
    lines: [],
    info: createEmptyQuoteInfoValues(),
  };
}

export function mapQuoteDetailToWizardState(quote: QuoteDetail): QuoteWizardState {
  return {
    clientId: quote.clientId,
    clientName: quote.clientName,
    lines: quote.lines.map((line) => ({
      ...line,
      id: line.id || createLocalLineId(),
    })),
    info: createEmptyQuoteInfoValues({
      issuedAt: isoToFrenchDateInput(quote.issuedAt ?? quote.createdAt),
      validUntil: isoToFrenchDateInput(quote.validUntil),
      paymentTermsDays: String(quote.paymentTermsDays ?? 30),
      notes: quote.notes ?? '',
      internalNotes: quote.internalNotes ?? '',
    }),
  };
}
