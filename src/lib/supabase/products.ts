import { supabase } from '@/lib/supabase';
import { logSupabaseError } from '@/lib/supabase/errors';
import { mapFormValuesToProductInsert } from '@/lib/products/mappers';
import { mapProductRowToProduct } from '@/lib/supabase/mappers';
import type { Product, ProductFormValues } from '@/types/product';
import {
  PRODUCTS_PAGE_SIZE,
  type ProductsPage,
  type ProductsPageParams,
} from '@/types/products-list';
import type { ProductRow } from '@/types/database';

export const PRODUCT_COLUMNS =
  'id, user_id, name, description, unit_price, vat_rate, unit, created_at, updated_at' as const;

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

  return query.or(
    `name.ilike.%${sanitizedSearch}%,description.ilike.%${sanitizedSearch}%,unit.ilike.%${sanitizedSearch}%`,
  );
}

export async function fetchProductsPage(
  userId: string,
  { search = '', page = 0, pageSize = PRODUCTS_PAGE_SIZE }: ProductsPageParams = {},
): Promise<ProductsPage> {
  const from = page * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('products')
    .select(PRODUCT_COLUMNS, { count: 'exact' })
    .eq('user_id', userId)
    .order('name', { ascending: true })
    .range(from, to);

  query = applySearchFilter(query, search);

  const { data, error, count } = await query;

  if (error) {
    logSupabaseError('fetchProductsPage', error);
    return { products: [], nextPage: null, totalCount: null };
  }

  const products = (data as ProductRow[] | null)?.map(mapProductRowToProduct) ?? [];
  const loadedCount = from + products.length;
  const hasMore = count !== null ? loadedCount < count : products.length === pageSize;

  return {
    products,
    nextPage: hasMore ? page + 1 : null,
    totalCount: count,
  };
}

export async function createProduct(userId: string, input: ProductFormValues): Promise<Product> {
  const { data, error } = await supabase
    .from('products')
    .insert(mapFormValuesToProductInsert(userId, input))
    .select(PRODUCT_COLUMNS)
    .single();

  if (error) {
    logSupabaseError('createProduct', error);
    throw error;
  }

  return mapProductRowToProduct(data as ProductRow);
}
