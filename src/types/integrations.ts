/** Types partagés des intégrations e-commerce (V1 : eBay). */

export type IntegrationProvider = 'ebay';

export type IntegrationEnvironment = 'sandbox' | 'production';

export type IntegrationStatus = 'connected' | 'disconnected' | 'reauth_required' | 'error';

/**
 * Projection publique de la vue `integration_status`.
 * Ne contient aucun jeton : la base ne les expose jamais au client.
 */
export type IntegrationSummary = {
  id: string;
  companyId: string;
  provider: IntegrationProvider;
  environment: IntegrationEnvironment;
  status: IntegrationStatus;
  externalAccountId: string | null;
  scopes: string[];
  connectedAt: string | null;
  lastSyncAt: string | null;
  lastSyncError: string | null;
  lastSyncedModifiedAt: string | null;
  refreshTokenExpiresAt: string | null;
  refreshTokenExpired: boolean;
  /** Compteurs réels calculés sur external_orders. Jamais de valeur simulée. */
  ordersImported: number;
  ordersPendingInvoice: number;
};

export type ExternalOrderAddress = {
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  postalCode: string | null;
  stateOrProvince: string | null;
  countryCode: string | null;
};

/**
 * Données acheteur figées à l'import.
 * eBay cesse de renvoyer l'e-mail au bout de 14 jours et le nom / la rue au
 * bout de 90 jours : ce snapshot est la seule source fiable après coup.
 */
export type ExternalOrderBuyer = {
  fullName: string | null;
  companyName: string | null;
  email: string | null;
  address: ExternalOrderAddress | null;
  capturedAt: string | null;
};

export type ExternalOrderLine = {
  externalLineId: string | null;
  title: string;
  sku: string | null;
  quantity: number;
  /** Chaîne décimale exacte, jamais un float. */
  unitPrice: string;
  lineTotal: string;
  marketplaceTax: string;
  quantityCollapsed: boolean;
  originalQuantity: number;
  marketplaceId: string | null;
};

export type ExternalOrder = {
  id: string;
  companyId: string;
  provider: IntegrationProvider;
  environment: IntegrationEnvironment;
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
  /** Taxe collectée ET reversée par la marketplace (eBay Collect & Remit). */
  marketplaceTaxAmount: string;
  collectAndRemit: boolean;
  buyerUsername: string | null;
  buyer: ExternalOrderBuyer;
  lines: ExternalOrderLine[];
  marketplaceIds: string[];
  invoiceId: string | null;
  invoicedAt: string | null;
  importedAt: string;
};

/** Statuts eBay réels, tels que renvoyés par l'API. Aucun statut inventé. */
export const EBAY_FULFILLMENT_STATUS_LABELS: Record<string, string> = {
  NOT_STARTED: 'Expédition non commencée',
  IN_PROGRESS: 'Expédition en cours',
  FULFILLED: 'Expédiée',
};

export const EBAY_PAYMENT_STATUS_LABELS: Record<string, string> = {
  PAID: 'Payée',
  PENDING: 'Paiement en attente',
  FAILED: 'Paiement échoué',
  PARTIALLY_REFUNDED: 'Partiellement remboursée',
  FULLY_REFUNDED: 'Intégralement remboursée',
};

export function describeFulfillmentStatus(value: string | null): string {
  if (!value) return '—';
  return EBAY_FULFILLMENT_STATUS_LABELS[value] ?? value;
}

export function describePaymentStatus(value: string | null): string {
  if (!value) return '—';
  return EBAY_PAYMENT_STATUS_LABELS[value] ?? value;
}
