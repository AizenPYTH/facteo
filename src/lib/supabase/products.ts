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
  brand?: string;
  sku?: string;
  barcodeEan?: string;
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
    brand: input.brand?.trim() || null,
    sku: input.sku?.trim() || null,
    barcode_ean: input.barcodeEan?.trim() || null,
  };

  const { data, error } = await supabase.from('products').insert(payload).select('*').single();

  if (error) {
    throw error;
  }

  return data as ProductRow;
}

/** DESIGN §5.3 : entrée « Catalogue » — recherche par nom/référence dans les produits actifs. */
export async function searchProducts(query: string, limit = 30): Promise<ProductRow[]> {
  let request = supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .order('name', { ascending: true })
    .limit(limit);

  const trimmed = query.trim();

  if (trimmed) {
    const escaped = trimmed.replace(/[%,]/g, '');
    request = request.or(
      `name.ilike.%${escaped}%,reference.ilike.%${escaped}%,sku.ilike.%${escaped}%`,
    );
  }

  const { data, error } = await request;

  if (error) {
    throw error;
  }

  return (data as ProductRow[] | null) ?? [];
}

/** Lookup catalog product by EAN/UPC/GTIN for the current user (RLS). */
export async function findProductByBarcode(barcode: string): Promise<ProductRow | null> {
  const normalized = barcode.replace(/\s/g, '').trim();
  if (!normalized) {
    return null;
  }

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('barcode_ean', normalized)
    .eq('is_active', true)
    .maybeSingle();

  if (error) {
    // Column missing / no row — treat as not found
    return null;
  }

  return (data as ProductRow | null) ?? null;
}
