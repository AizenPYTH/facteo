import type { QuoteStatus } from '@/types/quote';

export type InvoiceStatus = 'draft' | 'sent' | 'partially_paid' | 'paid' | 'overdue' | 'canceled';

export const INVOICE_STATUSES: InvoiceStatus[] = [
  'draft',
  'sent',
  'partially_paid',
  'paid',
  'overdue',
  'canceled',
];

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  draft: 'Brouillon',
  sent: 'Envoyée',
  partially_paid: 'Partiellement payée',
  paid: 'Payée',
  overdue: 'En retard',
  canceled: 'Annulée',
};

export type InvoiceLineValue = {
  id: string;
  productId: string | null;
  description: string;
  quantity: string;
  unit: string;
  unitPrice: string;
  vatRate: string;
  discountPercent: string;
};

export function createLocalInvoiceLineId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function createEmptyInvoiceLine(): InvoiceLineValue {
  return {
    id: createLocalInvoiceLineId(),
    productId: null,
    description: '',
    quantity: '1',
    unit: 'unité',
    unitPrice: '0',
    vatRate: '20',
    discountPercent: '0',
  };
}

export type InvoiceInfoValues = {
  issuedAt: string;
  dueAt: string;
  paymentTermsDays: string;
  notes: string;
};

export function createEmptyInvoiceInfoValues(
  defaults?: Partial<InvoiceInfoValues>,
): InvoiceInfoValues {
  return {
    issuedAt: defaults?.issuedAt ?? '',
    dueAt: defaults?.dueAt ?? '',
    paymentTermsDays: defaults?.paymentTermsDays ?? '30',
    notes: defaults?.notes ?? '',
  };
}

export type Invoice = {
  id: string;
  clientId: string | null;
  clientName: string;
  clientEmail: string | null;
  quoteId: string | null;
  number: string;
  status: InvoiceStatus;
  subtotalHt: number;
  totalVat: number;
  totalTtc: number;
  issuedAt: string | null;
  dueAt: string | null;
  paidAt: string | null;
  paymentMethod: string | null;
  paymentReference: string | null;
  notes: string | null;
  stripePaymentLink: string | null;
  electronicInvoiceStatus: string | null;
  superpdpInvoiceId: number | null;
  electronicInvoiceLastError: string | null;
  createdAt: string;
  updatedAt: string;
};

export type InvoicePayment = {
  id: string;
  invoiceId: string;
  amount: number;
  paidAt: string;
  paymentMethod: string | null;
  paymentReference: string | null;
  notes: string | null;
  createdAt: string;
};

export type InvoiceDetail = Invoice & {
  lines: InvoiceLineValue[];
  payments: InvoicePayment[];
  amountPaid: number;
  amountDue: number;
};

export type CreateInvoiceInput = {
  clientId: string;
  quoteId?: string | null;
  lines: InvoiceLineValue[];
  issuedAt?: string | null;
  dueAt?: string | null;
  paymentTermsDays?: number | null;
  notes?: string;
};

export type UpdateInvoiceInput = CreateInvoiceInput;

export function isInvoiceStatus(value: string): value is InvoiceStatus {
  return INVOICE_STATUSES.includes(value as InvoiceStatus);
}

export function canConvertQuoteToInvoice(status: QuoteStatus): boolean {
  return status === 'accepted';
}

export function canEditInvoice(status: InvoiceStatus): boolean {
  return status === 'draft';
}

export function canCancelInvoice(status: InvoiceStatus): boolean {
  return status !== 'canceled' && status !== 'paid';
}

export function canMarkInvoiceAsPaid(status: InvoiceStatus): boolean {
  return status === 'sent' || status === 'overdue' || status === 'partially_paid';
}

export function canAddInvoicePayment(invoice: Pick<InvoiceDetail, 'status' | 'amountDue'>): boolean {
  return (
    invoice.amountDue > 0 &&
    invoice.status !== 'canceled' &&
    invoice.status !== 'draft' &&
    invoice.status !== 'paid'
  );
}
