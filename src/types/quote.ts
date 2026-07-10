export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';

export const QUOTE_STATUSES: QuoteStatus[] = [
  'draft',
  'sent',
  'accepted',
  'rejected',
  'expired',
];

export const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  draft: 'Brouillon',
  sent: 'Envoyé',
  accepted: 'Accepté',
  rejected: 'Refusé',
  expired: 'Expiré',
};

export type Quote = {
  id: string;
  clientId: string | null;
  clientName: string;
  number: string;
  status: QuoteStatus;
  subtotalHt: number;
  totalVat: number;
  totalTtc: number;
  issuedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type QuoteLineValue = {
  id: string;
  productId: string | null;
  description: string;
  quantity: string;
  unit: string;
  unitPrice: string;
  vatRate: string;
};

export type CreateQuoteInput = {
  clientId: string;
  lines: QuoteLineValue[];
};

export function createLocalLineId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function formatDecimalForInput(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

export function createQuoteLineFromProduct(product: {
  id: string;
  name: string;
  description: string | null;
  unitPrice: number;
  vatRate: number;
  unit: string;
}): QuoteLineValue {
  return {
    id: createLocalLineId(),
    productId: product.id,
    description: product.description?.trim() || product.name,
    quantity: '1',
    unit: product.unit,
    unitPrice: formatDecimalForInput(product.unitPrice),
    vatRate: formatDecimalForInput(product.vatRate),
  };
}

export function isQuoteStatus(value: string): value is QuoteStatus {
  return QUOTE_STATUSES.includes(value as QuoteStatus);
}
