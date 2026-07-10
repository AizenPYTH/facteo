import type { Client } from '@/types/client';
import type { InvoiceStatus } from '@/types/dashboard';
import type { Product } from '@/types/product';
import type { Quote, QuoteStatus } from '@/types/quote';
import type { ClientRow, InvoiceWithClient, ProductRow, QuoteWithClient } from '@/types/database';

const QUOTE_STATUSES: QuoteStatus[] = ['draft', 'sent', 'accepted', 'rejected', 'expired'];

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

  return client.company?.trim() || client.name?.trim() || 'Client inconnu';
}

const INVOICE_STATUSES: InvoiceStatus[] = ['draft', 'sent', 'paid', 'overdue'];

function isInvoiceStatus(value: string): value is InvoiceStatus {
  return INVOICE_STATUSES.includes(value as InvoiceStatus);
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

export function mapInvoiceRowToInvoice(row: InvoiceWithClient) {
  return {
    id: row.id,
    number: row.number,
    clientName: resolveClientName(row.clients),
    amount: row.total ?? 0,
    status: isInvoiceStatus(row.status) ? row.status : 'draft',
    issuedAt: row.issued_at ?? row.created_at,
  };
}

export function mapClientRowToClient(row: ClientRow): Client {
  return {
    id: row.id,
    company: row.company,
    name: row.name,
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

export function mapProductRowToProduct(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    unitPrice: row.unit_price,
    vatRate: row.vat_rate,
    unit: row.unit,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapQuoteRowToQuote(row: QuoteWithClient): Quote {
  return {
    id: row.id,
    clientId: row.client_id,
    clientName: resolveQuoteClientName(row.clients),
    number: row.number,
    status: isQuoteStatusValue(row.status) ? row.status : 'draft',
    subtotalHt: row.subtotal_ht,
    totalVat: row.total_vat,
    totalTtc: row.total_ttc,
    issuedAt: row.issued_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
