/**
 * Traduction d'une commande eBay importée en brouillon de facture INVEQ.
 *
 * Ce module est une SOURCE DE DONNÉES pour `createInvoice()` : il ne crée
 * rien, ne persiste rien, ne calcule aucun total. Il produit uniquement les
 * valeurs de formulaire que l'utilisateur voit, corrige et valide.
 *
 * Règle TVA : INVEQ ne devine jamais un taux. Toutes les lignes sortent avec
 * une TVA vide (= 0 % côté calculs) et l'utilisateur doit la renseigner. Quand
 * eBay a collecté et reversé la taxe, un avertissement bloquant l'explique.
 */

import { createLocalInvoiceLineId, type InvoiceLineValue } from '@/types/invoice';
import { createEmptyClientFormValues, type ClientFormValues } from '@/types/client';
import {
  centsIncludingVat,
  centsToDecimalString,
  decimalExcludingVat,
  decimalStringToCents,
  isPositiveAmount,
} from '@/lib/integrations/money';
import type { ExternalOrder, ExternalOrderBuyer } from '@/types/integrations';

export type OrderDraftWarningLevel = 'blocking' | 'info';

/**
 * eBay masque l'adresse de l'acheteur derrière un relais `@members.ebay.com`.
 * Les messages y sont transférés, mais ce n'est pas l'adresse personnelle de
 * l'acheteur et elle cesse de fonctionner après la transaction.
 */
export function isEbayRelayEmail(email: string | null): boolean {
  return typeof email === 'string' && /@members\.ebay\.com\s*$/i.test(email);
}

export type OrderDraftWarning = {
  code:
    | 'collect-and-remit'
    | 'vat-not-set'
    | 'prices-include-vat'
    | 'relay-email'
    | 'buyer-name-missing'
    | 'buyer-address-incomplete'
    | 'buyer-email-missing'
    | 'quantity-collapsed'
    | 'refunded'
    | 'not-paid';
  level: OrderDraftWarningLevel;
  message: string;
};

/**
 * Taux de TVA appliqué par défaut aux lignes importées.
 *
 * INVEQ ne lit aucun taux dans la réponse eBay : l'API ne fournit pas la TVA
 * vendeur. C'est une valeur de départ, affichée et modifiable avant création,
 * pas une déduction. Elle est ignorée dès qu'eBay a lui-même collecté la taxe,
 * cas où l'utilisateur doit trancher.
 */
export const DEFAULT_EBAY_VAT_RATE = '20';

/**
 * Les prix renvoyés par eBay sont TTC.
 *
 * Vérifié sur une facture eBay réelle : « Prix de l'objet 29,00 EUR », « Taux
 * de TVA 20 % », « Montant de la TVA 4,83 EUR », HT 24,17 EUR. INVEQ facture
 * en HT + taux : il faut donc retirer la TVA du prix eBay, faute de quoi la
 * facture dépasserait de 20 % ce que l'acheteur a réellement payé.
 */
export const EBAY_PRICES_INCLUDE_VAT = true;

function parseRate(vatRate: string): number {
  const parsed = Number.parseFloat((vatRate || '').replace(',', '.'));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

/** Prix unitaire HT à porter sur la facture, à partir du prix eBay TTC. */
export function invoiceUnitPrice(ebayPrice: string, vatRate: string): string {
  return EBAY_PRICES_INCLUDE_VAT ? decimalExcludingVat(ebayPrice, vatRate) : ebayPrice;
}

export type OrderInvoiceDraft = {
  lines: InvoiceLineValue[];
  notes: string;
  warnings: OrderDraftWarning[];
  /** true tant que l'utilisateur n'a pas validé les avertissements bloquants. */
  requiresAcknowledgement: boolean;
};

function cleanTitle(value: string): string {
  const trimmed = value.trim();
  return trimmed.length > 180 ? `${trimmed.slice(0, 177)}…` : trimmed;
}

/**
 * Le modèle de ligne du site n'a qu'un champ `description` : le titre eBay en
 * devient la première ligne, les détails suivent.
 */
function lineDescription(order: ExternalOrder, line: ExternalOrder['lines'][number]): string {
  const details: string[] = [];
  if (line.sku) details.push(`SKU ${line.sku}`);
  if (line.quantityCollapsed) {
    details.push(
      `Quantité eBay : ${line.originalQuantity} (regroupée en une ligne, le montant eBay n’étant pas divisible au centime)`,
    );
  }
  const marketplace = line.marketplaceId ?? order.marketplaceIds[0] ?? null;
  if (marketplace) details.push(`Place de marché ${marketplace}`);
  if (isPositiveAmount(line.marketplaceTax)) {
    details.push(`Taxe collectée par eBay : ${line.marketplaceTax} ${order.currency ?? ''}`.trim());
  }
  return [cleanTitle(line.title), ...details].filter(Boolean).join('\n');
}

export function buildInvoiceLinesFromOrder(
  order: ExternalOrder,
  vatRate: string = DEFAULT_EBAY_VAT_RATE,
): InvoiceLineValue[] {
  // Quand eBay a collecté et reversé la taxe, aucun taux vendeur n'est
  // pré-rempli : l'utilisateur doit décider en connaissance de cause.
  const appliedVat = order.collectAndRemit ? '' : vatRate;

  const lines: InvoiceLineValue[] = order.lines.map((line) => ({
    id: createLocalInvoiceLineId(),
    productId: null,
    description: lineDescription(order, line),
    quantity: String(line.quantity),
    unit: 'unité',
    unitPrice: invoiceUnitPrice(line.unitPrice, appliedVat),
    vatRate: appliedVat,
    discountPercent: '0',
  }));

  if (isPositiveAmount(order.shippingAmount)) {
    lines.push({
      id: createLocalInvoiceLineId(),
      productId: null,
      description: 'Frais de livraison\nMontant facturé par eBay pour cette commande.',
      quantity: '1',
      unit: 'forfait',
      unitPrice: invoiceUnitPrice(order.shippingAmount, appliedVat),
      vatRate: appliedVat,
      discountPercent: '0',
    });
  }

  return lines;
}

export function buildOrderNotes(order: ExternalOrder): string {
  const reference = order.orderReference
    ? `Référence des ventes eBay : ${order.orderReference}`
    : null;
  return [
    `Commande eBay ${order.externalOrderId}`,
    reference,
    order.orderCreatedAt
      ? `Passée le ${new Date(order.orderCreatedAt).toLocaleDateString('fr-FR')}`
      : null,
  ]
    .filter((part): part is string => Boolean(part))
    .join(' · ');
}

export function collectOrderWarnings(order: ExternalOrder): OrderDraftWarning[] {
  const warnings: OrderDraftWarning[] = [];

  if (order.collectAndRemit) {
    warnings.push({
      code: 'collect-and-remit',
      level: 'blocking',
      message:
        `eBay a collecté et reversé une taxe de ${order.marketplaceTaxAmount} ${order.currency ?? ''} sur cette commande. ` +
        'N’ajoutez pas de TVA vendeur par-dessus sans avoir vérifié le traitement applicable.',
    });
  }

  warnings.push({
    code: 'vat-not-set',
    level: 'info',
    message: order.collectAndRemit
      ? 'Aucun taux de TVA n’a été pré-rempli : eBay a déjà collecté la taxe sur cette commande. Décidez du traitement avant de valider.'
      : 'Le taux de TVA proposé est une valeur par défaut, pas une donnée eBay : l’API ne transmet pas la TVA vendeur. Vérifiez-le avant de valider.',
  });

  if (!order.buyer.fullName && !order.buyer.companyName) {
    warnings.push({
      code: 'buyer-name-missing',
      level: 'blocking',
      message:
        'eBay n’a pas fourni le nom de l’acheteur (il n’est plus renvoyé au-delà de 90 jours). Complétez la fiche client avant d’émettre la facture.',
    });
  }

  const address = order.buyer.address;
  if (!address?.addressLine1 || !address.city || !address.postalCode) {
    warnings.push({
      code: 'buyer-address-incomplete',
      level: 'blocking',
      message:
        'L’adresse de l’acheteur est incomplète (eBay masque la rue au-delà de 90 jours). Complétez-la avant d’émettre la facture.',
    });
  }

  if (EBAY_PRICES_INCLUDE_VAT && !order.collectAndRemit) {
    warnings.push({
      code: 'prices-include-vat',
      level: 'info',
      message:
        'Les prix eBay sont TTC. Ils ont été convertis en HT au taux choisi, pour que le total de la facture corresponde à ce que l’acheteur a payé.',
    });
  }

  if (isEbayRelayEmail(order.buyer.email)) {
    warnings.push({
      code: 'relay-email',
      level: 'info',
      message:
        'L’adresse e-mail fournie par eBay est un relais @members.ebay.com, pas l’adresse personnelle de l’acheteur. Les messages lui sont transférés, mais ce relais cesse de fonctionner quelque temps après la vente.',
    });
  }

  if (!order.buyer.email) {
    warnings.push({
      code: 'buyer-email-missing',
      level: 'info',
      message:
        'Aucune adresse e-mail acheteur n’est disponible (eBay ne la renvoie que pendant 14 jours). L’envoi par e-mail devra utiliser une adresse saisie manuellement.',
    });
  }

  if (order.lines.some((line) => line.quantityCollapsed)) {
    warnings.push({
      code: 'quantity-collapsed',
      level: 'info',
      message:
        'Une ligne a été regroupée en une seule unité : le montant eBay ne se divisait pas exactement par la quantité. Le total reste identique.',
    });
  }

  if (order.paymentStatus === 'PARTIALLY_REFUNDED' || order.paymentStatus === 'FULLY_REFUNDED') {
    warnings.push({
      code: 'refunded',
      level: 'blocking',
      message:
        'Cette commande a fait l’objet d’un remboursement sur eBay. Vérifiez les montants avant de facturer.',
    });
  } else if (order.paymentStatus && order.paymentStatus !== 'PAID') {
    warnings.push({
      code: 'not-paid',
      level: 'info',
      message: `Le paiement eBay n’est pas confirmé (statut ${order.paymentStatus}).`,
    });
  }

  return warnings;
}

export function buildOrderInvoiceDraft(
  order: ExternalOrder,
  vatRate: string = DEFAULT_EBAY_VAT_RATE,
): OrderInvoiceDraft {
  const warnings = collectOrderWarnings(order);
  return {
    lines: buildInvoiceLinesFromOrder(order, vatRate),
    notes: buildOrderNotes(order),
    warnings,
    requiresAcknowledgement: warnings.some((warning) => warning.level === 'blocking'),
  };
}

/** Somme TTC du brouillon, en centimes : c'est ce que l'acheteur doit payer. */
export function draftLinesTotalTtcCents(lines: InvoiceLineValue[]): number {
  return lines.reduce((total, line) => {
    const unitHt = decimalStringToCents(line.unitPrice) ?? 0;
    const quantity = Number(line.quantity);
    const lineHt = unitHt * (Number.isFinite(quantity) ? quantity : 0);
    return total + centsIncludingVat(lineHt, parseRate(line.vatRate));
  }, 0);
}

/** Somme HT du brouillon, en centimes. */
export function draftLinesTotalCents(lines: InvoiceLineValue[]): number {
  return lines.reduce((total, line) => {
    const unit = decimalStringToCents(line.unitPrice) ?? 0;
    const quantity = Number(line.quantity);
    return total + unit * (Number.isFinite(quantity) ? quantity : 0);
  }, 0);
}

/**
 * Écart entre le TTC du brouillon et ce qu'eBay a facturé à l'acheteur.
 * Un écart de quelques centimes est normal (arrondi au centime par ligne) ;
 * un écart plus large signale une remise ou un frais non repris.
 */
export function draftTotalMismatch(order: ExternalOrder, lines: InvoiceLineValue[]): string | null {
  const orderTotal = decimalStringToCents(order.totalAmount);
  if (orderTotal === null) return null;

  // Quand eBay a collecté la taxe, elle n'est pas refacturée par le vendeur.
  const marketplaceTax = order.collectAndRemit
    ? (decimalStringToCents(order.marketplaceTaxAmount) ?? 0)
    : 0;

  const delta = draftLinesTotalTtcCents(lines) - (orderTotal - marketplaceTax);
  return Math.abs(delta) <= lines.length ? null : centsToDecimalString(delta);
}

/** Fiche client pré-remplie à partir du snapshot acheteur. */
export function buildClientFormFromBuyer(buyer: ExternalOrderBuyer): ClientFormValues {
  const values = createEmptyClientFormValues();
  const fullName = (buyer.fullName ?? '').trim();
  const separatorIndex = fullName.lastIndexOf(' ');

  return {
    ...values,
    firstName: separatorIndex > 0 ? fullName.slice(0, separatorIndex) : '',
    lastName: separatorIndex > 0 ? fullName.slice(separatorIndex + 1) : fullName,
    company: buyer.companyName ?? '',
    email: buyer.email ?? '',
    address: [buyer.address?.addressLine1, buyer.address?.addressLine2]
      .filter((part): part is string => Boolean(part))
      .join('\n'),
    postalCode: buyer.address?.postalCode ?? '',
    city: buyer.address?.city ?? '',
    country: buyer.address?.countryCode ?? values.country,
  };
}
