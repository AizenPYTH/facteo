import { fetchClientsPage } from '@/lib/supabase/clients';
import { fetchInvoicesPage, INVOICE_LIST_COLUMNS } from '@/lib/supabase/invoices';
import { fetchQuotesPage, QUOTE_LIST_COLUMNS } from '@/lib/supabase/quotes';
import { supabase } from '@/lib/supabase';
import { logSupabaseError } from '@/lib/supabase/errors';
import { mapInvoiceRowToInvoice, mapQuoteRowToQuote } from '@/lib/supabase/mappers';
import type { Client } from '@/types/client';
import type { Invoice } from '@/types/invoice';
import type { Quote } from '@/types/quote';
import type { DataScope } from '@/types/tenant';
import type { InvoiceWithClient, QuoteWithClient } from '@/types/database';

const RESULT_LIMIT = 8;

export type UniversalSearchResults = {
  clients: Client[];
  quotes: Quote[];
  invoices: Invoice[];
};

function sanitizeSearchTerm(search: string): string {
  return search.trim().replace(/[%_,]/g, '');
}

function dedupeById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  const result: T[] = [];
  for (const item of items) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    result.push(item);
  }
  return result;
}

async function fetchQuotesForClientIds(
  scope: DataScope,
  clientIds: string[],
): Promise<Quote[]> {
  if (clientIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from('quotes')
    .select(QUOTE_LIST_COLUMNS)
    .eq('company_id', scope.companyId)
    .in('client_id', clientIds)
    .order('issued_at', { ascending: false, nullsFirst: false })
    .limit(RESULT_LIMIT);

  if (error) {
    logSupabaseError('fetchQuotesForClientIds', error);
    return [];
  }

  return (data as unknown as QuoteWithClient[] | null)?.map(mapQuoteRowToQuote) ?? [];
}

async function fetchInvoicesForClientIds(
  scope: DataScope,
  clientIds: string[],
): Promise<Invoice[]> {
  if (clientIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from('invoices')
    .select(INVOICE_LIST_COLUMNS)
    .eq('company_id', scope.companyId)
    .in('client_id', clientIds)
    .order('issued_at', { ascending: false, nullsFirst: false })
    .limit(RESULT_LIMIT);

  if (error) {
    logSupabaseError('fetchInvoicesForClientIds', error);
    return [];
  }

  return (data as unknown as InvoiceWithClient[] | null)?.map(mapInvoiceRowToInvoice) ?? [];
}

/**
 * Universal search across clients, quotes, and invoices.
 * Uses existing list search + documents linked to matching clients.
 * No schema / RPC changes.
 */
export async function searchUniversal(
  scope: DataScope,
  term: string,
): Promise<UniversalSearchResults> {
  const sanitized = sanitizeSearchTerm(term);

  if (!sanitized) {
    return { clients: [], quotes: [], invoices: [] };
  }

  const [clientsPage, quotesPage, invoicesPage] = await Promise.all([
    fetchClientsPage(scope, { search: sanitized, pageSize: RESULT_LIMIT }),
    fetchQuotesPage(scope, { search: sanitized, pageSize: RESULT_LIMIT }),
    fetchInvoicesPage(scope, { search: sanitized, pageSize: RESULT_LIMIT }),
  ]);

  const clientIds = clientsPage.clients.map((client) => client.id);
  const [quotesByClient, invoicesByClient] = await Promise.all([
    fetchQuotesForClientIds(scope, clientIds),
    fetchInvoicesForClientIds(scope, clientIds),
  ]);

  return {
    clients: clientsPage.clients,
    quotes: dedupeById([...quotesPage.quotes, ...quotesByClient]).slice(0, RESULT_LIMIT),
    invoices: dedupeById([...invoicesPage.invoices, ...invoicesByClient]).slice(
      0,
      RESULT_LIMIT,
    ),
  };
}
