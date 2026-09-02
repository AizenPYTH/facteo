import { supabase } from '@/lib/supabase';

export type SuperPdpConnectionPublic = {
  id: string;
  company_id: string;
  status: 'pending' | 'connected' | 'needs_review' | 'failed' | 'disconnected' | string;
  remote_company_id: number | null;
  remote_company_number: string | null;
  remote_company_name: string | null;
  remote_env: 'sandbox' | 'production' | string | null;
  company_verification_status: 'verified' | 'needs_review' | 'failed' | string | null;
  scopes: string[];
  directory_registered: boolean | null;
  emission_enabled: boolean;
  reception_enabled: boolean;
  connected_at: string | null;
  last_sync_at: string | null;
  last_error: string | null;
  token_expires_at?: string | null;
};

async function callSuperPdpFunction<T>(
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
    | { error?: string; message?: string }
    | null;

  if (!response.ok) {
    throw new Error(body?.error || body?.message || fallbackError);
  }
  return body as T;
}

export function startSuperPdpOAuth(companyId: string, redirectTo?: string) {
  return callSuperPdpFunction<{ authorizationUrl: string; expiresAt: string; companyId: string }>(
    'superpdp-oauth-authorize',
    { companyId, redirectTo },
    'Impossible de démarrer la connexion SUPER PDP.',
  );
}

export function getSuperPdpConnection(companyId: string, action: 'status' | 'verify' = 'status') {
  return callSuperPdpFunction<{
    connected: boolean;
    connection: SuperPdpConnectionPublic | null;
    verifyError?: string;
  }>('superpdp-connection', { companyId, action }, 'Impossible de lire la connexion SUPER PDP.');
}

export function disconnectSuperPdp(companyId: string) {
  return callSuperPdpFunction<{ disconnected: boolean }>(
    'superpdp-disconnect',
    { companyId },
    'Impossible de déconnecter SUPER PDP.',
  );
}

export function lookupSuperPdpDirectory(companyId: string, siren: string, clientId?: string) {
  return callSuperPdpFunction<{
    siren: string;
    isRegistered: boolean;
    compatible: boolean;
    message: string;
    identifiers: string[];
  }>('superpdp-directory-lookup', { companyId, siren, clientId }, 'Recherche annuaire impossible.');
}

export function sendElectronicInvoice(companyId: string, invoiceId: string) {
  return callSuperPdpFunction<{
    idempotent: boolean;
    superpdpInvoiceId: number;
    electronicInvoiceStatus: string;
    message?: string;
  }>('superpdp-send-invoice', { companyId, invoiceId }, 'Envoi électronique impossible.');
}

export function syncSuperPdp(companyId: string, mode: 'out' | 'in' | 'both' = 'both') {
  return callSuperPdpFunction<{
    ok: boolean;
    updatedOutgoing: number;
    upsertedIncoming: number;
    lastSyncAt: string;
  }>('superpdp-sync', { companyId, mode }, 'Synchronisation SUPER PDP impossible.');
}
