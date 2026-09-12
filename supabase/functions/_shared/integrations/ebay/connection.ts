/**
 * Persistance de la connexion eBay : chiffrement, rafraîchissement, statut.
 *
 * Aucun jeton n'est renvoyé à l'appelant HTTP, ni écrit dans un log.
 */

import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

import { decryptSecret, encryptSecret } from '../crypto.ts';
import { EBAY_PROVIDER, EBAY_SCOPES, loadEbayConfig, type EbayEnvironment } from './config.ts';
import {
  EbayOAuthError,
  expiryFromSeconds,
  needsRefresh,
  refreshAccessToken,
  refreshTokenExpired,
  type EbayTokenResponse,
} from './oauth.ts';

export { EBAY_PROVIDER };

export type IntegrationRow = {
  id: string;
  company_id: string;
  provider: string;
  environment: EbayEnvironment;
  status: 'connected' | 'disconnected' | 'reauth_required' | 'error';
  external_account_id: string | null;
  scopes: string[];
  access_token_encrypted: string | null;
  access_token_expires_at: string | null;
  refresh_token_encrypted: string | null;
  refresh_token_expires_at: string | null;
  connected_at: string | null;
  last_sync_at: string | null;
  last_sync_error: string | null;
  last_synced_modified_at: string | null;
};

export class IntegrationError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(message: string, status: number, code: string) {
    super(message);
    this.name = 'IntegrationError';
    this.status = status;
    this.code = code;
  }
}

export async function loadIntegration(
  serviceClient: SupabaseClient,
  companyId: string,
): Promise<IntegrationRow | null> {
  const { data, error } = await serviceClient
    .from('integrations')
    .select('*')
    .eq('company_id', companyId)
    .eq('provider', EBAY_PROVIDER)
    .maybeSingle();
  if (error) {
    throw new IntegrationError('Lecture de l’intégration impossible.', 500, 'load_failed');
  }
  return (data as IntegrationRow | null) ?? null;
}

export async function upsertFromTokens(
  serviceClient: SupabaseClient,
  params: {
    companyId: string;
    userId: string;
    environment: EbayEnvironment;
    tokens: EbayTokenResponse;
  },
): Promise<IntegrationRow> {
  const { tokens } = params;
  if (!tokens.refresh_token) {
    throw new IntegrationError(
      'eBay n’a pas renvoyé de refresh_token.',
      502,
      'missing_refresh_token',
    );
  }

  const now = Date.now();
  const row = {
    company_id: params.companyId,
    provider: EBAY_PROVIDER,
    environment: params.environment,
    status: 'connected' as const,
    scopes: EBAY_SCOPES,
    access_token_encrypted: await encryptSecret(tokens.access_token),
    access_token_expires_at: expiryFromSeconds(tokens.expires_in, now),
    refresh_token_encrypted: await encryptSecret(tokens.refresh_token),
    refresh_token_expires_at: expiryFromSeconds(tokens.refresh_token_expires_in, now),
    connected_at: new Date(now).toISOString(),
    connected_by: params.userId,
    last_sync_error: null,
    updated_at: new Date(now).toISOString(),
  };

  const { data, error } = await serviceClient
    .from('integrations')
    .upsert(row, { onConflict: 'company_id,provider' })
    .select('*')
    .single();

  if (error || !data) {
    throw new IntegrationError('Enregistrement de la connexion impossible.', 500, 'upsert_failed');
  }
  return data as IntegrationRow;
}

export async function markStatus(
  serviceClient: SupabaseClient,
  integrationId: string,
  patch: Partial<
    Pick<
      IntegrationRow,
      'status' | 'last_sync_at' | 'last_sync_error' | 'last_synced_modified_at' | 'external_account_id'
    >
  >,
): Promise<void> {
  await serviceClient
    .from('integrations')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', integrationId);
}

/**
 * Renvoie un access token valide, en rafraîchissant si nécessaire.
 * La rotation est persistée immédiatement (chiffrée) avant tout appel API.
 */
export async function getValidAccessToken(
  serviceClient: SupabaseClient,
  integration: IntegrationRow,
  now: number = Date.now(),
): Promise<string> {
  if (integration.status === 'disconnected' || !integration.refresh_token_encrypted) {
    throw new IntegrationError('Compte eBay non connecté.', 409, 'not_connected');
  }

  if (refreshTokenExpired(integration.refresh_token_expires_at, now)) {
    await markStatus(serviceClient, integration.id, {
      status: 'reauth_required',
      last_sync_error: 'L’autorisation eBay a expiré. Reconnectez le compte.',
    });
    throw new IntegrationError(
      'L’autorisation eBay a expiré. Reconnectez le compte.',
      401,
      'reauth_required',
    );
  }

  if (integration.access_token_encrypted && !needsRefresh(integration.access_token_expires_at, now)) {
    return decryptSecret(integration.access_token_encrypted);
  }

  const config = loadEbayConfig(integration.environment);
  const refreshToken = await decryptSecret(integration.refresh_token_encrypted);

  let tokens: EbayTokenResponse;
  try {
    tokens = await refreshAccessToken(config, refreshToken);
  } catch (error) {
    const requiresReauth = error instanceof EbayOAuthError && error.requiresReauth;
    await markStatus(serviceClient, integration.id, {
      status: requiresReauth ? 'reauth_required' : 'error',
      last_sync_error: requiresReauth
        ? 'L’autorisation eBay n’est plus valide. Reconnectez le compte.'
        : 'Le rafraîchissement du jeton eBay a échoué.',
    });
    throw new IntegrationError(
      requiresReauth
        ? 'L’autorisation eBay n’est plus valide. Reconnectez le compte.'
        : 'Le rafraîchissement du jeton eBay a échoué.',
      requiresReauth ? 401 : 502,
      requiresReauth ? 'reauth_required' : 'refresh_failed',
    );
  }

  const patch: Record<string, unknown> = {
    access_token_encrypted: await encryptSecret(tokens.access_token),
    access_token_expires_at: expiryFromSeconds(tokens.expires_in, now),
    status: 'connected',
    last_sync_error: null,
    updated_at: new Date(now).toISOString(),
  };

  // eBay peut renvoyer un nouveau refresh token : on l'enregistre s'il arrive.
  if (tokens.refresh_token) {
    patch.refresh_token_encrypted = await encryptSecret(tokens.refresh_token);
    patch.refresh_token_expires_at = expiryFromSeconds(tokens.refresh_token_expires_in, now);
  }

  const { error } = await serviceClient.from('integrations').update(patch).eq('id', integration.id);
  if (error) {
    throw new IntegrationError(
      'Impossible d’enregistrer le jeton eBay rafraîchi.',
      500,
      'persist_failed',
    );
  }

  integration.access_token_encrypted = patch.access_token_encrypted as string;
  integration.access_token_expires_at = patch.access_token_expires_at as string;
  integration.status = 'connected';

  return tokens.access_token;
}
