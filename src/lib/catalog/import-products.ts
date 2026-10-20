import type { ImportedProduct } from '@/lib/catalog/spreadsheet-parse';
import { supabase } from '@/lib/supabase';
import { logSupabaseError } from '@/lib/supabase/errors';
import type { ProductInsert, ProductUpdate } from '@/types/database';

type CatalogType = 'product' | 'service';

const CHUNK_SIZE = 200;

export type CatalogImportResult = {
  created: number;
  updated: number;
  /** Articles dont la référence existait déjà (mis à jour ou laissés tels quels). */
  duplicates: number;
};

function toFields(type: CatalogType, item: ImportedProduct) {
  const text = (value: string) => value.trim() || null;
  return {
    type,
    name: item.name.trim(),
    description: text(item.description),
    reference: text(item.reference),
    category: text(item.category),
    brand: text(item.brand),
    unit_price: item.unitPrice,
    price_ttc: item.priceTtc,
    vat_rate: item.vatRate,
    unit: item.unit.trim() || 'unité',
    stock_quantity: item.stockQuantity,
    stock_alert_threshold: item.stockAlertThreshold,
    barcode_ean: text(item.barcodeEan),
    sku: text(item.sku),
    supplier: text(item.supplier),
    is_active: item.isActive,
    notes: text(item.notes),
    updated_at: new Date().toISOString(),
  } satisfies ProductUpdate;
}

function toRow(userId: string, type: CatalogType, item: ImportedProduct, createdAt: string): ProductInsert {
  return { user_id: userId, ...toFields(type, item), created_at: createdAt };
}

const referenceKey = (reference: string) => reference.trim().toLowerCase();

async function fetchExistingByReference(
  userId: string,
  references: string[],
): Promise<Map<string, { id: string; type: CatalogType }>> {
  const found = new Map<string, { id: string; type: CatalogType }>();
  const unique = [...new Set(references.map((reference) => reference.trim()).filter(Boolean))];
  for (let start = 0; start < unique.length; start += CHUNK_SIZE) {
    const { data, error } = await supabase
      .from('products')
      .select('id, type, reference')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .in('reference', unique.slice(start, start + CHUNK_SIZE));
    if (error) {
      logSupabaseError('importCatalogProducts.references', error);
      throw error;
    }
    for (const row of (data ?? []) as { id: string; type: CatalogType; reference: string | null }[]) {
      if (row.reference) found.set(referenceKey(row.reference), { id: row.id, type: row.type });
    }
  }
  return found;
}

/**
 * Enregistre les articles d'un tableur dans le catalogue du compte (commun à
 * toutes ses entreprises). Une référence déjà présente est mise à jour si
 * `updateExisting`, sinon laissée telle quelle : jamais de doublon.
 */
export async function importCatalogProducts(
  userId: string,
  type: CatalogType,
  items: ImportedProduct[],
  options: { updateExisting: boolean; onProgress?: (done: number, total: number) => void },
): Promise<CatalogImportResult> {
  const valid = items.filter((item) => item.name.trim());
  const existing = await fetchExistingByReference(
    userId,
    valid.map((item) => item.reference),
  );

  const seen = new Set<string>();
  const toCreate: ImportedProduct[] = [];
  const toUpdate: { id: string; item: ImportedProduct }[] = [];
  let duplicates = 0;
  for (const item of valid) {
    const key = referenceKey(item.reference);
    if (key) {
      if (seen.has(key)) continue;
      seen.add(key);
    }
    const match = key ? existing.get(key) : undefined;
    if (match) {
      duplicates += 1;
      if (options.updateExisting) toUpdate.push({ id: match.id, item });
    } else {
      toCreate.push(item);
    }
  }

  const total = toCreate.length + toUpdate.length;
  let done = 0;
  let created = 0;
  // Dates décroissantes d'une milliseconde : la liste garde l'ordre du fichier.
  const startedAt = Date.now();

  for (let start = 0; start < toCreate.length; start += CHUNK_SIZE) {
    const chunk = toCreate.slice(start, start + CHUNK_SIZE);
    const rows = chunk.map((item, index) =>
      toRow(userId, type, item, new Date(startedAt - start - index).toISOString()),
    );
    const { data, error } = await supabase.from('products').insert(rows).select('id');
    if (!error) {
      created += data?.length ?? 0;
    } else if (error.code === '23505') {
      // Une référence arrivée entre-temps : le paquet repart ligne par ligne.
      for (const row of rows) {
        const single = await supabase.from('products').insert(row).select('id');
        if (!single.error) created += 1;
        else if (single.error.code === '23505') duplicates += 1;
        else {
          logSupabaseError('importCatalogProducts.insert', single.error);
          throw single.error;
        }
      }
    } else {
      logSupabaseError('importCatalogProducts.insert', error);
      throw error;
    }
    done += chunk.length;
    options.onProgress?.(done, total);
  }

  let updated = 0;
  for (const { id, item } of toUpdate) {
    const { error } = await supabase
      .from('products')
      .update(toFields(type, item))
      .eq('id', id)
      .eq('user_id', userId);
    if (error) {
      logSupabaseError('importCatalogProducts.update', error);
      throw error;
    }
    updated += 1;
    done += 1;
    options.onProgress?.(done, total);
  }

  return { created, updated, duplicates };
}
