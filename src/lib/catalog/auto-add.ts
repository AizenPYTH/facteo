import { supabase } from '@/lib/supabase';
import { logSupabaseError } from '@/lib/supabase/errors';
import type { ProductInsert } from '@/types/database';
import type { DataScope } from '@/types/tenant';

/** Ligne de facture ou de devis (mêmes champs pour les deux). */
type DocumentLine = {
  productId: string | null;
  title: string;
  description: string;
  unit: string;
  unitPrice: string;
  vatRate: string;
};

type CatalogType = 'product' | 'service';

/** Unités de temps ou de forfait : l'article rejoint les prestations, sinon les produits. */
const SERVICE_UNITS = new Set([
  'h',
  'heure',
  'heures',
  'hr',
  'jour',
  'jours',
  'j',
  'demi-journee',
  'semaine',
  'mois',
  'forfait',
  'seance',
  'prestation',
  'intervention',
  'deplacement',
]);

/** Nom comparable : casse, accents et espaces ignorés (même règle que le site). */
export function catalogKey(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function lineCatalogType(unit: string): CatalogType {
  return SERVICE_UNITS.has(catalogKey(unit)) ? 'service' : 'product';
}

function parseAmount(value: string, fallback: number): number {
  const parsed = Number(value.replace(/\s/g, '').replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : fallback;
}

/** Nom court de la ligne, sinon première ligne du détail ; le reste devient la description. */
function splitLine(line: DocumentLine): { name: string; description: string } {
  const title = line.title.trim();
  if (title) {
    return { name: title.slice(0, 200), description: line.description.trim() };
  }
  const [first = '', ...rest] = line.description.trim().split(/\r?\n/);
  return { name: first.trim().slice(0, 200), description: rest.join('\n').trim() };
}

/**
 * Articles d'un document absents du catalogue, prêts à y être ajoutés : lignes
 * saisies à la main (sans produit du catalogue), un seul par nom, aucun dont le
 * nom existe déjà parmi les produits ou les prestations.
 */
export function newCatalogItems(
  userId: string,
  lines: DocumentLine[],
  existingNames: Iterable<string>,
): ProductInsert[] {
  const known = new Set(Array.from(existingNames, catalogKey));
  const items: ProductInsert[] = [];

  for (const line of lines) {
    if (line.productId) continue;
    const { name, description } = splitLine(line);
    const key = catalogKey(name);
    if (!key || known.has(key)) continue;
    known.add(key);
    const unitPrice = Math.max(0, parseAmount(line.unitPrice, 0));
    const vatRate = Math.max(0, parseAmount(line.vatRate, 20));
    items.push({
      user_id: userId,
      type: lineCatalogType(line.unit),
      name,
      description: description || null,
      unit_price: unitPrice,
      price_ttc: Math.round(unitPrice * (1 + vatRate / 100) * 100) / 100,
      vat_rate: vatRate,
      unit: line.unit.trim() || 'unité',
      is_active: true,
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
  if (!lines.some((line) => !line.productId && (line.title.trim() || line.description.trim()))) return 0;

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

  const items = newCatalogItems(scope.userId, lines, existing);
  if (items.length === 0) return 0;

  const { data, error } = await supabase.from('products').insert(items).select('id');
  if (error) {
    logSupabaseError('addDocumentLinesToCatalog', error);
    return 0;
  }
  return data?.length ?? 0;
}
