import { supabase } from '@/lib/supabase';
import { logSupabaseError } from '@/lib/supabase/errors';
import type { DataScope } from '@/types/tenant';

const PRODUCT_LIST_COLUMNS =
  'id, name, description, unit_price, vat_rate, unit, reference, type, is_active, created_at, updated_at' as const;

export type CatalogProduct = {
  id: string;
  name: string;
  description: string;
  unitPrice: number;
  vatRate: number;
  unit: string;
  reference: string | null;
  type: 'product' | 'service';
  usageCount: number;
  lastUsedAt: string | null;
};

function sanitizeSearchTerm(search: string): string {
  return search.trim().replace(/[%_,]/g, '');
}

/**
 * Active catalog products, ranked by implicit favorites (usage frequency + recency).
 */
export async function fetchSmartCatalog(
  scope: DataScope,
  search = '',
  limit = 40,
): Promise<CatalogProduct[]> {
  let query = supabase
    .from('products')
    .select(PRODUCT_LIST_COLUMNS)
    .eq('user_id', scope.userId)
    .eq('is_active', true)
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })
    .limit(80);

  const sanitized = sanitizeSearchTerm(search);
  if (sanitized) {
    query = query.or(
      `name.ilike.%${sanitized}%,description.ilike.%${sanitized}%,reference.ilike.%${sanitized}%`,
    );
  }

  const { data, error } = await query;

  if (error) {
    logSupabaseError('fetchSmartCatalog', error);
    return [];
  }

  const products = (data as Array<Record<string, unknown>> | null) ?? [];
  if (products.length === 0) {
    return [];
  }

  const productIds = products.map((row) => String(row.id));

  const [invoiceUsage, quoteUsage] = await Promise.all([
    supabase
      .from('invoice_items')
      .select('product_id, created_at')
      .eq('user_id', scope.userId)
      .in('product_id', productIds)
      .not('product_id', 'is', null)
      .limit(500),
    supabase
      .from('quote_items')
      .select('product_id, created_at')
      .eq('user_id', scope.userId)
      .in('product_id', productIds)
      .not('product_id', 'is', null)
      .limit(500),
  ]);

  const usage = new Map<string, { count: number; lastUsedAt: string | null }>();

  for (const row of [
    ...((invoiceUsage.data as Array<{ product_id: string | null; created_at: string }> | null) ??
      []),
    ...((quoteUsage.data as Array<{ product_id: string | null; created_at: string }> | null) ?? []),
  ]) {
    if (!row.product_id) continue;
    const current = usage.get(row.product_id) ?? { count: 0, lastUsedAt: null };
    current.count += 1;
    if (
      !current.lastUsedAt ||
      new Date(row.created_at).getTime() > new Date(current.lastUsedAt).getTime()
    ) {
      current.lastUsedAt = row.created_at;
    }
    usage.set(row.product_id, current);
  }

  const now = Date.now();

  return products
    .map((row) => {
      const id = String(row.id);
      const stats = usage.get(id) ?? { count: 0, lastUsedAt: null };
      const ageDays = stats.lastUsedAt
        ? Math.max(0, (now - new Date(stats.lastUsedAt).getTime()) / (1000 * 60 * 60 * 24))
        : 999;
      const recencyBoost = Math.max(0, 60 - ageDays) / 60;
      const score = stats.count * 3 + recencyBoost * 2;

      return {
        product: {
          id,
          name: String(row.name ?? ''),
          description: String(row.description ?? ''),
          unitPrice: Number(row.unit_price ?? 0),
          vatRate: Number(row.vat_rate ?? 20),
          unit: String(row.unit ?? 'unité'),
          reference: (row.reference as string | null) ?? null,
          type: (row.type as 'product' | 'service') ?? 'service',
          usageCount: stats.count,
          lastUsedAt: stats.lastUsedAt,
        } satisfies CatalogProduct,
        score,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.product);
}
