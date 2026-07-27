export type QuoteStatus =
  | 'draft'
  | 'sent'
  | 'accepted'
  | 'rejected'
  | 'expired'
  | 'converted';

export const QUOTE_STATUSES: QuoteStatus[] = [
  'draft',
  'sent',
  'accepted',
  'rejected',
  'expired',
  'converted',
];

export const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  draft: 'Brouillon',
  sent: 'Envoyé',
  accepted: 'Accepté',
  rejected: 'Refusé',
  expired: 'Expiré',
  converted: 'Converti',
};

export type Quote = {
  id: string;
  clientId: string | null;
  clientName: string;
  clientEmail: string | null;
  convertedInvoiceId: string | null;
  number: string;
  status: QuoteStatus;
  subtotalHt: number;
  totalVat: number;
  totalTtc: number;
  issuedAt: string | null;
  validUntil: string | null;
  paymentTermsDays: number | null;
  notes: string | null;
  internalNotes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type QuoteInfoValues = {
  issuedAt: string;
  validUntil: string;
  paymentTermsDays: string;
  notes: string;
  internalNotes: string;
};

export function createEmptyQuoteInfoValues(
  defaults?: Partial<QuoteInfoValues>,
): QuoteInfoValues {
  return {
    issuedAt: defaults?.issuedAt ?? '',
    validUntil: defaults?.validUntil ?? '',
    paymentTermsDays: defaults?.paymentTermsDays ?? '30',
    notes: defaults?.notes ?? '',
    internalNotes: defaults?.internalNotes ?? '',
  };
}

export type QuoteLineValue = {
  id: string;
  productId: string | null;
  description: string;
  quantity: string;
  unit: string;
  unitPrice: string;
  vatRate: string;
  discountPercent: string;
};

export type QuoteDetail = Quote & {
  lines: QuoteLineValue[];
};

export type CreateQuoteInput = {
  clientId: string;
  lines: QuoteLineValue[];
  issuedAt?: string | null;
  validUntil?: string | null;
  paymentTermsDays?: number | null;
  notes?: string;
  internalNotes?: string;
};

export type UpdateQuoteInput = CreateQuoteInput;

export function createLocalLineId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function formatDecimalForInput(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

export function createEmptyQuoteLine(defaults?: {
  vatRate?: string | number;
  discountPercent?: string | number;
}): QuoteLineValue {
  return {
    id: createLocalLineId(),
    productId: null,
    description: '',
    quantity: '1',
    unit: 'unité',
    unitPrice: '0',
    vatRate:
      defaults?.vatRate !== undefined
        ? typeof defaults.vatRate === 'number'
          ? formatDecimalForInput(defaults.vatRate)
          : defaults.vatRate
        : '20',
    discountPercent:
      defaults?.discountPercent !== undefined
        ? typeof defaults.discountPercent === 'number'
          ? formatDecimalForInput(defaults.discountPercent)
          : defaults.discountPercent
        : '0',
  };
}

export function isQuoteStatus(value: string): value is QuoteStatus {
  return QUOTE_STATUSES.includes(value as QuoteStatus);
}

export function canEditQuote(status: QuoteStatus): boolean {
  return status === 'draft';
}

export function canDeleteQuote(status: QuoteStatus): boolean {
  return status !== 'converted';
}
