import { supabase } from '@/lib/supabase';
import type { ProductInsert, ProductRow } from '@/types/database';

export type CreateProductInput = {
  userId: string;
  name: string;
  description: string;
  unitPrice: number;
  vatRate: number;
  unit: string;
  reference: string;
  type?: 'product' | 'service';
};

export async function createProduct(input: CreateProductInput): Promise<ProductRow> {
  const payload: ProductInsert = {
    user_id: input.userId,
    type: input.type ?? 'product',
    name: input.name,
    description: input.description || null,
    unit_price: input.unitPrice,
    vat_rate: input.vatRate,
    unit: input.unit || 'pièce',
    reference: input.reference || null,
  };

  const { data, error } = await supabase.from('products').insert(payload).select('*').single();

  if (error) {
    throw error;
  }

  return data as ProductRow;
}

export async function fetchCatalogItems(
  userId: string,
  type: 'product' | 'service',
  search = '',
): Promise<ProductRow[]> {
  let query = supabase
    .from('products')
    .select('*')
    .eq('user_id', userId)
    .eq('type', type)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  const sanitized = search.trim().replace(/[%_,()]/g, ' ').trim();
  if (sanitized) {
    query = query.or(
      `name.ilike.%${sanitized}%,description.ilike.%${sanitized}%,reference.ilike.%${sanitized}%`,
    );
  }

  const { data, error } = await query;
  if (error) {
    throw error;
  }

  return (data ?? []) as ProductRow[];
}
