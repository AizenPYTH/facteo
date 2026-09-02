import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

import { decryptSecret, encryptSecret } from './crypto.ts';
import {
  getCompaniesMe,
  getOauthSessionMe,
  refreshAccessToken,
  type SuperPdpCompany,
  type SuperPdpSession,
} from './client.ts';

export type ServiceClients = {
  userClient: SupabaseClient;
  serviceClient: SupabaseClient;
  userId: string;
};

export async function createAuthedClients(req: Request): Promise<ServiceClients> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !anonKey || !serviceKey) {
    throw new Error('Supabase configuration missing.');
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    throw new Error('Unauthorized.');
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const {
    data: { user },
    error,
  } = await userClient.auth.getUser();
  if (error || !user) {
    throw new Error('Unauthorized.');
  }

  const serviceClient = createClient(supabaseUrl, serviceKey);
  return { userClient, serviceClient, userId: user.id };
}

export async function assertCompanyAccess(
  serviceClient: SupabaseClient,
  userId: string,
  companyId: string,
): Promise<void> {
  const { data, error } = await serviceClient
    .from('company_members')
    .select('id')
    .eq('company_id', companyId)
    .eq('user_id', userId)
    .maybeSingle();
  if (error || !data) {
    throw new Error('Forbidden company access.');
  }
}

export function resolveCompanyId(req: Request, bodyCompanyId?: string | null): string | null {
  const header = req.headers.get('x-inveq-company-id')?.trim();
  return header || bodyCompanyId || null;
}

export type ConnectionRow = {
  id: string;
  company_id: string;
  status: string;
  remote_company_id: number | null;
  remote_company_number: string | null;
  remote_company_name: string | null;
  remote_env: string | null;
  company_verification_status: string | null;
  access_token_encrypted: string;
  refresh_token_encrypted: string;
  token_expires_at: string;
  scopes: string[] | null;
  directory_registered: boolean | null;
  emission_enabled: boolean;
  reception_enabled: boolean;
  connected_at: string | null;
  last_sync_at: string | null;
  last_error: string | null;
};

export function toPublicConnection(row: Partial<ConnectionRow> | null) {
  if (!row) return null;
  return {
    id: row.id,
    company_id: row.company_id,
    status: row.status,
    remote_company_id: row.remote_company_id,
    remote_company_number: row.remote_company_number,
    remote_company_name: row.remote_company_name,
    remote_env: row.remote_env,
    company_verification_status: row.company_verification_status,
    scopes: row.scopes ?? [],
    directory_registered: row.directory_registered,
    emission_enabled: row.emission_enabled,
    reception_enabled: row.reception_enabled,
    connected_at: row.connected_at,
    last_sync_at: row.last_sync_at,
    last_error: row.last_error,
    token_expires_at: row.token_expires_at,
  };
}

export async function loadConnection(
  serviceClient: SupabaseClient,
  companyId: string,
): Promise<ConnectionRow | null> {
  const { data, error } = await serviceClient
    .from('company_superpdp_connections')
    .select('*')
    .eq('company_id', companyId)
    .maybeSingle();
  if (error) throw new Error('Unable to load SUPER PDP connection.');
  return (data as ConnectionRow | null) ?? null;
}

/**
 * Returns a valid access token for the company. Rotating refresh tokens are persisted immediately.
 */
export async function getValidAccessToken(
  serviceClient: SupabaseClient,
  connection: ConnectionRow,
): Promise<string> {
  const expiresAt = new Date(connection.token_expires_at).getTime();
  const skewMs = 60_000;
  if (Number.isFinite(expiresAt) && expiresAt - skewMs > Date.now()) {
    return decryptSecret(connection.access_token_encrypted);
  }

  const refreshToken = await decryptSecret(connection.refresh_token_encrypted);
  const tokens = await refreshAccessToken(refreshToken);
  if (!tokens.refresh_token) {
    throw new Error('SUPER PDP refresh did not return a new refresh_token (OAuth 2.1 rotation).');
  }

  const accessEnc = await encryptSecret(tokens.access_token);
  const refreshEnc = await encryptSecret(tokens.refresh_token);
  const tokenExpiresAt = new Date(
    Date.now() + Math.max(60, Number(tokens.expires_in ?? 3600)) * 1000,
  ).toISOString();

  const { error } = await serviceClient
    .from('company_superpdp_connections')
    .update({
      access_token_encrypted: accessEnc,
      refresh_token_encrypted: refreshEnc,
      token_expires_at: tokenExpiresAt,
      updated_at: new Date().toISOString(),
      last_error: null,
    })
    .eq('id', connection.id);

  if (error) {
    throw new Error('Unable to persist refreshed SUPER PDP tokens.');
  }

  connection.access_token_encrypted = accessEnc;
  connection.refresh_token_encrypted = refreshEnc;
  connection.token_expires_at = tokenExpiresAt;
  return tokens.access_token;
}

export async function upsertConnectionFromTokens(
  serviceClient: SupabaseClient,
  companyId: string,
  tokens: { access_token: string; refresh_token?: string; expires_in?: number; scope?: string },
  meta: { company: SuperPdpCompany; session: SuperPdpSession; directoryRegistered: boolean | null },
): Promise<ConnectionRow> {
  if (!tokens.refresh_token) {
    throw new Error('OAuth response missing refresh_token.');
  }

  const accessEnc = await encryptSecret(tokens.access_token);
  const refreshEnc = await encryptSecret(tokens.refresh_token);
  const tokenExpiresAt = new Date(
    Date.now() + Math.max(60, Number(tokens.expires_in ?? 3600)) * 1000,
  ).toISOString();

  const status =
    meta.session.company_verification_status === 'verified'
      ? 'connected'
      : meta.session.company_verification_status === 'needs_review'
        ? 'needs_review'
        : 'failed';

  const row = {
    company_id: companyId,
    status,
    remote_company_id: meta.company.id,
    remote_company_number: meta.company.number,
    remote_company_name: meta.company.formal_name || meta.company.trade_name,
    remote_env: meta.company.env,
    company_verification_status: meta.session.company_verification_status,
    access_token_encrypted: accessEnc,
    refresh_token_encrypted: refreshEnc,
    token_expires_at: tokenExpiresAt,
    scopes: tokens.scope ? tokens.scope.split(' ').filter(Boolean) : [],
    directory_registered: meta.directoryRegistered,
    emission_enabled: true,
    reception_enabled: true,
    connected_at: new Date().toISOString(),
    last_error: null,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await serviceClient
    .from('company_superpdp_connections')
    .upsert(row, { onConflict: 'company_id' })
    .select('*')
    .single();

  if (error || !data) {
    throw new Error('Unable to store SUPER PDP connection.');
  }
  return data as ConnectionRow;
}

export async function fetchConnectionMeta(accessToken: string): Promise<{
  company: SuperPdpCompany;
  session: SuperPdpSession;
  directoryRegistered: boolean | null;
}> {
  const [company, session] = await Promise.all([
    getCompaniesMe(accessToken),
    getOauthSessionMe(accessToken),
  ]);

  let directoryRegistered: boolean | null = null;
  try {
    const { listDirectoryEntries } = await import('./client.ts');
    const entries = await listDirectoryEntries(accessToken);
    directoryRegistered = (entries.data?.length ?? 0) > 0;
  } catch {
    directoryRegistered = null;
  }

  return { company, session, directoryRegistered };
}

export function randomState(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export function siteSuccessRedirect(params: Record<string, string>): string {
  const base =
    Deno.env.get('SUPER_PDP_SUCCESS_REDIRECT_URL')?.trim() ||
    Deno.env.get('INVEQ_SITE_URL')?.trim() ||
    'https://www.inveq.fr/app/settings/e-invoicing';
  const url = new URL(base);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return url.toString();
}
