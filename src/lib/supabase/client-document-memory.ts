import { formatDecimalForInput, createLocalLineId, type QuoteLineValue } from '@/types/quote';
import type { DataScope } from '@/types/tenant';
import { supabase } from '@/lib/supabase';
import { logSupabaseError } from '@/lib/supabase/errors';

const DOC_LIMIT = 15;
const SUGGESTION_LIMIT = 8;

type NestedItem = {
  id: string;
  product_id: string | null;
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  vat_rate: number;
  discount_percent: number | null;
  created_at?: string;
};

type NestedDoc = {
  id: string;
  number: string;
  issued_at: string | null;
  created_at: string;
  payment_terms_days: number | null;
  notes: string | null;
  kind: 'invoice' | 'quote';
  items: NestedItem[];
};

export type ClientLineSuggestion = {
  key: string;
  description: string;
  quantity: string;
  unit: string;
  unitPrice: string;
  vatRate: string;
  discountPercent: string;
  productId: string | null;
  frequency: number;
  lastUsedAt: string;
  /** Higher = better for ranking. */
  score: number;
};

export type ClientDocumentMemory = {
  suggestions: ClientLineSuggestion[];
  /** Full line set from the most recent document (one-tap replay). */
  lastDocument: {
    label: string;
    lines: Omit<QuoteLineValue, 'id'>[];
  } | null;
  defaults: {
    paymentTermsDays: number | null;
    vatRate: number | null;
    notes: string | null;
    discountPercent: number | null;
  };
};

function normalizeDescription(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

function suggestionKey(item: NestedItem): string {
  if (item.product_id) {
    return `p:${item.product_id}:${item.unit_price}:${item.vat_rate}`;
  }

  return `d:${normalizeDescription(item.description)}:${item.unit_price}:${item.vat_rate}:${item.unit}`;
}

function toLineFields(item: NestedItem): Omit<QuoteLineValue, 'id'> {
  return {
    productId: item.product_id,
    description: item.description,
    quantity: formatDecimalForInput(item.quantity),
    unit: item.unit || 'unité',
    unitPrice: formatDecimalForInput(item.unit_price),
    vatRate: formatDecimalForInput(item.vat_rate),
    discountPercent: formatDecimalForInput(item.discount_percent ?? 0),
  };
}

function mostCommonNumber(values: number[]): number | null {
  if (values.length === 0) {
    return null;
  }

  const counts = new Map<number, number>();
  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  let best: number | null = null;
  let bestCount = 0;
  for (const [value, count] of counts) {
    if (count > bestCount) {
      best = value;
      bestCount = count;
    }
  }

  return best;
}

/**
 * Builds intelligent line suggestions + context defaults from a client's history.
 * No schema change — joins items via parent invoices/quotes.
 */
export async function fetchClientDocumentMemory(
  scope: DataScope,
  clientId: string,
): Promise<ClientDocumentMemory> {
  const empty: ClientDocumentMemory = {
    suggestions: [],
    lastDocument: null,
    defaults: {
      paymentTermsDays: null,
      vatRate: null,
      notes: null,
      discountPercent: null,
    },
  };

  if (!clientId) {
    return empty;
  }

  const [invoicesResult, quotesResult] = await Promise.all([
    supabase
      .from('invoices')
      .select(
        'id, number, issued_at, created_at, notes, invoice_items(id, product_id, description, quantity, unit, unit_price, vat_rate, discount_percent, created_at)',
      )
      .eq('company_id', scope.companyId)
      .eq('client_id', clientId)
      .neq('status', 'canceled')
      .order('issued_at', { ascending: false, nullsFirst: false })
      .limit(DOC_LIMIT),
    supabase
      .from('quotes')
      .select(
        'id, number, issued_at, created_at, payment_terms_days, notes, quote_items(id, product_id, description, quantity, unit, unit_price, vat_rate, discount_percent, created_at)',
      )
      .eq('company_id', scope.companyId)
      .eq('client_id', clientId)
      .neq('status', 'canceled')
      .order('issued_at', { ascending: false, nullsFirst: false })
      .limit(DOC_LIMIT),
  ]);

  if (invoicesResult.error) {
    logSupabaseError('fetchClientDocumentMemory.invoices', invoicesResult.error);
  }
  if (quotesResult.error) {
    logSupabaseError('fetchClientDocumentMemory.quotes', quotesResult.error);
  }

  const docs: NestedDoc[] = [];

  for (const row of (invoicesResult.data as Array<Record<string, unknown>> | null) ?? []) {
    const items = (row.invoice_items as NestedItem[] | null) ?? [];
    docs.push({
      id: String(row.id),
      number: String(row.number),
      issued_at: (row.issued_at as string | null) ?? null,
      created_at: String(row.created_at),
      payment_terms_days: null,
      notes: (row.notes as string | null) ?? null,
      kind: 'invoice',
      items,
    });
  }

  for (const row of (quotesResult.data as Array<Record<string, unknown>> | null) ?? []) {
    const items = (row.quote_items as NestedItem[] | null) ?? [];
    docs.push({
      id: String(row.id),
      number: String(row.number),
      issued_at: (row.issued_at as string | null) ?? null,
      created_at: String(row.created_at),
      payment_terms_days: (row.payment_terms_days as number | null) ?? null,
      notes: (row.notes as string | null) ?? null,
      kind: 'quote',
      items,
    });
  }

  docs.sort((a, b) => {
    const aTime = new Date(a.issued_at ?? a.created_at).getTime();
    const bTime = new Date(b.issued_at ?? b.created_at).getTime();
    return bTime - aTime;
  });

  if (docs.length === 0) {
    return empty;
  }

  const newest = docs[0];
  const lastDocument =
    newest.items.length > 0
      ? {
          label: `${newest.kind === 'invoice' ? 'Facture' : 'Devis'} ${newest.number}`,
          lines: newest.items.map(toLineFields),
        }
      : null;

  type Agg = {
    sample: NestedItem;
    frequency: number;
    lastUsedAt: string;
  };

  const aggregates = new Map<string, Agg>();
  const vatSamples: number[] = [];
  const discountSamples: number[] = [];
  const paymentSamples: number[] = [];
  const now = Date.now();

  for (const doc of docs) {
    const usedAt = doc.issued_at ?? doc.created_at;
    if (typeof doc.payment_terms_days === 'number') {
      paymentSamples.push(doc.payment_terms_days);
    }

    for (const item of doc.items) {
      if (!item.description?.trim() && !item.product_id) {
        continue;
      }

      vatSamples.push(item.vat_rate);
      discountSamples.push(item.discount_percent ?? 0);

      const key = suggestionKey(item);
      const existing = aggregates.get(key);
      if (!existing) {
        aggregates.set(key, { sample: item, frequency: 1, lastUsedAt: usedAt });
      } else {
        existing.frequency += 1;
        if (new Date(usedAt).getTime() > new Date(existing.lastUsedAt).getTime()) {
          existing.lastUsedAt = usedAt;
          existing.sample = item;
        }
      }
    }
  }

  const suggestions: ClientLineSuggestion[] = [...aggregates.entries()]
    .map(([key, agg]) => {
      const ageDays = Math.max(
        0,
        (now - new Date(agg.lastUsedAt).getTime()) / (1000 * 60 * 60 * 24),
      );
      const recencyBoost = Math.max(0, 30 - ageDays) / 30;
      const score = agg.frequency * 2 + recencyBoost * 3;
      const fields = toLineFields(agg.sample);

      return {
        key,
        description: fields.description,
        quantity: fields.quantity,
        unit: fields.unit,
        unitPrice: fields.unitPrice,
        vatRate: fields.vatRate,
        discountPercent: fields.discountPercent,
        productId: fields.productId,
        frequency: agg.frequency,
        lastUsedAt: agg.lastUsedAt,
        score,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, SUGGESTION_LIMIT);

  return {
    suggestions,
    lastDocument,
    defaults: {
      paymentTermsDays: newest.payment_terms_days ?? mostCommonNumber(paymentSamples),
      vatRate: mostCommonNumber(vatSamples),
      notes: newest.notes?.trim() || null,
      discountPercent: mostCommonNumber(discountSamples),
    },
  };
}

export function suggestionToQuoteLine(suggestion: ClientLineSuggestion): QuoteLineValue {
  return {
    id: createLocalLineId(),
    productId: suggestion.productId,
    description: suggestion.description,
    quantity: suggestion.quantity,
    unit: suggestion.unit,
    unitPrice: suggestion.unitPrice,
    vatRate: suggestion.vatRate,
    discountPercent: suggestion.discountPercent,
  };
}

export function memoryLinesToQuoteLines(
  lines: Omit<QuoteLineValue, 'id'>[],
): QuoteLineValue[] {
  return lines.map((line) => ({
    ...line,
    id: createLocalLineId(),
  }));
}
