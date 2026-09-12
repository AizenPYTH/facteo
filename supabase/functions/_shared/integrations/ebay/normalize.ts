/**
 * Normalisation d'une commande eBay vers la ligne `external_orders`.
 *
 * Module pur : aucun accès réseau, aucun accès base. Testable seul.
 *
 * Deux règles structurantes :
 *
 * 1. MINIMISATION DES DONNÉES. On ne conserve que ce qui sert à établir une
 *    facture : identité, société, adresse, e-mail. Le téléphone, l'identifiant
 *    fiscal acheteur et les commentaires de commande sont explicitement écartés.
 *
 * 2. CAPTURE IMMÉDIATE. eBay cesse de renvoyer l'e-mail au bout de 14 jours et
 *    le nom / la rue au bout de 90 jours. Le snapshot pris à l'import fait foi ;
 *    une resynchronisation ultérieure ne doit jamais l'écraser par du vide.
 */

import {
  absMoney,
  amountToMoney,
  centsToDecimalString,
  exactUnitPriceCents,
  sumMoney,
  type Money,
} from '../money.ts';

export type NormalizedAddress = {
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  postalCode: string | null;
  stateOrProvince: string | null;
  countryCode: string | null;
};

export type BuyerSnapshot = {
  fullName: string | null;
  companyName: string | null;
  email: string | null;
  address: NormalizedAddress | null;
  /** Date de capture : permet d'expliquer une donnée absente côté interface. */
  capturedAt: string;
};

export type NormalizedLine = {
  externalLineId: string | null;
  title: string;
  sku: string | null;
  quantity: number;
  /** Chaîne décimale. Prix unitaire hors remise, tel que facturé par eBay. */
  unitPrice: string;
  lineTotal: string;
  /** Taxe collectée ET reversée par eBay pour cette ligne. */
  marketplaceTax: string;
  /** true quand la quantité a été ramenée à 1 pour éviter un arrondi inventé. */
  quantityCollapsed: boolean;
  originalQuantity: number;
  marketplaceId: string | null;
};

export type NormalizedOrder = {
  externalOrderId: string;
  legacyOrderId: string | null;
  orderReference: string | null;
  orderCreatedAt: string | null;
  orderModifiedAt: string | null;
  fulfillmentStatus: string | null;
  paymentStatus: string | null;
  currency: string | null;
  subtotalAmount: string;
  shippingAmount: string;
  discountAmount: string;
  taxAmount: string;
  totalAmount: string;
  marketplaceTaxAmount: string;
  collectAndRemit: boolean;
  buyerUsername: string | null;
  buyerSnapshot: BuyerSnapshot;
  lineItems: NormalizedLine[];
  marketplaceIds: string[];
};

function asString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function asIsoDate(value: unknown): string | null {
  const raw = asString(value);
  if (!raw) return null;
  const timestamp = Date.parse(raw);
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asPositiveInt(value: unknown): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

function normalizeEmail(value: unknown): string | null {
  const raw = asString(value);
  if (!raw) return null;
  // eBay renvoie une vraie adresse acheteur pendant 14 jours ; au-delà, rien.
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(raw) ? raw.toLowerCase() : null;
}

function normalizeAddress(contactAddress: unknown): NormalizedAddress | null {
  const address = asRecord(contactAddress);
  if (!address) return null;
  const normalized: NormalizedAddress = {
    addressLine1: asString(address.addressLine1),
    addressLine2: asString(address.addressLine2),
    city: asString(address.city),
    postalCode: asString(address.postalCode),
    stateOrProvince: asString(address.stateOrProvince),
    countryCode: asString(address.countryCode)?.toUpperCase() ?? null,
  };
  const hasAnything = Object.values(normalized).some((value) => value !== null);
  return hasAnything ? normalized : null;
}

/**
 * L'adresse exploitable est celle de la livraison :
 * `fulfillmentStartInstructions[].shippingStep.shipTo`.
 * `Order.buyer` ne contient en pratique que le pseudo eBay.
 *
 * `primaryPhone` est délibérément ignoré : il n'est pas nécessaire pour facturer.
 */
export function extractBuyerSnapshot(order: Record<string, unknown>, capturedAt: string): BuyerSnapshot {
  const instructions = asArray(order.fulfillmentStartInstructions);
  let shipTo: Record<string, unknown> | null = null;
  for (const instruction of instructions) {
    const step = asRecord(asRecord(instruction)?.shippingStep);
    const candidate = asRecord(step?.shipTo);
    if (candidate) {
      shipTo = candidate;
      break;
    }
  }

  return {
    fullName: asString(shipTo?.fullName),
    companyName: asString(shipTo?.companyName),
    email: normalizeEmail(shipTo?.email),
    address: normalizeAddress(shipTo?.contactAddress),
    capturedAt,
  };
}

/**
 * Fusionne un ancien snapshot avec un nouveau.
 * Une information déjà capturée n'est jamais remplacée par une absence :
 * c'est ce qui protège l'e-mail (14 jours) et le nom / la rue (90 jours).
 */
export function mergeBuyerSnapshot(
  previous: BuyerSnapshot | null,
  next: BuyerSnapshot,
): BuyerSnapshot {
  if (!previous) return next;

  const mergedAddress: NormalizedAddress | null =
    next.address && previous.address
      ? {
          addressLine1: next.address.addressLine1 ?? previous.address.addressLine1,
          addressLine2: next.address.addressLine2 ?? previous.address.addressLine2,
          city: next.address.city ?? previous.address.city,
          postalCode: next.address.postalCode ?? previous.address.postalCode,
          stateOrProvince: next.address.stateOrProvince ?? previous.address.stateOrProvince,
          countryCode: next.address.countryCode ?? previous.address.countryCode,
        }
      : (next.address ?? previous.address);

  return {
    fullName: next.fullName ?? previous.fullName,
    companyName: next.companyName ?? previous.companyName,
    email: next.email ?? previous.email,
    address: mergedAddress,
    capturedAt: previous.capturedAt,
  };
}

function marketplaceTaxForLine(line: Record<string, unknown>): Money {
  return sumMoney(
    asArray(line.ebayCollectAndRemitTaxes).map((entry) => amountToMoney(asRecord(entry)?.amount)),
  );
}

function normalizeLine(raw: unknown): NormalizedLine | null {
  const line = asRecord(raw);
  if (!line) return null;

  const title = asString(line.title) ?? asString(line.sku) ?? 'Article eBay';
  const quantity = asPositiveInt(line.quantity);
  const lineCost = amountToMoney(line.lineItemCost);
  const unitCents = exactUnitPriceCents(lineCost.cents, quantity);

  // Si le total ne se divise pas exactement par la quantité, on refuse
  // d'inventer un arrondi : la ligne devient une ligne unique au montant réel.
  const collapsed = unitCents === null && quantity > 1;

  return {
    externalLineId: asString(line.lineItemId),
    title,
    sku: asString(line.sku),
    quantity: collapsed ? 1 : quantity,
    unitPrice: centsToDecimalString(collapsed ? lineCost.cents : (unitCents ?? lineCost.cents)),
    lineTotal: centsToDecimalString(lineCost.cents),
    marketplaceTax: centsToDecimalString(marketplaceTaxForLine(line).cents),
    quantityCollapsed: collapsed,
    originalQuantity: quantity,
    marketplaceId: asString(line.listingMarketplaceId) ?? asString(line.purchaseMarketplaceId),
  };
}

export function normalizeEbayOrder(
  raw: Record<string, unknown>,
  capturedAt: string = new Date().toISOString(),
): NormalizedOrder | null {
  const externalOrderId = asString(raw.orderId);
  if (!externalOrderId) return null;

  const pricing = asRecord(raw.pricingSummary) ?? {};
  const total = amountToMoney(pricing.total);
  const subtotal = amountToMoney(pricing.priceSubtotal);
  const shipping = amountToMoney(pricing.deliveryCost);
  const tax = amountToMoney(pricing.tax);
  // Les remises eBay arrivent en négatif ; on stocke une valeur positive.
  const discount = absMoney(
    sumMoney([amountToMoney(pricing.priceDiscount), amountToMoney(pricing.deliveryDiscount)]),
  );

  const lineItems = asArray(raw.lineItems)
    .map(normalizeLine)
    .filter((line): line is NormalizedLine => line !== null);

  const marketplaceTax = sumMoney(
    asArray(raw.lineItems).map((line) => marketplaceTaxForLine(asRecord(line) ?? {})),
  );

  const marketplaceIds = Array.from(
    new Set(
      lineItems
        .map((line) => line.marketplaceId)
        .filter((value): value is string => typeof value === 'string'),
    ),
  ).sort();

  const currency =
    total.currency ?? subtotal.currency ?? shipping.currency ?? lineItemsCurrency(raw) ?? null;

  return {
    externalOrderId,
    legacyOrderId: asString(raw.legacyOrderId),
    orderReference: asString(raw.salesRecordReference),
    orderCreatedAt: asIsoDate(raw.creationDate),
    orderModifiedAt: asIsoDate(raw.lastModifiedDate),
    fulfillmentStatus: asString(raw.orderFulfillmentStatus),
    paymentStatus: asString(raw.orderPaymentStatus),
    currency,
    subtotalAmount: centsToDecimalString(subtotal.cents),
    shippingAmount: centsToDecimalString(shipping.cents),
    discountAmount: centsToDecimalString(discount.cents),
    taxAmount: centsToDecimalString(tax.cents),
    totalAmount: centsToDecimalString(total.cents),
    marketplaceTaxAmount: centsToDecimalString(marketplaceTax.cents),
    // `ebayCollectAndRemitTax` n'est renvoyé que s'il vaut true ; on retient
    // aussi le cas où seul le détail par ligne est présent.
    collectAndRemit: raw.ebayCollectAndRemitTax === true || marketplaceTax.cents > 0n,
    buyerUsername: asString(asRecord(raw.buyer)?.username),
    buyerSnapshot: extractBuyerSnapshot(raw, capturedAt),
    lineItems,
    marketplaceIds,
  };
}

function lineItemsCurrency(raw: Record<string, unknown>): string | null {
  for (const line of asArray(raw.lineItems)) {
    const money = amountToMoney(asRecord(line)?.lineItemCost);
    if (money.currency) return money.currency;
  }
  return null;
}

/** Borne haute des `lastModifiedDate` : sert de curseur pour la synchro suivante. */
export function latestModifiedAt(orders: NormalizedOrder[]): string | null {
  let latest: number | null = null;
  for (const order of orders) {
    if (!order.orderModifiedAt) continue;
    const timestamp = Date.parse(order.orderModifiedAt);
    if (Number.isFinite(timestamp) && (latest === null || timestamp > latest)) {
      latest = timestamp;
    }
  }
  return latest === null ? null : new Date(latest).toISOString();
}
