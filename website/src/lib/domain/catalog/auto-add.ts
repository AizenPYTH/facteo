import { supabase } from '@/lib/supabase';
import { logSupabaseError } from '@/lib/supabase/errors';
import { createProductsBulk } from '@/lib/domain/supabase/products';
import type { DataScope } from '@/types/tenant';
import { createEmptyProductFormValues, type ProductFormValues, type ProductType } from '@/types/product';

/** Ligne de facture ou de devis (mêmes champs pour les deux). */
type DocumentLine = {
  productId: string | null;
  description: string;
  unit: string;
  unitPrice: string;
  vatRate: string;
};

/** Unités de temps ou de forfait : l'article rejoint les prestations, sinon les produits. */
const SERVICE_UNITS = new Set([
  'h',
  'heure',
  'heures',
  'hr',
  'jour',
  'jours',
  'j',
  'demi-journée',
  'demi-journee',
  'semaine',
  'mois',
  'forfait',
  'séance',
  'seance',
  'prestation',
  'intervention',
  'déplacement',
  'deplacement',
]);

/** Nom comparable : casse, accents et espaces ignorés. */
export function catalogKey(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function lineCatalogType(unit: string): ProductType {
  return SERVICE_UNITS.has(catalogKey(unit)) ? 'service' : 'product';
}

/** Première ligne du libellé = nom ; la suite = description. */
function splitDescription(text: string): { name: string; description: string } {
  const [first, ...rest] = text.trim().split(/\r?\n/);
  const name = first.trim().slice(0, 200);
  return { name, description: rest.join('\n').trim() };
}

/**
 * Articles d'un document absents du catalogue, prêts à y être ajoutés : lignes
 * saisies à la main (sans produit du catalogue), un seul par nom, aucun dont le
 * nom existe déjà parmi les produits ou les prestations.
 */
export function newCatalogItems(
  lines: DocumentLine[],
  existingNames: Iterable<string>,
): { type: ProductType; values: ProductFormValues }[] {
  const known = new Set(Array.from(existingNames, catalogKey));
  const items: { type: ProductType; values: ProductFormValues }[] = [];

  for (const line of lines) {
    if (line.productId) continue;
    const { name, description } = splitDescription(line.description);
    const key = catalogKey(name);
    if (!key || known.has(key)) continue;
    known.add(key);
    items.push({
      type: lineCatalogType(line.unit),
      values: {
        ...createEmptyProductFormValues(),
        name,
        description,
        unitPrice: line.unitPrice.trim() || '0',
        vatRate: line.vatRate.trim() || '20',
        unit: line.unit.trim() || 'unité',
      },
    });
  }

  return items;
}

/**
 * Après l'enregistrement d'une facture ou d'un devis : les articles qui ne
 * viennent pas du catalogue y sont ajoutés (nom, prix HT, TVA, unité), quand
 * le compte a déjà un catalogue. Renvoie le nombre d'articles ajoutés.
 */
export async function addDocumentLinesToCatalog(scope: DataScope, lines: DocumentLine[]): Promise<number> {
  if (!lines.some((line) => !line.productId && line.description.trim())) return 0;

  // Tout le catalogue, page par page : le serveur s'arrête à 1 000 lignes par requête.
  const existing: string[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from('products')
      .select('name')
      .eq('user_id', scope.userId)
      .is('deleted_at', null)
      .order('id')
      .range(from, from + 999);
    if (error) {
      logSupabaseError('addDocumentLinesToCatalog', error);
      return 0;
    }
    existing.push(...(data ?? []).map((row) => String((row as { name?: unknown }).name ?? '')));
    if (!data || data.length < 1000) break;
  }

  // Pas encore de catalogue : on ne crée pas un catalogue que l'utilisateur n'a pas demandé.
  if (existing.length === 0) return 0;

  const items = newCatalogItems(lines, existing);
  let added = 0;
  for (const type of ['product', 'service'] as const) {
    const values = items.filter((item) => item.type === type).map((item) => item.values);
    if (values.length === 0) continue;
    try {
      added += (await createProductsBulk(scope, type, values)).length;
    } catch (createError) {
      logSupabaseError('addDocumentLinesToCatalog', createError as { message?: string });
    }
  }
  return added;
}
