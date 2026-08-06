import {
  mapCreateQuoteInputToInsert,
  mapUpdateQuoteInputToInsert,
} from '@/lib/quotes/mappers';
import {
  demoQuotes,
} from '@/lib/screenshot-demo';
import { isOfflineDemoData } from '@/lib/demo-data-mode';
import { supabase } from '@/lib/supabase';
import { logSupabaseError } from '@/lib/supabase/errors';
import { mapQuoteDetail, mapQuoteRowToQuote } from '@/lib/supabase/mappers';
import { reserveNextQuoteNumber } from '@/lib/supabase/settings';
import type {
  CreateQuoteInput,
  Quote,
  QuoteDetail,
  QuoteStatus,
  UpdateQuoteInput,
} from '@/types/quote';
import {
  QUOTES_PAGE_SIZE,
  type QuotesPage,
  type QuotesPageParams,
} from '@/types/quotes-list';
import type { DataScope } from '@/types/tenant';
import type { QuoteItemInsert, QuoteItemRow, QuoteWithClient } from '@/types/database';

export const QUOTE_COLUMNS =
  'id, user_id, client_id, converted_invoice_id, number, status, subtotal_ht, total_vat, total_ttc, issued_at, valid_until, payment_terms_days, notes, internal_notes, created_at, updated_at' as const;

export const QUOTE_LIST_COLUMNS = `${QUOTE_COLUMNS}, clients(name, company, email)` as const;

const QUOTE_ITEM_COLUMNS =
  'id, quote_id, user_id, product_id, position, description, quantity, unit, unit_price, vat_rate, discount_percent, line_total_ht, created_at, updated_at' as const;

function sanitizeSearchTerm(search: string): string {
  return search.trim().replace(/[%_,]/g, '');
}

function applySearchFilter<T extends { or: (filters: string) => T }>(
  query: T,
  search: string,
): T {
  const sanitizedSearch = sanitizeSearchTerm(search);

  if (!sanitizedSearch) {
    return query;
  }

  return query.or(`number.ilike.%${sanitizedSearch}%`);
}

async function insertQuoteItems(
  quoteId: string,
  lines: Omit<QuoteItemInsert, 'quote_id'>[],
): Promise<void> {
  if (lines.length === 0) {
    return;
  }

  const lineInserts: QuoteItemInsert[] = lines.map((line) => ({
    ...line,
    quote_id: quoteId,
  }));

  const { error } = await supabase.from('quote_items').insert(lineInserts);

  if (error) {
    logSupabaseError('insertQuoteItems', error);
    throw error;
  }
}

async function replaceQuoteItems(
  scope: DataScope,
  quoteId: string,
  lines: Omit<QuoteItemInsert, 'quote_id'>[],
): Promise<void> {
  const { error: deleteError } = await supabase
    .from('quote_items')
    .delete()
    .eq('quote_id', quoteId)
    .eq('user_id', scope.userId);

  if (deleteError) {
    logSupabaseError('replaceQuoteItems.delete', deleteError);
    throw deleteError;
  }

  await insertQuoteItems(quoteId, lines);
}

export async function fetchQuotesPage(
  scope: DataScope,
  { search = '', status = 'all', page = 0, pageSize = QUOTES_PAGE_SIZE }: QuotesPageParams = {},
): Promise<QuotesPage> {
  if (isOfflineDemoData()) {
    void scope;
    const needle = search.trim().toLowerCase();
    let filtered = status === 'all' ? demoQuotes : demoQuotes.filter((row) => row.status === status);
    if (needle) {
      filtered = filtered.filter((quote) =>
        [quote.number, quote.clientName, quote.clientEmail]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(needle)),
      );
    }
    const from = page * pageSize;
    const quotes = filtered.slice(from, from + pageSize);
    const loadedCount = from + quotes.length;
    return {
      quotes,
      nextPage: loadedCount < filtered.length ? page + 1 : null,
      totalCount: filtered.length,
    };
  }

  const from = page * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('quotes')
    .select(QUOTE_LIST_COLUMNS, { count: 'exact' })
    .eq('company_id', scope.companyId)
    .order('issued_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (status !== 'all') {
    query = query.eq('status', status);
  }

  query = applySearchFilter(query, search);

  const { data, error, count } = await query;

  if (error) {
    logSupabaseError('fetchQuotesPage', error);
    return { quotes: [], nextPage: null, totalCount: null };
  }

  const quotes =
    (data as unknown as QuoteWithClient[] | null)?.map(mapQuoteRowToQuote) ?? [];
  const loadedCount = from + quotes.length;
  const hasMore = count !== null ? loadedCount < count : quotes.length === pageSize;

  return {
    quotes,
    nextPage: hasMore ? page + 1 : null,
    totalCount: count,
  };
}

export async function fetchQuoteById(
  scope: DataScope,
  quoteId: string,
): Promise<QuoteDetail | null> {
  if (isOfflineDemoData()) {
    void scope;
    const quote = demoQuotes.find((row) => row.id === quoteId);
    if (!quote) {
      return null;
    }
    return {
      ...quote,
      lines: [
        {
          id: 'quote-line-1',
          productId: null,
          description: 'Conception logo & charte',
          quantity: '1',
          unit: 'forfait',
          unitPrice: '850',
          vatRate: '20',
          discountPercent: '0',
        },
        {
          id: 'quote-line-2',
          productId: null,
          description: 'Déclinaisons print',
          quantity: '3',
          unit: 'unité',
          unitPrice: '120',
          vatRate: '20',
          discountPercent: '0',
        },
      ],
    };
  }

  const { data: quoteRow, error: quoteError } = await supabase
    .from('quotes')
    .select(QUOTE_LIST_COLUMNS)
    .eq('id', quoteId)
    .eq('company_id', scope.companyId)
    .maybeSingle();

  if (quoteError) {
    logSupabaseError('fetchQuoteById', quoteError);
    return null;
  }

  if (!quoteRow) {
    return null;
  }

  const { data: items, error: itemsError } = await supabase
    .from('quote_items')
    .select(QUOTE_ITEM_COLUMNS)
    .eq('quote_id', quoteId)
    .eq('user_id', scope.userId)
    .order('position', { ascending: true });

  if (itemsError) {
    logSupabaseError('fetchQuoteItems', itemsError);
    return null;
  }

  return mapQuoteDetail(quoteRow as unknown as QuoteWithClient, (items ?? []) as QuoteItemRow[]);
}

export async function createQuote(scope: DataScope, input: CreateQuoteInput): Promise<Quote> {
  if (!input.clientId) {
    throw new Error('Client is required.');
  }

  if (input.lines.length === 0) {
    throw new Error('Quote must have at least one line.');
  }

  const number = await reserveNextQuoteNumber(scope.companyId);
  const { quote, lines } = mapCreateQuoteInputToInsert(scope, number, input);

  const { data: createdQuote, error: quoteError } = await supabase
    .from('quotes')
    .insert(quote)
    .select(QUOTE_COLUMNS)
    .single();

  if (quoteError || !createdQuote) {
    logSupabaseError('createQuote', quoteError);
    throw quoteError ?? new Error('Unable to create quote.');
  }

  const quoteRow = createdQuote as unknown as QuoteWithClient;

  try {
    await insertQuoteItems(quoteRow.id, lines);
  } catch (error) {
    await supabase
      .from('quotes')
      .delete()
      .eq('id', quoteRow.id)
      .eq('company_id', scope.companyId);
    throw error;
  }

  const { data: fullQuote, error: fetchError } = await supabase
    .from('quotes')
    .select(QUOTE_LIST_COLUMNS)
    .eq('id', quoteRow.id)
    .eq('company_id', scope.companyId)
    .single();

  if (fetchError || !fullQuote) {
    logSupabaseError('fetchCreatedQuote', fetchError);
    return mapQuoteRowToQuote({
      ...quoteRow,
      clients: null,
    });
  }

  return mapQuoteRowToQuote(fullQuote as unknown as QuoteWithClient);
}

export async function updateQuote(
  scope: DataScope,
  quoteId: string,
  input: UpdateQuoteInput,
): Promise<Quote> {
  if (!input.clientId || input.lines.length === 0) {
    throw new Error('Quote must have at least one line.');
  }

  const existing = await fetchQuoteById(scope, quoteId);

  if (!existing) {
    throw new Error('Quote not found.');
  }

  if (existing.status !== 'draft') {
    throw new Error('Quote is not editable.');
  }

  const { quote, lines } = mapUpdateQuoteInputToInsert(scope, input);

  const { data: updatedRow, error: quoteError } = await supabase
    .from('quotes')
    .update(quote)
    .eq('id', quoteId)
    .eq('company_id', scope.companyId)
    .eq('status', 'draft')
    .select('id')
    .maybeSingle();

  if (quoteError) {
    logSupabaseError('updateQuote', quoteError);
    throw quoteError;
  }

  if (!updatedRow) {
    throw new Error('Quote is not editable.');
  }

  await replaceQuoteItems(scope, quoteId, lines);

  const updated = await fetchQuoteById(scope, quoteId);

  if (!updated) {
    throw new Error('Unable to fetch updated quote.');
  }

  return updated;
}

export async function updateQuoteStatus(
  scope: DataScope,
  quoteId: string,
  status: QuoteStatus,
): Promise<Quote> {
  const { data, error } = await supabase
    .from('quotes')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', quoteId)
    .eq('company_id', scope.companyId)
    .select('id')
    .maybeSingle();

  if (error) {
    logSupabaseError('updateQuoteStatus', error);
    throw error;
  }

  if (!data) {
    throw new Error('Quote not found.');
  }

  const { data: fullQuote, error: fetchError } = await supabase
    .from('quotes')
    .select(QUOTE_LIST_COLUMNS)
    .eq('id', quoteId)
    .eq('company_id', scope.companyId)
    .single();

  if (fetchError || !fullQuote) {
    logSupabaseError('fetchQuoteAfterStatusUpdate', fetchError);
    throw fetchError ?? new Error('Unable to fetch quote.');
  }

  return mapQuoteRowToQuote(fullQuote as unknown as QuoteWithClient);
}

export async function deleteQuote(scope: DataScope, quoteId: string): Promise<void> {
  const { error: itemsError } = await supabase
    .from('quote_items')
    .delete()
    .eq('quote_id', quoteId)
    .eq('user_id', scope.userId);

  if (itemsError) {
    logSupabaseError('deleteQuoteItems', itemsError);
    throw itemsError;
  }

  const { error } = await supabase
    .from('quotes')
    .delete()
    .eq('id', quoteId)
    .eq('company_id', scope.companyId);

  if (error) {
    logSupabaseError('deleteQuote', error);
    throw error;
  }
}

export async function duplicateQuote(scope: DataScope, quoteId: string): Promise<Quote> {
  const source = await fetchQuoteById(scope, quoteId);

  if (!source || !source.clientId) {
    throw new Error('Quote not found.');
  }

  return createQuote(scope, {
    clientId: source.clientId,
    lines: source.lines.map((line) => ({
      ...line,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    })),
    issuedAt: source.issuedAt,
    validUntil: source.validUntil,
    paymentTermsDays: source.paymentTermsDays,
    notes: source.notes ?? undefined,
    internalNotes: source.internalNotes ?? undefined,
  });
}
