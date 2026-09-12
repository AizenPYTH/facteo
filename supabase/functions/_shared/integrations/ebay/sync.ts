/**
 * Construction des lignes `external_orders` à partir des commandes normalisées.
 * Module pur : testable sans base ni réseau.
 */

import { EBAY_PROVIDER, type EbayEnvironment } from './config.ts';
import { mergeBuyerSnapshot, type BuyerSnapshot, type NormalizedOrder } from './normalize.ts';

export type ExternalOrderRow = {
  company_id: string;
  provider: string;
  environment: EbayEnvironment;
  external_order_id: string;
  legacy_order_id: string | null;
  order_reference: string | null;
  order_created_at: string | null;
  order_modified_at: string | null;
  fulfillment_status: string | null;
  payment_status: string | null;
  currency: string | null;
  subtotal_amount: string;
  shipping_amount: string;
  discount_amount: string;
  tax_amount: string;
  total_amount: string;
  marketplace_tax_amount: string;
  collect_and_remit: boolean;
  buyer_username: string | null;
  buyer_snapshot: BuyerSnapshot;
  line_items: NormalizedOrder['lineItems'];
  marketplace_ids: string[];
  updated_at: string;
};

export function buildExternalOrderRow(
  companyId: string,
  environment: EbayEnvironment,
  order: NormalizedOrder,
  previousSnapshot: BuyerSnapshot | null,
  now: string = new Date().toISOString(),
): ExternalOrderRow {
  return {
    company_id: companyId,
    provider: EBAY_PROVIDER,
    environment,
    external_order_id: order.externalOrderId,
    legacy_order_id: order.legacyOrderId,
    order_reference: order.orderReference,
    order_created_at: order.orderCreatedAt,
    order_modified_at: order.orderModifiedAt,
    fulfillment_status: order.fulfillmentStatus,
    payment_status: order.paymentStatus,
    currency: order.currency,
    subtotal_amount: order.subtotalAmount,
    shipping_amount: order.shippingAmount,
    discount_amount: order.discountAmount,
    tax_amount: order.taxAmount,
    total_amount: order.totalAmount,
    marketplace_tax_amount: order.marketplaceTaxAmount,
    collect_and_remit: order.collectAndRemit,
    buyer_username: order.buyerUsername,
    // Le snapshot déjà capturé prime : eBay cesse de renvoyer l'e-mail à
    // 14 jours et le nom / la rue à 90 jours. On ne remplace jamais une
    // information connue par une absence.
    buyer_snapshot: mergeBuyerSnapshot(previousSnapshot, order.buyerSnapshot),
    line_items: order.lineItems,
    marketplace_ids: order.marketplaceIds,
    updated_at: now,
  };
}

/** Déduplique par identifiant de commande, en gardant la version la plus récente. */
export function dedupeOrders(orders: NormalizedOrder[]): NormalizedOrder[] {
  const byId = new Map<string, NormalizedOrder>();
  for (const order of orders) {
    const existing = byId.get(order.externalOrderId);
    if (!existing) {
      byId.set(order.externalOrderId, order);
      continue;
    }
    const a = existing.orderModifiedAt ? Date.parse(existing.orderModifiedAt) : 0;
    const b = order.orderModifiedAt ? Date.parse(order.orderModifiedAt) : 0;
    if (b >= a) byId.set(order.externalOrderId, order);
  }
  return Array.from(byId.values());
}

/**
 * Découpe une liste en lots.
 * Une synchronisation peut ramener jusqu'à 2 000 commandes : ni le filtre
 * `in(...)` (transmis en query string) ni l'upsert ne doivent partir en un
 * seul appel.
 */
export function chunk<T>(items: T[], size = 200): T[][] {
  if (size < 1) throw new Error('chunk size must be >= 1');
  const out: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    out.push(items.slice(index, index + size));
  }
  return out;
}
