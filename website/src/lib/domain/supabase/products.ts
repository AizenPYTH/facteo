import { supabase } from '@/lib/supabase';
import { logSupabaseError } from '@/lib/supabase/errors';
import type { Product, ProductFormValues, ProductType } from '@/types/product';
import type { DataScope } from '@/types/tenant';
import type { ProductInsert, ProductRow, ProductUpdate } from '@/types/database';

export const PRODUCT_COLUMNS =
  'id, user_id, type, name, description, unit_price, vat_rate, unit, reference, is_active, created_at, updated_at' as const;

function mapProductRow(row: ProductRow): Product {
  return {
    id: row.id,
    type: row.type,
    name: row.name,
    description: row.description,
    unitPrice: row.unit_price,
    vatRate: row.vat_rate,
    unit: row.unit,
    reference: row.reference,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function sanitizeSearchTerm(search: string): string {
  return search.trim().replace(/[%_,]/g, '');
}

function mapFormToInsert(scope: DataScope, type: ProductType, values: ProductFormValues): ProductInsert {
  return {
    user_id: scope.userId,
    type,
    name: values.name.trim(),
    description: values.description.trim() || null,
    unit_price: Number(values.unitPrice.replace(',', '.')),
    vat_rate: Number(values.vatRate.replace(',', '.')),
    unit: values.unit.trim() || 'unité',
    reference: values.reference.trim() || null,
    is_active: values.isActive,
    updated_at: new Date().toISOString(),
  };
}

function mapFormToUpdate(values: ProductFormValues): ProductUpdate {
  return {
    name: values.name.trim(),
    description: values.description.trim() || null,
    unit_price: Number(values.unitPrice.replace(',', '.')),
    vat_rate: Number(values.vatRate.replace(',', '.')),
    unit: values.unit.trim() || 'unité',
    reference: values.reference.trim() || null,
    is_active: values.isActive,
    updated_at: new Date().toISOString(),
  };
}

export async function fetchProducts(
  scope: DataScope,
  type: ProductType,
  search = '',
): Promise<Product[]> {
  let query = supabase
    .from('products')
    .select(PRODUCT_COLUMNS)
    .eq('user_id', scope.userId)
    .eq('type', type)
    .is('deleted_at', null)
    .order('name', { ascending: true });

  const sanitized = sanitizeSearchTerm(search);
  if (sanitized) {
    query = query.or(
      `name.ilike.%${sanitized}%,description.ilike.%${sanitized}%,reference.ilike.%${sanitized}%`,
    );
  }

  const { data, error } = await query;

  if (error) {
    logSupabaseError('fetchProducts', error);
    return [];
  }

  return (data as ProductRow[] | null)?.map(mapProductRow) ?? [];
}

export async function fetchProductById(
  scope: DataScope,
  productId: string,
): Promise<Product | null> {
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_COLUMNS)
    .eq('id', productId)
    .eq('user_id', scope.userId)
    .is('deleted_at', null)
    .maybeSingle();

  if (error) {
    logSupabaseError('fetchProductById', error);
    return null;
  }

  return data ? mapProductRow(data as ProductRow) : null;
}

export async function createProduct(
  scope: DataScope,
  type: ProductType,
  values: ProductFormValues,
): Promise<Product> {
  const payload = mapFormToInsert(scope, type, values);

  const { data, error } = await supabase
    .from('products')
    .insert(payload)
    .select(PRODUCT_COLUMNS)
    .single();

  if (error) {
    logSupabaseError('createProduct', error);
    throw error;
  }

  return mapProductRow(data as ProductRow);
}

export async function updateProduct(
  scope: DataScope,
  productId: string,
  values: ProductFormValues,
): Promise<Product> {
  const payload = mapFormToUpdate(values);

  const { data, error } = await supabase
    .from('products')
    .update(payload)
    .eq('id', productId)
    .eq('user_id', scope.userId)
    .select(PRODUCT_COLUMNS)
    .single();

  if (error) {
    logSupabaseError('updateProduct', error);
    throw error;
  }

  return mapProductRow(data as ProductRow);
}

export async function deleteProduct(scope: DataScope, productId: string): Promise<void> {
  const { error } = await supabase
    .from('products')
    .update({ deleted_at: new Date().toISOString(), is_active: false })
    .eq('id', productId)
    .eq('user_id', scope.userId);

  if (error) {
    logSupabaseError('deleteProduct', error);
    throw error;
  }
}
