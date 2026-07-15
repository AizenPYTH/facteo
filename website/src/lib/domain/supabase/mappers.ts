import { parseClientStoredName } from '@/lib/clients/name';
import { mapInvoiceItemRowToLineValue, mapQuoteItemRowToLineValue } from '@/lib/documents/line-mappers';
import type { Client } from '@/types/client';
import type { Invoice, InvoiceDetail, InvoicePayment } from '@/types/invoice';
import type { Quote, QuoteDetail, QuoteStatus } from '@/types/quote';
import type {
  ClientRow,
  InvoiceItemRow,
  InvoicePaymentRow,
  InvoiceWithClient,
  QuoteItemRow,
  QuoteWithClient,
} from '@/types/database';

const QUOTE_STATUSES: QuoteStatus[] = [
  'draft',
  'sent',
  'accepted',
  'rejected',
  'expired',
  'converted',
];

function isQuoteStatusValue(value: string): value is QuoteStatus {
  return QUOTE_STATUSES.includes(value as QuoteStatus);
}

function resolveQuoteClientName(
  clients: QuoteWithClient['clients'],
): string {
  if (!clients) {
    return 'Client inconnu';
  }

  const client = Array.isArray(clients) ? clients[0] : clients;

  if (!client) {
    return 'Client inconnu';
  }

  return client.company?.trim() || formatClientFullNameFromRow(client) || 'Client inconnu';
}

function formatClientFullNameFromRow(client: { name?: string | null; company?: string | null }): string {
  if (!client.name?.trim()) {
    return '';
  }

  const { lastName, firstName } = parseClientStoredName(client.name);
  return [firstName, lastName].filter(Boolean).join(' ');
}

const INVOICE_STATUSES = ['draft', 'sent', 'partially_paid', 'paid', 'overdue', 'canceled'] as const;

type DashboardInvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue';

function isDashboardInvoiceStatus(value: string): value is DashboardInvoiceStatus {
  return (['draft', 'sent', 'paid', 'overdue'] as const).includes(value as DashboardInvoiceStatus);
}

function isInvoiceStatusValue(value: string): value is (typeof INVOICE_STATUSES)[number] {
  return INVOICE_STATUSES.includes(value as (typeof INVOICE_STATUSES)[number]);
}

function resolveClientEmail(clients: InvoiceWithClient['clients']): string | null {
  if (!clients) {
    return null;
  }

  const client = Array.isArray(clients) ? clients[0] : clients;
  return client?.email?.trim() || null;
}

function resolveClientName(clients: InvoiceWithClient['clients']): string {
  if (!clients) {
    return '';
  }

  if (Array.isArray(clients)) {
    return clients[0]?.name ?? '';
  }

  return clients.name ?? '';
}

export function mapInvoiceRowToDashboardInvoice(row: InvoiceWithClient) {
  return {
    id: row.id,
    number: row.number,
    clientName: resolveClientName(row.clients),
    amount: row.total_ttc ?? row.total ?? 0,
    status: isDashboardInvoiceStatus(row.status) ? row.status : 'draft',
    issuedAt: row.issued_at ?? row.created_at,
  };
}

export function mapInvoiceRowToInvoice(row: InvoiceWithClient): Invoice {
  return {
    id: row.id,
    clientId: row.client_id,
    clientName: resolveClientName(row.clients),
    clientEmail: resolveClientEmail(row.clients),
    quoteId: row.quote_id,
    number: row.number,
    status: isInvoiceStatusValue(row.status) ? row.status : 'draft',
    subtotalHt: row.subtotal_ht,
    totalVat: row.total_vat,
    totalTtc: row.total_ttc,
    issuedAt: row.issued_at,
    dueAt: row.due_at,
    paidAt: row.paid_at,
    paymentMethod: row.payment_method,
    paymentReference: row.payment_reference,
    notes: row.notes,
    stripePaymentLink: row.stripe_payment_link ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapInvoicePaymentRow(row: InvoicePaymentRow): InvoicePayment {
  return {
    id: row.id,
    invoiceId: row.invoice_id,
    amount: row.amount,
    paidAt: row.paid_at,
    paymentMethod: row.payment_method,
    paymentReference: row.payment_reference,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

export function mapInvoiceDetail(
  row: InvoiceWithClient,
  items: InvoiceItemRow[],
  payments: InvoicePaymentRow[],
): InvoiceDetail {
  const invoice = mapInvoiceRowToInvoice(row);
  const amountPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);

  return {
    ...invoice,
    lines: items.map(mapInvoiceItemRowToLineValue),
    payments: payments.map(mapInvoicePaymentRow),
    amountPaid,
    amountDue: Math.max(0, invoice.totalTtc - amountPaid),
  };
}

export function mapClientRowToClient(row: ClientRow): Client {
  const { lastName, firstName } = parseClientStoredName(row.name);

  return {
    id: row.id,
    lastName,
    firstName,
    company: row.company,
    email: row.email,
    phone: row.phone,
    address: row.address,
    postalCode: row.postal_code,
    city: row.city,
    country: row.country,
    siren: row.siren,
    siret: row.siret,
    vatNumber: row.vat_number,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapQuoteRowToQuote(row: QuoteWithClient): Quote {
  return {
    id: row.id,
    clientId: row.client_id,
    clientName: resolveQuoteClientName(row.clients),
    clientEmail: resolveClientEmail(row.clients),
    convertedInvoiceId: row.converted_invoice_id,
    number: row.number,
    status: isQuoteStatusValue(row.status) ? row.status : 'draft',
    subtotalHt: row.subtotal_ht,
    totalVat: row.total_vat,
    totalTtc: row.total_ttc,
    issuedAt: row.issued_at,
    validUntil: row.valid_until,
    paymentTermsDays: row.payment_terms_days,
    notes: row.notes,
    internalNotes: row.internal_notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapQuoteDetail(row: QuoteWithClient, items: QuoteItemRow[]): QuoteDetail {
  return {
    ...mapQuoteRowToQuote(row),
    lines: items.map(mapQuoteItemRowToLineValue),
  };
}
