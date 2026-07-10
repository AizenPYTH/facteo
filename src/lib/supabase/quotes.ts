import { supabase } from '@/lib/supabase';
import { logSupabaseError } from '@/lib/supabase/errors';
import { mapCreateQuoteInputToInsert } from '@/lib/quotes/mappers';
import { mapQuoteRowToQuote } from '@/lib/supabase/mappers';
import type { CreateQuoteInput, Quote } from '@/types/quote';
import {
  QUOTES_PAGE_SIZE,
  type QuotesPage,
  type QuotesPageParams,
} from '@/types/quotes-list';
import type { QuoteLineInsert, QuoteWithClient } from '@/types/database';

export const QUOTE_COLUMNS =
  'id, user_id, client_id, number, status, subtotal_ht, total_vat, total_ttc, issued_at, valid_until, notes, created_at, updated_at' as const;

export const QUOTE_LIST_COLUMNS = `${QUOTE_COLUMNS}, clients(name, company)` as const;

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

async function generateQuoteNumber(userId: string): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `DEV-${year}-`;

  const { count, error } = await supabase
    .from('quotes')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .like('number', `${prefix}%`);

  if (error) {
    logSupabaseError('generateQuoteNumber', error);
    return `${prefix}${Date.now().toString().slice(-4)}`;
  }

  const next = (count ?? 0) + 1;
  return `${prefix}${String(next).padStart(4, '0')}`;
}

export async function fetchQuotesPage(
  userId: string,
  { search = '', page = 0, pageSize = QUOTES_PAGE_SIZE }: QuotesPageParams = {},
): Promise<QuotesPage> {
  const from = page * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('quotes')
    .select(QUOTE_LIST_COLUMNS, { count: 'exact' })
    .eq('user_id', userId)
    .order('issued_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .range(from, to);

  query = applySearchFilter(query, search);

  const { data, error, count } = await query;

  if (error) {
    logSupabaseError('fetchQuotesPage', error);
    return { quotes: [], nextPage: null, totalCount: null };
  }

  const quotes =
    (data as QuoteWithClient[] | null)?.map(mapQuoteRowToQuote) ?? [];
  const loadedCount = from + quotes.length;
  const hasMore = count !== null ? loadedCount < count : quotes.length === pageSize;

  return {
    quotes,
    nextPage: hasMore ? page + 1 : null,
    totalCount: count,
  };
}

export async function createQuote(userId: string, input: CreateQuoteInput): Promise<Quote> {
  if (!input.clientId) {
    throw new Error('Client is required.');
  }

  if (input.lines.length === 0) {
    throw new Error('Quote must have at least one line.');
  }

  const number = await generateQuoteNumber(userId);
  const { quote, lines } = mapCreateQuoteInputToInsert(userId, number, input);

  const { data: createdQuote, error: quoteError } = await supabase
    .from('quotes')
    .insert(quote)
    .select(QUOTE_COLUMNS)
    .single();

  if (quoteError || !createdQuote) {
    logSupabaseError('createQuote', quoteError);
    throw quoteError ?? new Error('Unable to create quote.');
  }

  const quoteRow = createdQuote as QuoteWithClient;

  const lineInserts: QuoteLineInsert[] = lines.map((line) => ({
    ...line,
    quote_id: quoteRow.id,
  }));

  const { error: linesError } = await supabase.from('quote_lines').insert(lineInserts);

  if (linesError) {
    logSupabaseError('createQuoteLines', linesError);
    await supabase.from('quotes').delete().eq('id', quoteRow.id).eq('user_id', userId);
    throw linesError;
  }

  const { data: fullQuote, error: fetchError } = await supabase
    .from('quotes')
    .select(QUOTE_LIST_COLUMNS)
    .eq('id', quoteRow.id)
    .eq('user_id', userId)
    .single();

  if (fetchError || !fullQuote) {
    logSupabaseError('fetchCreatedQuote', fetchError);
    return mapQuoteRowToQuote({
      ...quoteRow,
      clients: null,
    });
  }

  return mapQuoteRowToQuote(fullQuote as QuoteWithClient);
}
