/**
 * OAuth eBay — Authorization Code Grant.
 *
 * Référence : contrat OpenAPI officiel eBay `sell_fulfillment` v1.20.0 et
 * client officiel `ebay-oauth-nodejs-client` (eBay Inc.).
 *
 * Aucun jeton n'est journalisé, même tronqué.
 */

import { EBAY_SCOPES, type EbayConfig } from './config.ts';

export type EbayTokenResponse = {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  refresh_token_expires_in?: number;
  token_type?: string;
};

export class EbayOAuthError extends Error {
  readonly status: number;
  /** true quand eBay indique que le refresh token n'est plus utilisable. */
  readonly requiresReauth: boolean;

  constructor(message: string, status: number, requiresReauth: boolean) {
    super(message);
    this.name = 'EbayOAuthError';
    this.status = status;
    this.requiresReauth = requiresReauth;
  }
}

/**
 * URL de consentement.
 * `redirect_uri` porte le RuName (valeur eBay), pas une URL : c'est le format
 * imposé par eBay pour l'Authorization Code Grant.
 */
export function buildAuthorizationUrl(
  config: EbayConfig,
  state: string,
  options: { prompt?: 'login' } = {},
): string {
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.ruName,
    response_type: 'code',
    scope: EBAY_SCOPES.join(' '),
    state,
  });
  if (options.prompt) {
    params.set('prompt', options.prompt);
  }
  return `${config.authorizeUrl}?${params.toString()}`;
}

function basicAuthHeader(config: EbayConfig): string {
  return `Basic ${btoa(`${config.clientId}:${config.clientSecret}`)}`;
}

async function postToken(config: EbayConfig, body: URLSearchParams): Promise<EbayTokenResponse> {
  const response = await fetch(config.tokenUrl, {
    method: 'POST',
    headers: {
      Authorization: basicAuthHeader(config),
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: body.toString(),
  });

  const payload = (await response.json().catch(() => null)) as
    | (EbayTokenResponse & { error?: string; error_description?: string })
    | null;

  if (!response.ok || !payload?.access_token) {
    const code = payload?.error ?? `http_${response.status}`;
    // `invalid_grant` = code ou refresh token périmé/révoqué → reconnexion requise.
    const requiresReauth = code === 'invalid_grant' || response.status === 401;
    throw new EbayOAuthError(
      `eBay OAuth refusé (${code}).`,
      response.status,
      requiresReauth,
    );
  }

  return payload;
}

export function exchangeAuthorizationCode(
  config: EbayConfig,
  code: string,
): Promise<EbayTokenResponse> {
  return postToken(
    config,
    new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: config.ruName,
    }),
  );
}

export function refreshAccessToken(
  config: EbayConfig,
  refreshToken: string,
): Promise<EbayTokenResponse> {
  return postToken(
    config,
    new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      scope: EBAY_SCOPES.join(' '),
    }),
  );
}

/**
 * Date d'expiration absolue à partir d'un `expires_in` relatif.
 * Plancher à 60 s pour ne jamais écrire une date déjà passée.
 */
export function expiryFromSeconds(seconds: unknown, now: number = Date.now()): string {
  const value = Number(seconds);
  const safe = Number.isFinite(value) && value > 0 ? Math.max(60, Math.floor(value)) : 60;
  return new Date(now + safe * 1000).toISOString();
}

/** Le jeton doit-il être rafraîchi ? Marge de 5 minutes. */
export function needsRefresh(expiresAt: string | null, now: number = Date.now()): boolean {
  if (!expiresAt) return true;
  const timestamp = new Date(expiresAt).getTime();
  if (!Number.isFinite(timestamp)) return true;
  return timestamp - 5 * 60 * 1000 <= now;
}

/** Le refresh token (≈18 mois chez eBay) est-il expiré ? */
export function refreshTokenExpired(expiresAt: string | null, now: number = Date.now()): boolean {
  if (!expiresAt) return false;
  const timestamp = new Date(expiresAt).getTime();
  if (!Number.isFinite(timestamp)) return false;
  return timestamp <= now;
}
