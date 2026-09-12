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
import type { ClientFormValues } from '@/types/client';
import { createEmptyClientFormValues } from '@/types/client';
import { centsToDecimalString, decimalStringToCents, isPositiveAmount } from '@/lib/integrations/money';
import type { ExternalOrder, ExternalOrderBuyer } from '@/types/integrations';

export type OrderDraftWarningLevel = 'blocking' | 'info';

export type OrderDraftWarning = {
  code:
    | 'collect-and-remit'
    | 'vat-not-set'
    | 'buyer-name-missing'
    | 'buyer-address-incomplete'
    | 'buyer-email-missing'
    | 'quantity-collapsed'
    | 'refunded'
    | 'not-paid';
  level: OrderDraftWarningLevel;
  message: string;
};

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

function lineDescription(order: ExternalOrder, line: ExternalOrder['lines'][number]): string {
  const parts: string[] = [];
  if (line.sku) parts.push(`SKU ${line.sku}`);
  if (line.quantityCollapsed) {
    parts.push(
      `Quantité eBay : ${line.originalQuantity} (regroupée en une ligne, le montant eBay n’étant pas divisible au centime)`,
    );
  }
  const marketplace = line.marketplaceId ?? order.marketplaceIds[0] ?? null;
  if (marketplace) parts.push(`Place de marché ${marketplace}`);
  if (isPositiveAmount(line.marketplaceTax)) {
    parts.push(`Taxe collectée par eBay : ${line.marketplaceTax} ${order.currency ?? ''}`.trim());
  }
  return parts.join('\n');
}

/**
 * Construit les lignes de facture.
 * Le port devient une ligne distincte quand il est non nul, pour rester lisible.
 */
export function buildInvoiceLinesFromOrder(order: ExternalOrder): InvoiceLineValue[] {
  const lines: InvoiceLineValue[] = order.lines.map((line) => ({
    id: createLocalInvoiceLineId(),
    productId: null,
    title: cleanTitle(line.title),
    description: lineDescription(order, line),
    quantity: String(line.quantity),
    unit: 'unité',
    unitPrice: line.unitPrice,
    // TVA volontairement vide : INVEQ ne devine pas un taux eBay.
    vatRate: '',
    discountPercent: '0',
  }));

  if (isPositiveAmount(order.shippingAmount)) {
    lines.push({
      id: createLocalInvoiceLineId(),
      productId: null,
      title: 'Frais de livraison',
      description: 'Montant facturé par eBay pour la livraison de cette commande.',
      quantity: '1',
      unit: 'forfait',
      unitPrice: order.shippingAmount,
      vatRate: '',
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
    order.orderCreatedAt ? `Passée le ${new Date(order.orderCreatedAt).toLocaleDateString('fr-FR')}` : null,
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
    message:
      'Aucun taux de TVA n’a été appliqué automatiquement : INVEQ ne déduit pas la TVA d’une commande eBay. Renseignez le taux ligne par ligne avant validation.',
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
      message: 'Cette commande a fait l’objet d’un remboursement sur eBay. Vérifiez les montants avant de facturer.',
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

export function buildOrderInvoiceDraft(order: ExternalOrder): OrderInvoiceDraft {
  const warnings = collectOrderWarnings(order);
  return {
    lines: buildInvoiceLinesFromOrder(order),
    notes: buildOrderNotes(order),
    warnings,
    requiresAcknowledgement: warnings.some((warning) => warning.level === 'blocking'),
  };
}

/**
 * Somme des lignes proposées, en centimes.
 * Sert uniquement à signaler un écart avec le total eBay ; les totaux réels de
 * la facture restent calculés par le moteur existant.
 */
export function draftLinesTotalCents(lines: InvoiceLineValue[]): number {
  return lines.reduce((total, line) => {
    const unit = decimalStringToCents(line.unitPrice) ?? 0;
    const quantity = Number(line.quantity);
    return total + unit * (Number.isFinite(quantity) ? quantity : 0);
  }, 0);
}

/**
 * Écart entre le brouillon et le total eBay hors taxe marketplace.
 * Renvoie null si la comparaison n'a pas de sens (montants absents).
 */
export function draftTotalMismatch(order: ExternalOrder, lines: InvoiceLineValue[]): string | null {
  const orderTotal = decimalStringToCents(order.totalAmount);
  const marketplaceTax = decimalStringToCents(order.marketplaceTaxAmount) ?? 0;
  if (orderTotal === null) return null;

  const expected = orderTotal - marketplaceTax;
  const draft = draftLinesTotalCents(lines);
  const delta = draft - expected;
  return delta === 0 ? null : centsToDecimalString(delta);
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
