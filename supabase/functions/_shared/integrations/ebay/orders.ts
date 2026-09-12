/**
 * Client Sell Fulfillment API — lecture des commandes.
 *
 * Contraintes issues du contrat OpenAPI officiel eBay v1.20.0 :
 *   * `limit` : défaut 50, maximum 200 (au-delà, l'appel échoue).
 *   * `fieldGroups=TAX_BREAKDOWN` est indispensable : sans lui, les totaux
 *     n'incluent pas la taxe « Collect and Remit » collectée par eBay.
 *   * `creationdate` et `lastmodifieddate` ne sont pas combinables : si les
 *     deux sont fournis, eBay n'utilise que `creationdate`.
 *   * Les caractères [ ] { } | doivent être percent-encodés dans le filtre.
 *   * `getOrders` ne prend aucun en-tête : pas de X-EBAY-C-MARKETPLACE-ID.
 */

import type { EbayConfig } from './config.ts';

export const EBAY_MAX_LIMIT = 200;
/** Les PII acheteur disparaissent au-delà de 90 jours : inutile de remonter plus loin. */
export const EBAY_FIRST_SYNC_DAYS = 90;

export type EbayOrder = Record<string, unknown>;

export type EbayOrdersPage = {
  orders: EbayOrder[];
  total: number | null;
  next: string | null;
};

export class EbayApiError extends Error {
  readonly status: number;
  readonly requiresReauth: boolean;
  readonly rateLimited: boolean;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'EbayApiError';
    this.status = status;
    this.requiresReauth = status === 401;
    this.rateLimited = status === 429;
  }
}

/** eBay impose le percent-encoding de ces caractères dans la query string. */
export function encodeFilterValue(filter: string): string {
  return filter
    .replace(/\[/g, '%5B')
    .replace(/\]/g, '%5D')
    .replace(/\{/g, '%7B')
    .replace(/\}/g, '%7D')
    .replace(/\|/g, '%7C');
}

function toEbayTimestamp(value: Date): string {
  return value.toISOString().replace(/\.(\d{3})\d*Z$/, '.$1Z');
}

/**
 * Construit le filtre de synchronisation.
 * `since` absent → première synchronisation, bornée à 90 jours en arrière.
 */
export function buildSyncFilter(since: Date | null, now: Date = new Date()): string {
  if (since) {
    return `lastmodifieddate:[${toEbayTimestamp(since)}..]`;
  }
  const from = new Date(now.getTime() - EBAY_FIRST_SYNC_DAYS * 24 * 60 * 60 * 1000);
  return `creationdate:[${toEbayTimestamp(from)}..${toEbayTimestamp(now)}]`;
}

export function buildOrdersUrl(
  config: EbayConfig,
  options: { filter?: string | null; limit?: number; offset?: number },
): string {
  const limit = Math.min(Math.max(1, Math.floor(options.limit ?? EBAY_MAX_LIMIT)), EBAY_MAX_LIMIT);
  const offset = Math.max(0, Math.floor(options.offset ?? 0));

  const parts = [`fieldGroups=TAX_BREAKDOWN`, `limit=${limit}`, `offset=${offset}`];
  if (options.filter) {
    parts.push(`filter=${encodeFilterValue(options.filter)}`);
  }
  return `${config.apiBaseUrl}/sell/fulfillment/v1/order?${parts.join('&')}`;
}

export async function fetchOrdersPage(
  config: EbayConfig,
  accessToken: string,
  options: { filter?: string | null; limit?: number; offset?: number },
): Promise<EbayOrdersPage> {
  const response = await fetch(buildOrdersUrl(config, options), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    // On ne relaie que le code d'erreur eBay, jamais l'en-tête d'autorisation.
    throw new EbayApiError(
      `eBay getOrders a échoué (HTTP ${response.status})${detail ? ` : ${detail.slice(0, 300)}` : ''}`,
      response.status,
    );
  }

  const payload = (await response.json().catch(() => null)) as
    | { orders?: unknown; total?: unknown; next?: unknown }
    | null;

  return {
    orders: Array.isArray(payload?.orders) ? (payload.orders as EbayOrder[]) : [],
    total: typeof payload?.total === 'number' ? payload.total : null,
    next: typeof payload?.next === 'string' ? payload.next : null,
  };
}

/**
 * Parcourt toutes les pages, avec un plafond dur pour ne pas consommer
 * le quota d'appels en une seule exécution.
 */
export async function fetchAllOrders(
  config: EbayConfig,
  accessToken: string,
  filter: string | null,
  maxPages = 10,
): Promise<{ orders: EbayOrder[]; truncated: boolean; pages: number }> {
  const orders: EbayOrder[] = [];
  let offset = 0;
  let pages = 0;
  let truncated = false;

  for (;;) {
    const page = await fetchOrdersPage(config, accessToken, {
      filter,
      limit: EBAY_MAX_LIMIT,
      offset,
    });
    pages += 1;
    orders.push(...page.orders);

    if (!page.next || page.orders.length === 0) break;
    if (pages >= maxPages) {
      truncated = true;
      break;
    }
    offset += EBAY_MAX_LIMIT;
  }

  return { orders, truncated, pages };
}
