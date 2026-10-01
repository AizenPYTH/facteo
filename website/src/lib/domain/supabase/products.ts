import { supabase } from '@/lib/supabase';
import { logSupabaseError } from '@/lib/supabase/errors';
import type { Product, ProductFormValues, ProductType } from '@/types/product';
import type { DataScope } from '@/types/tenant';
import type { ProductInsert, ProductRow, ProductUpdate } from '@/types/database';

export const PRODUCT_COLUMNS =
  'id, user_id, type, name, description, unit_price, price_ttc, vat_rate, unit, reference, sku, barcode_ean, category, brand, supplier, stock_quantity, stock_alert_threshold, notes, image_url, is_active, created_at, updated_at' as const;
export const LEGACY_PRODUCT_COLUMNS =
  'id, user_id, type, name, description, unit_price, vat_rate, unit, reference, is_active, created_at, updated_at' as const;

let hasExtendedProductsSchema: boolean | null = null;

function normalizeText(value: string): string {
  return value.trim();
}

function parseFlexibleNumber(value: string, fallback = 0): number {
  const raw = value
    .trim()
    .replace(/\u00a0/g, ' ')
    .replace(/[€$£]/g, '')
    .replace(/\s/g, '');

  if (!raw) {
    return fallback;
  }

  const hasComma = raw.includes(',');
  const hasDot = raw.includes('.');
  let normalized = raw;

  if (hasComma && hasDot) {
    const comma = raw.lastIndexOf(',');
    const dot = raw.lastIndexOf('.');
    if (comma > dot) {
      normalized = raw.replace(/\./g, '').replace(',', '.');
    } else {
      normalized = raw.replace(/,/g, '');
    }
  } else if (hasComma) {
    normalized = raw.replace(',', '.');
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseVatRate(value: string, fallback = 20): number {
  const raw = value.trim();
  if (!raw) {
    return fallback;
  }
  const parsed = parseFlexibleNumber(raw, fallback);
  if (raw.includes('%')) {
    return parsed;
  }
  if (parsed >= 0 && parsed <= 1) {
    return parsed * 100;
  }
  return parsed;
}

function parseBooleanLike(value: string, fallback = true): boolean {
  const normalized = value.trim().toLowerCase();
  if (!normalized) {
    return fallback;
  }
  if (['1', 'true', 'vrai', 'oui', 'yes', 'actif', 'active'].includes(normalized)) {
    return true;
  }
  if (['0', 'false', 'faux', 'non', 'no', 'inactif', 'inactive'].includes(normalized)) {
    return false;
  }
  return fallback;
}

function mapProductRow(row: ProductRow): Product {
  const safeRow = row as Partial<ProductRow>;
  return {
    id: safeRow.id ?? '',
    type: safeRow.type ?? 'product',
    name: safeRow.name ?? '',
    description: safeRow.description ?? null,
    unitPrice: safeRow.unit_price ?? 0,
    priceTtc: safeRow.price_ttc ?? null,
    vatRate: safeRow.vat_rate ?? 20,
    unit: safeRow.unit ?? 'unité',
    reference: safeRow.reference ?? null,
    sku: safeRow.sku ?? null,
    barcodeEan: safeRow.barcode_ean ?? null,
    category: safeRow.category ?? null,
    brand: safeRow.brand ?? null,
    supplier: safeRow.supplier ?? null,
    stockQuantity: safeRow.stock_quantity ?? 0,
    stockAlertThreshold: safeRow.stock_alert_threshold ?? 0,
    notes: safeRow.notes ?? null,
    imageUrl: safeRow.image_url ?? null,
    isActive: safeRow.is_active ?? true,
    createdAt: safeRow.created_at ?? new Date().toISOString(),
    updatedAt: safeRow.updated_at ?? new Date().toISOString(),
  };
}

function isMissingProductColumnError(error: unknown): boolean {
  const message =
    error && typeof error === 'object' && 'message' in error && typeof error.message === 'string'
      ? error.message
      : '';
  return message.includes('column products.') && message.includes('does not exist');
}

function isDuplicateReferenceConstraintError(error: unknown): boolean {
  const message =
    error && typeof error === 'object' && 'message' in error && typeof error.message === 'string'
      ? error.message
      : '';
  const code =
    error && typeof error === 'object' && 'code' in error && typeof error.code === 'string'
      ? error.code
      : '';
  return code === '23505' || message.includes('products_user_reference_unique_idx');
}

function markSchemaFromColumns(columns: string): void {
  hasExtendedProductsSchema = columns === PRODUCT_COLUMNS;
}

function sanitizeSearchTerm(search: string): string {
  return search.trim().replace(/[%_,]/g, '');
}

function toProductRows(value: unknown): ProductRow[] {
  return Array.isArray(value) ? (value as unknown as ProductRow[]) : [];
}

function toProductRow(value: unknown): ProductRow | null {
  if (!value || Array.isArray(value) || typeof value !== 'object') {
    return null;
  }
  return value as unknown as ProductRow;
}

function mapFormToInsert(scope: DataScope, type: ProductType, values: ProductFormValues): ProductInsert {
  const vatRate = parseVatRate(values.vatRate, 20);
  const unitPrice = parseFlexibleNumber(values.unitPrice, 0);
  const explicitTtc = values.priceTtc.trim();
  const priceTtc = explicitTtc
    ? parseFlexibleNumber(explicitTtc, 0)
    : unitPrice * (1 + Math.max(vatRate, 0) / 100);

  const payload: ProductInsert = {
    user_id: scope.userId,
    type,
    name: normalizeText(values.name),
    description: normalizeText(values.description) || null,
    unit_price: unitPrice,
    price_ttc: priceTtc,
    vat_rate: vatRate,
    unit: normalizeText(values.unit) || 'unité',
    reference: normalizeText(values.reference) || null,
    sku: normalizeText(values.sku) || null,
    barcode_ean: normalizeText(values.barcodeEan) || null,
    category: normalizeText(values.category) || null,
    brand: normalizeText(values.brand) || null,
    supplier: normalizeText(values.supplier) || null,
    stock_quantity: parseFlexibleNumber(values.stockQuantity, 0),
    stock_alert_threshold: parseFlexibleNumber(values.stockAlertThreshold, 0),
    notes: normalizeText(values.notes) || null,
    image_url: normalizeText(values.imageUrl) || null,
    is_active: parseBooleanLike(String(values.isActive), true),
    updated_at: new Date().toISOString(),
  };

  if (hasExtendedProductsSchema === false) {
    delete (payload as Partial<ProductInsert>).price_ttc;
    delete (payload as Partial<ProductInsert>).sku;
    delete (payload as Partial<ProductInsert>).barcode_ean;
    delete (payload as Partial<ProductInsert>).category;
    delete (payload as Partial<ProductInsert>).brand;
    delete (payload as Partial<ProductInsert>).supplier;
    delete (payload as Partial<ProductInsert>).stock_quantity;
    delete (payload as Partial<ProductInsert>).stock_alert_threshold;
    delete (payload as Partial<ProductInsert>).notes;
    delete (payload as Partial<ProductInsert>).image_url;
  }

  return payload;
}

function mapFormToUpdate(values: ProductFormValues): ProductUpdate {
  const vatRate = parseVatRate(values.vatRate, 20);
  const unitPrice = parseFlexibleNumber(values.unitPrice, 0);
  const explicitTtc = values.priceTtc.trim();
  const priceTtc = explicitTtc
    ? parseFlexibleNumber(explicitTtc, 0)
    : unitPrice * (1 + Math.max(vatRate, 0) / 100);

  const payload: ProductUpdate = {
    name: normalizeText(values.name),
    description: normalizeText(values.description) || null,
    unit_price: unitPrice,
    price_ttc: priceTtc,
    vat_rate: vatRate,
    unit: normalizeText(values.unit) || 'unité',
    reference: normalizeText(values.reference) || null,
    sku: normalizeText(values.sku) || null,
    barcode_ean: normalizeText(values.barcodeEan) || null,
    category: normalizeText(values.category) || null,
    brand: normalizeText(values.brand) || null,
    supplier: normalizeText(values.supplier) || null,
    stock_quantity: parseFlexibleNumber(values.stockQuantity, 0),
    stock_alert_threshold: parseFlexibleNumber(values.stockAlertThreshold, 0),
    notes: normalizeText(values.notes) || null,
    image_url: normalizeText(values.imageUrl) || null,
    is_active: parseBooleanLike(String(values.isActive), true),
    updated_at: new Date().toISOString(),
  };

  if (hasExtendedProductsSchema === false) {
    delete (payload as Partial<ProductUpdate>).price_ttc;
    delete (payload as Partial<ProductUpdate>).sku;
    delete (payload as Partial<ProductUpdate>).barcode_ean;
    delete (payload as Partial<ProductUpdate>).category;
    delete (payload as Partial<ProductUpdate>).brand;
    delete (payload as Partial<ProductUpdate>).supplier;
    delete (payload as Partial<ProductUpdate>).stock_quantity;
    delete (payload as Partial<ProductUpdate>).stock_alert_threshold;
    delete (payload as Partial<ProductUpdate>).notes;
    delete (payload as Partial<ProductUpdate>).image_url;
  }

  return payload;
}

/** Lignes renvoyées au plus par requête (limite du serveur). */
const PAGE_SIZE = 1000;

/**
 * Lit toutes les pages d'une requête : au-delà de 1 000 lignes, le serveur
 * coupait le catalogue sans le dire.
 */
async function fetchAllPages<T>(query: {
  range: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>;
}): Promise<{ data: T[]; error: unknown }> {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await query.range(from, from + PAGE_SIZE - 1);
    if (error) {
      return { data: rows, error };
    }
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE_SIZE) {
      return { data: rows, error: null };
    }
  }
}

export async function fetchProducts(
  scope: DataScope,
  type: ProductType,
  search = '',
): Promise<Product[]> {
  const firstColumns = hasExtendedProductsSchema === false ? LEGACY_PRODUCT_COLUMNS : PRODUCT_COLUMNS;
  let query = supabase
    .from('products')
    .select(firstColumns)
    .eq('user_id', scope.userId)
    .eq('type', type)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  const sanitized = sanitizeSearchTerm(search);
  if (sanitized) {
    query = query.or(
      `name.ilike.%${sanitized}%,description.ilike.%${sanitized}%,reference.ilike.%${sanitized}%,sku.ilike.%${sanitized}%,barcode_ean.ilike.%${sanitized}%,brand.ilike.%${sanitized}%,category.ilike.%${sanitized}%`,
    );
  }

  const { data, error } = await fetchAllPages(query);

  if (!error) {
    markSchemaFromColumns(firstColumns);
    return toProductRows(data).map(mapProductRow);
  }

  if (firstColumns === PRODUCT_COLUMNS && isMissingProductColumnError(error)) {
    hasExtendedProductsSchema = false;
    let legacyQuery = supabase
      .from('products')
      .select(LEGACY_PRODUCT_COLUMNS)
      .eq('user_id', scope.userId)
      .eq('type', type)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });
    const sanitized = sanitizeSearchTerm(search);
    if (sanitized) {
      legacyQuery = legacyQuery.or(
        `name.ilike.%${sanitized}%,description.ilike.%${sanitized}%,reference.ilike.%${sanitized}%`,
      );
    }
    const { data: legacyData, error: legacyError } = await fetchAllPages(legacyQuery);
    if (legacyError) {
      logSupabaseError('fetchProducts', legacyError);
      return [];
    }
    return toProductRows(legacyData).map(mapProductRow);
  }

  logSupabaseError('fetchProducts', error);
  return [];
}

export async function fetchProductsByIds(
  scope: DataScope,
  type: ProductType,
  ids: string[],
): Promise<Product[]> {
  if (ids.length === 0) {
    return [];
  }

  const firstColumns = hasExtendedProductsSchema === false ? LEGACY_PRODUCT_COLUMNS : PRODUCT_COLUMNS;
  const { data, error } = await supabase
    .from('products')
    .select(firstColumns)
    .eq('user_id', scope.userId)
    .eq('type', type)
    .is('deleted_at', null)
    .in('id', ids);

  if (!error) {
    markSchemaFromColumns(firstColumns);
    const mapped = toProductRows(data).map(mapProductRow);
    const order = new Map(ids.map((id, index) => [id, index]));
    return mapped.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
  }

  if (firstColumns === PRODUCT_COLUMNS && isMissingProductColumnError(error)) {
    hasExtendedProductsSchema = false;
    const { data: legacyData, error: legacyError } = await supabase
      .from('products')
      .select(LEGACY_PRODUCT_COLUMNS)
      .eq('user_id', scope.userId)
      .eq('type', type)
      .is('deleted_at', null)
      .in('id', ids);
    if (legacyError) {
      logSupabaseError('fetchProductsByIds', legacyError);
      return [];
    }
    const mapped = toProductRows(legacyData).map(mapProductRow);
    const order = new Map(ids.map((id, index) => [id, index]));
    return mapped.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
  }

  logSupabaseError('fetchProductsByIds', error);
  return [];
}

export async function fetchProductById(
  scope: DataScope,
  productId: string,
): Promise<Product | null> {
  const firstColumns = hasExtendedProductsSchema === false ? LEGACY_PRODUCT_COLUMNS : PRODUCT_COLUMNS;
  const { data, error } = await supabase
    .from('products')
    .select(firstColumns)
    .eq('id', productId)
    .eq('user_id', scope.userId)
    .is('deleted_at', null)
    .maybeSingle();

  if (!error) {
    markSchemaFromColumns(firstColumns);
    const mapped = toProductRow(data);
    return mapped ? mapProductRow(mapped) : null;
  }

  if (firstColumns === PRODUCT_COLUMNS && isMissingProductColumnError(error)) {
    hasExtendedProductsSchema = false;
    const { data: legacyData, error: legacyError } = await supabase
      .from('products')
      .select(LEGACY_PRODUCT_COLUMNS)
      .eq('id', productId)
      .eq('user_id', scope.userId)
      .is('deleted_at', null)
      .maybeSingle();
    if (legacyError) {
      logSupabaseError('fetchProductById', legacyError);
      return null;
    }
    const mappedLegacy = toProductRow(legacyData);
    return mappedLegacy ? mapProductRow(mappedLegacy) : null;
  }

  logSupabaseError('fetchProductById', error);
  return null;
}

export async function createProduct(
  scope: DataScope,
  type: ProductType,
  values: ProductFormValues,
): Promise<Product> {
  const payload = mapFormToInsert(scope, type, values);
  const firstColumns = hasExtendedProductsSchema === false ? LEGACY_PRODUCT_COLUMNS : PRODUCT_COLUMNS;

  const { data, error } = await supabase
    .from('products')
    .insert(payload)
    .select(firstColumns)
    .single();

  if (!error) {
    markSchemaFromColumns(firstColumns);
    const mapped = toProductRow(data);
    if (!mapped) {
      throw new Error('Réponse produit invalide après création.');
    }
    return mapProductRow(mapped);
  }

  if (firstColumns === PRODUCT_COLUMNS && isMissingProductColumnError(error)) {
    hasExtendedProductsSchema = false;
    const legacyPayload = mapFormToInsert(scope, type, values);
    const { data: legacyData, error: legacyError } = await supabase
      .from('products')
      .insert(legacyPayload)
      .select(LEGACY_PRODUCT_COLUMNS)
      .single();
    if (legacyError) {
      logSupabaseError('createProduct', legacyError);
      throw legacyError;
    }
    const mappedLegacy = toProductRow(legacyData);
    if (!mappedLegacy) {
      throw new Error('Réponse produit invalide après création (schéma legacy).');
    }
    return mapProductRow(mappedLegacy);
  }

  if (isDuplicateReferenceConstraintError(error)) {
    throw error;
  }
  logSupabaseError('createProduct', error);
  throw error;
}

/** Taille des paquets envoyés à la base lors d'un import. */
const BULK_CHUNK_SIZE = 200;

/**
 * Création en masse, par paquets : un import de 1 800 lignes passe en une
 * dizaine de requêtes au lieu de 1 800.
 */
export async function createProductsBulk(
  scope: DataScope,
  type: ProductType,
  items: ProductFormValues[],
  onProgress?: (done: number) => void,
): Promise<Product[]> {
  const created: Product[] = [];
  // Date de création décroissante d'une milliseconde par ligne : la liste,
  // triée du plus récent au plus ancien, garde l'ordre du fichier.
  const startedAt = Date.now();
  const payloadAt = (values: ProductFormValues, index: number) => ({
    ...mapFormToInsert(scope, type, values),
    created_at: new Date(startedAt - index).toISOString(),
  });

  for (let start = 0; start < items.length; start += BULK_CHUNK_SIZE) {
    const chunk = items.slice(start, start + BULK_CHUNK_SIZE);
    const columns = hasExtendedProductsSchema === false ? LEGACY_PRODUCT_COLUMNS : PRODUCT_COLUMNS;
    let { data, error } = await supabase
      .from('products')
      .insert(chunk.map((values, index) => payloadAt(values, start + index)))
      .select(columns);

    if (error && columns === PRODUCT_COLUMNS && isMissingProductColumnError(error)) {
      hasExtendedProductsSchema = false;
      ({ data, error } = await supabase
        .from('products')
        .insert(chunk.map((values, index) => payloadAt(values, start + index)))
        .select(LEGACY_PRODUCT_COLUMNS));
    }

    if (error) {
      logSupabaseError('createProductsBulk', error);
      throw error;
    }

    created.push(...toProductRows(data).map(mapProductRow));
    onProgress?.(Math.min(start + chunk.length, items.length));
  }

  return created;
}

/** Produits du catalogue dont la référence figure dans la liste (comparaison insensible à la casse côté appelant). */
export async function fetchProductsByReferences(
  scope: DataScope,
  type: ProductType,
  references: string[],
): Promise<Product[]> {
  const found: Product[] = [];
  const unique = [...new Set(references.map((reference) => reference.trim()).filter(Boolean))];

  // Références encore tenues par des lignes supprimées : libérées avant l'import.
  for (let start = 0; start < unique.length; start += BULK_CHUNK_SIZE) {
    const { error } = await supabase
      .from('products')
      .update({ reference: null })
      .eq('user_id', scope.userId)
      .not('deleted_at', 'is', null)
      .in('reference', unique.slice(start, start + BULK_CHUNK_SIZE));
    if (error) {
      logSupabaseError('releaseDeletedReferences', error);
    }
  }

  for (let start = 0; start < unique.length; start += BULK_CHUNK_SIZE) {
    const columns = hasExtendedProductsSchema === false ? LEGACY_PRODUCT_COLUMNS : PRODUCT_COLUMNS;
    const { data, error } = await supabase
      .from('products')
      .select(columns)
      .eq('user_id', scope.userId)
      .eq('type', type)
      .is('deleted_at', null)
      .in('reference', unique.slice(start, start + BULK_CHUNK_SIZE));

    if (error) {
      logSupabaseError('fetchProductsByReferences', error);
      throw error;
    }
    found.push(...toProductRows(data).map(mapProductRow));
  }

  return found;
}

export async function updateProduct(
  scope: DataScope,
  productId: string,
  values: ProductFormValues,
): Promise<Product> {
  const payload = mapFormToUpdate(values);
  const firstColumns = hasExtendedProductsSchema === false ? LEGACY_PRODUCT_COLUMNS : PRODUCT_COLUMNS;

  const { data, error } = await supabase
    .from('products')
    .update(payload)
    .eq('id', productId)
    .eq('user_id', scope.userId)
    .select(firstColumns)
    .single();

  if (!error) {
    markSchemaFromColumns(firstColumns);
    const mapped = toProductRow(data);
    if (!mapped) {
      throw new Error('Réponse produit invalide après mise à jour.');
    }
    return mapProductRow(mapped);
  }

  if (firstColumns === PRODUCT_COLUMNS && isMissingProductColumnError(error)) {
    hasExtendedProductsSchema = false;
    const legacyPayload = mapFormToUpdate(values);
    const { data: legacyData, error: legacyError } = await supabase
      .from('products')
      .update(legacyPayload)
      .eq('id', productId)
      .eq('user_id', scope.userId)
      .select(LEGACY_PRODUCT_COLUMNS)
      .single();
    if (legacyError) {
      logSupabaseError('updateProduct', legacyError);
      throw legacyError;
    }
    const mappedLegacy = toProductRow(legacyData);
    if (!mappedLegacy) {
      throw new Error('Réponse produit invalide après mise à jour (schéma legacy).');
    }
    return mapProductRow(mappedLegacy);
  }

  logSupabaseError('updateProduct', error);
  throw error;
}

export async function deleteProduct(scope: DataScope, productId: string): Promise<void> {
  const { error } = await supabase
    .from('products')
    // La référence est libérée : l'unicité en base compte aussi les lignes
    // supprimées, qui bloquaient la recréation d'un produit de même référence.
    .update({ deleted_at: new Date().toISOString(), is_active: false, reference: null })
    .eq('id', productId)
    .eq('user_id', scope.userId);

  if (error) {
    logSupabaseError('deleteProduct', error);
    throw error;
  }
}
