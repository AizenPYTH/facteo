/**
 * Accès client à l'intégration eBay.
 *
 * Aucun secret eBay ne transite ici : l'application ne connaît ni le
 * client_id, ni le client_secret, ni le RuName, ni aucun jeton. Elle demande
 * une URL d'autorisation à l'Edge Function et lit une vue sans secret.
 */

import { supabase } from '@/lib/supabase';
import { logSupabaseError } from '@/lib/supabase/errors';
import type {
  ExternalOrder,
  ExternalOrderBuyer,
  ExternalOrderLine,
  IntegrationEnvironment,
  IntegrationSummary,
} from '@/types/integrations';
import type { DataScope } from '@/types/tenant';

export const EBAY_PROVIDER = 'ebay' as const;

export type EbaySyncResult = {
  imported: number;
  updated: number;
  fetched: number;
  pages: number;
  truncated: boolean;
  lastSyncAt: string;
  environment: IntegrationEnvironment;
};

async function callEdgeFunction<T>(
  functionName: string,
  payload: Record<string, unknown>,
  fallbackError: string,
): Promise<T> {
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;
  if (!accessToken) {
    throw new Error('Session expirée. Reconnectez-vous.');
  }

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
  if (!supabaseUrl) {
    throw new Error('Supabase non configuré.');
  }

  const companyId = typeof payload.companyId === 'string' ? payload.companyId : undefined;
  const response = await fetch(`${supabaseUrl.replace(/\/$/, '')}/functions/v1/${functionName}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...(companyId ? { 'x-inveq-company-id': companyId } : {}),
    },
    body: JSON.stringify(payload),
  });

  const body = (await response.json().catch(() => null)) as
    | (T & { error?: string; message?: string })
    | null;

  if (!response.ok) {
    throw new Error(body?.error || body?.message || fallbackError);
  }
  return body as T;
}

export function startEbayOAuth(
  companyId: string,
  options: {
    environment?: IntegrationEnvironment;
    redirectTo?: string;
    platform?: 'web' | 'native';
  } = {},
) {
  return callEdgeFunction<{
    authorizationUrl: string;
    expiresAt: string;
    environment: IntegrationEnvironment;
  }>(
    'ebay-oauth-start',
    {
      companyId,
      environment: options.environment,
      // Sur mobile, la cible de retour est résolue côté serveur : on n'envoie
      // aucune URL, seulement l'information « application native ».
      platform: options.platform,
      redirectTo: options.platform === 'native' ? undefined : options.redirectTo,
    },
    'Impossible de démarrer la connexion eBay.',
  );
}

export function syncEbayOrders(companyId: string) {
  return callEdgeFunction<EbaySyncResult>(
    'ebay-sync-orders',
    { companyId },
    'Synchronisation eBay impossible.',
  );
}

export async function disconnectEbay(companyId: string): Promise<void> {
  const { error } = await supabase.rpc('disconnect_integration', {
    p_company_id: companyId,
    p_provider: EBAY_PROVIDER,
  });
  if (error) {
    logSupabaseError('disconnectEbay', error);
    throw new Error('Déconnexion eBay impossible.');
  }
}

/** Rattache une facture à une commande. La base refuse tout second rattachement. */
export async function linkOrderToInvoice(externalOrderId: string, invoiceId: string): Promise<void> {
  const { error } = await supabase.rpc('link_external_order_invoice', {
    p_external_order_id: externalOrderId,
    p_invoice_id: invoiceId,
  });
  if (error) {
    logSupabaseError('linkOrderToInvoice', error);
    if (error.message?.includes('external_order_already_invoiced')) {
      throw new Error('Cette commande eBay est déjà rattachée à une facture.');
    }
    throw new Error('Impossible de rattacher la commande à la facture.');
  }
}

const INTEGRATION_STATUS_COLUMNS =
  'id, company_id, provider, environment, status, external_account_id, scopes, connected_at, last_sync_at, last_sync_error, last_synced_modified_at, refresh_token_expires_at, refresh_token_expired, orders_imported, orders_pending_invoice' as const;

export async function fetchEbayIntegration(companyId: string): Promise<IntegrationSummary | null> {
  const { data, error } = await supabase
    .from('integration_status')
    .select(INTEGRATION_STATUS_COLUMNS)
    .eq('company_id', companyId)
    .eq('provider', EBAY_PROVIDER)
    .maybeSingle();

  if (error) {
    logSupabaseError('fetchEbayIntegration', error);
    throw new Error('Impossible de lire l’état de la connexion eBay.');
  }
  return data ? mapIntegrationRow(data as Record<string, unknown>) : null;
}

const EXTERNAL_ORDER_COLUMNS =
  'id, company_id, provider, environment, external_order_id, legacy_order_id, order_reference, order_created_at, order_modified_at, fulfillment_status, payment_status, currency, subtotal_amount, shipping_amount, discount_amount, tax_amount, total_amount, marketplace_tax_amount, collect_and_remit, buyer_username, buyer_snapshot, line_items, marketplace_ids, invoice_id, invoiced_at, imported_at' as const;

export type ExternalOrderFilter = 'all' | 'pending' | 'invoiced';

export async function fetchEbayOrders(
  scope: DataScope,
  filter: ExternalOrderFilter = 'all',
  limit = 100,
): Promise<ExternalOrder[]> {
  let query = supabase
    .from('external_orders')
    .select(EXTERNAL_ORDER_COLUMNS)
    .eq('company_id', scope.companyId)
    .eq('provider', EBAY_PROVIDER)
    .order('order_created_at', { ascending: false, nullsFirst: false })
    .limit(limit);

  if (filter === 'pending') query = query.is('invoice_id', null);
  if (filter === 'invoiced') query = query.not('invoice_id', 'is', null);

  const { data, error } = await query;
  if (error) {
    logSupabaseError('fetchEbayOrders', error);
    throw new Error('Impossible de charger les commandes eBay.');
  }
  return (data ?? []).map((row) => mapExternalOrderRow(row as Record<string, unknown>));
}

export async function fetchEbayOrderById(
  scope: DataScope,
  orderId: string,
): Promise<ExternalOrder | null> {
  const { data, error } = await supabase
    .from('external_orders')
    .select(EXTERNAL_ORDER_COLUMNS)
    .eq('company_id', scope.companyId)
    .eq('id', orderId)
    .maybeSingle();

  if (error) {
    logSupabaseError('fetchEbayOrderById', error);
    throw new Error('Impossible de charger la commande eBay.');
  }
  return data ? mapExternalOrderRow(data as Record<string, unknown>) : null;
}

// ---------------------------------------------------------------------------
// Mappers ligne base → domaine
// ---------------------------------------------------------------------------

function text(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null;
}

function decimal(value: unknown): string {
  if (typeof value === 'string' && value.trim()) return value;
  if (typeof value === 'number' && Number.isFinite(value)) return value.toFixed(2);
  return '0.00';
}

export function mapIntegrationRow(row: Record<string, unknown>): IntegrationSummary {
  return {
    id: String(row.id),
    companyId: String(row.company_id),
    provider: EBAY_PROVIDER,
    environment: row.environment === 'sandbox' ? 'sandbox' : 'production',
    status:
      row.status === 'connected' ||
      row.status === 'reauth_required' ||
      row.status === 'error' ||
      row.status === 'disconnected'
        ? row.status
        : 'disconnected',
    externalAccountId: text(row.external_account_id),
    scopes: Array.isArray(row.scopes) ? (row.scopes as string[]) : [],
    connectedAt: text(row.connected_at),
    lastSyncAt: text(row.last_sync_at),
    lastSyncError: text(row.last_sync_error),
    lastSyncedModifiedAt: text(row.last_synced_modified_at),
    refreshTokenExpiresAt: text(row.refresh_token_expires_at),
    refreshTokenExpired: row.refresh_token_expired === true,
    ordersImported: Number(row.orders_imported ?? 0) || 0,
    ordersPendingInvoice: Number(row.orders_pending_invoice ?? 0) || 0,
  };
}

function mapBuyer(value: unknown): ExternalOrderBuyer {
  const snapshot = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>;
  const address = snapshot.address as Record<string, unknown> | null | undefined;
  return {
    fullName: text(snapshot.fullName),
    companyName: text(snapshot.companyName),
    email: text(snapshot.email),
    capturedAt: text(snapshot.capturedAt),
    address: address
      ? {
          addressLine1: text(address.addressLine1),
          addressLine2: text(address.addressLine2),
          city: text(address.city),
          postalCode: text(address.postalCode),
          stateOrProvince: text(address.stateOrProvince),
          countryCode: text(address.countryCode),
        }
      : null,
  };
}

function mapLines(value: unknown): ExternalOrderLine[] {
  if (!Array.isArray(value)) return [];
  return value.map((entry) => {
    const line = (entry && typeof entry === 'object' ? entry : {}) as Record<string, unknown>;
    const quantity = Number(line.quantity);
    const originalQuantity = Number(line.originalQuantity);
    return {
      externalLineId: text(line.externalLineId),
      title: text(line.title) ?? 'Article eBay',
      sku: text(line.sku),
      quantity: Number.isInteger(quantity) && quantity > 0 ? quantity : 1,
      unitPrice: decimal(line.unitPrice),
      lineTotal: decimal(line.lineTotal),
      marketplaceTax: decimal(line.marketplaceTax),
      quantityCollapsed: line.quantityCollapsed === true,
      originalQuantity:
        Number.isInteger(originalQuantity) && originalQuantity > 0 ? originalQuantity : 1,
      marketplaceId: text(line.marketplaceId),
    };
  });
}

export function mapExternalOrderRow(row: Record<string, unknown>): ExternalOrder {
  return {
    id: String(row.id),
    companyId: String(row.company_id),
    provider: EBAY_PROVIDER,
    environment: row.environment === 'sandbox' ? 'sandbox' : 'production',
    externalOrderId: String(row.external_order_id),
    legacyOrderId: text(row.legacy_order_id),
    orderReference: text(row.order_reference),
    orderCreatedAt: text(row.order_created_at),
    orderModifiedAt: text(row.order_modified_at),
    fulfillmentStatus: text(row.fulfillment_status),
    paymentStatus: text(row.payment_status),
    currency: text(row.currency),
    subtotalAmount: decimal(row.subtotal_amount),
    shippingAmount: decimal(row.shipping_amount),
    discountAmount: decimal(row.discount_amount),
    taxAmount: decimal(row.tax_amount),
    totalAmount: decimal(row.total_amount),
    marketplaceTaxAmount: decimal(row.marketplace_tax_amount),
    collectAndRemit: row.collect_and_remit === true,
    buyerUsername: text(row.buyer_username),
    buyer: mapBuyer(row.buyer_snapshot),
    lines: mapLines(row.line_items),
    marketplaceIds: Array.isArray(row.marketplace_ids) ? (row.marketplace_ids as string[]) : [],
    invoiceId: text(row.invoice_id),
    invoicedAt: text(row.invoiced_at),
    importedAt: text(row.imported_at) ?? new Date(0).toISOString(),
  };
}
