/** Présentation et recherche des commandes importées. Module pur. */

import type { ExternalOrder } from '@/types/integrations';

/**
 * Libellé principal d'une commande : le titre de l'objet vendu.
 * C'est ce que le vendeur reconnaît, bien plus qu'un numéro de commande.
 */
export function orderPrimaryLabel(order: ExternalOrder): string {
  const first = order.lines[0];
  if (!first) return `Commande ${order.externalOrderId}`;
  if (order.lines.length === 1) return first.title;
  return `${first.title} + ${order.lines.length - 1} autre${order.lines.length > 2 ? 's' : ''}`;
}

/** Libellé secondaire : l'acheteur, ou son pseudo à défaut. */
export function orderBuyerLabel(order: ExternalOrder): string {
  return (
    order.buyer.companyName ??
    order.buyer.fullName ??
    order.buyerUsername ??
    'Acheteur non communiqué'
  );
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    // Recherche insensible aux accents : « lampe » doit trouver « Lâmpe ».
    .replace(/[̀-ͯ]/g, '');
}

/**
 * Champs sur lesquels porte la recherche : titre et SKU des articles,
 * acheteur, numéro de commande et référence des ventes.
 */
export function orderSearchHaystack(order: ExternalOrder): string {
  return normalize(
    [
      ...order.lines.flatMap((line) => [line.title, line.sku ?? '']),
      order.buyer.fullName ?? '',
      order.buyer.companyName ?? '',
      order.buyerUsername ?? '',
      order.externalOrderId,
      order.legacyOrderId ?? '',
      order.orderReference ?? '',
    ]
      .filter(Boolean)
      .join(' '),
  );
}

/** Tous les mots de la recherche doivent être présents, dans n'importe quel ordre. */
export function matchesOrderSearch(order: ExternalOrder, search: string): boolean {
  const terms = normalize(search).split(/\s+/).filter(Boolean);
  if (terms.length === 0) return true;
  const haystack = orderSearchHaystack(order);
  return terms.every((term) => haystack.includes(term));
}

export function filterOrdersBySearch(orders: ExternalOrder[], search: string): ExternalOrder[] {
  if (!search.trim()) return orders;
  return orders.filter((order) => matchesOrderSearch(order, search));
}
