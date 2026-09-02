/**
 * Official SUPER PDP API client helpers.
 * Base URL and endpoints from https://api.superpdp.tech/openapi/superpdp.json (v1.30.0.beta).
 * Do not invent endpoints.
 */

export const SUPERPDP_API_BASE =
  Deno.env.get('SUPER_PDP_API_BASE_URL')?.replace(/\/$/, '') || 'https://api.superpdp.tech';

export type SuperPdpTokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  scope?: string;
};

export type SuperPdpCompany = {
  id: number;
  number: string;
  number_scheme: string;
  formal_name: string;
  trade_name: string;
  env: 'sandbox' | 'production';
  address?: string;
  postcode?: string;
  city?: string;
  country?: string;
  vat_regime?: string;
  has_vat_on_debits?: boolean;
};

export type SuperPdpSession = {
  client_id: string;
  created_at: string;
  company_verification_status: 'verified' | 'needs_review' | 'failed';
  user_identity_verification_status?: string;
};

export type FrenchDirectoryEntry = {
  identifier: string;
  is_active: boolean;
  company: {
    number: string;
    formal_name: string;
    address: string;
    postcode: string;
    city: string;
    country: string;
  };
};

function requireOAuthAppConfig() {
  const clientId = Deno.env.get('SUPER_PDP_CLIENT_ID')?.trim();
  const clientSecret = Deno.env.get('SUPER_PDP_CLIENT_SECRET')?.trim();
  const redirectUri = Deno.env.get('SUPER_PDP_REDIRECT_URI')?.trim();
  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error('SUPER PDP OAuth app is not configured on the server.');
  }
  return { clientId, clientSecret, redirectUri };
}

export function buildAuthorizationUrl(params: {
  state: string;
  loginHint?: string | null;
  companyNumber?: string | null;
  companyNumberScheme?: 'sandbox' | 'fr_siren' | 'be_numero_entreprise' | null;
}): string {
  const { clientId, redirectUri } = requireOAuthAppConfig();
  const url = new URL(`${SUPERPDP_API_BASE}/oauth2/authorize`);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('state', params.state);
  // Official OpenAPI: scopes object is empty — omit scope unless SUPER PDP documents one later.
  if (params.loginHint) url.searchParams.set('login_hint', params.loginHint);
  if (params.companyNumber && params.companyNumberScheme) {
    url.searchParams.set('superpdp_company_number', params.companyNumber);
    url.searchParams.set('superpdp_company_number_scheme', params.companyNumberScheme);
  }
  return url.toString();
}

export async function exchangeAuthorizationCode(code: string): Promise<SuperPdpTokenResponse> {
  const { clientId, clientSecret, redirectUri } = requireOAuthAppConfig();
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    client_id: clientId,
    client_secret: clientSecret,
  });
  return postToken(body);
}

export async function refreshAccessToken(refreshToken: string): Promise<SuperPdpTokenResponse> {
  const { clientId, clientSecret } = requireOAuthAppConfig();
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
  });
  return postToken(body);
}

async function postToken(body: URLSearchParams): Promise<SuperPdpTokenResponse> {
  const response = await fetch(`${SUPERPDP_API_BASE}/oauth2/token`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    // Never echo client_secret or tokens.
    const message =
      typeof payload?.error_description === 'string'
        ? payload.error_description
        : typeof payload?.error === 'string'
          ? payload.error
          : 'OAuth token exchange failed.';
    throw new Error(message);
  }
  if (!payload?.access_token || typeof payload.access_token !== 'string') {
    throw new Error('OAuth token response missing access_token.');
  }
  return payload as SuperPdpTokenResponse;
}

export async function superPdpFetch<T>(
  accessToken: string,
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const url = path.startsWith('http') ? path : `${SUPERPDP_API_BASE}${path}`;
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${accessToken}`);
  if (!headers.has('Accept')) headers.set('Accept', 'application/json');
  const response = await fetch(url, { ...init, headers });
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    let message = `SUPER PDP API error (${response.status}).`;
    try {
      const json = JSON.parse(text);
      if (typeof json?.message === 'string') message = json.message;
      else if (typeof json?.error === 'string') message = json.error;
    } catch {
      // keep generic message — do not forward raw bodies that may contain secrets
    }
    const error = new Error(message) as Error & { status?: number };
    error.status = response.status;
    throw error;
  }
  if (response.status === 204) return undefined as T;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return (await response.json()) as T;
  }
  return (await response.arrayBuffer()) as T;
}

export async function getCompaniesMe(accessToken: string): Promise<SuperPdpCompany> {
  return superPdpFetch<SuperPdpCompany>(accessToken, '/v1.beta/companies/me');
}

export async function getOauthSessionMe(accessToken: string): Promise<SuperPdpSession> {
  return superPdpFetch<SuperPdpSession>(accessToken, '/v1.beta/oauth2_sessions/me');
}

export async function listFrenchDirectoryEntries(siren: string): Promise<FrenchDirectoryEntry[]> {
  // Official OpenAPI marks this route as public (security: []).
  const url = new URL(`${SUPERPDP_API_BASE}/v1.beta/french_directory/entries`);
  url.searchParams.set('number', siren);
  const response = await fetch(url.toString(), { headers: { Accept: 'application/json' } });
  if (!response.ok) {
    throw new Error(`Annuaire SUPER PDP indisponible (${response.status}).`);
  }
  const payload = (await response.json()) as { data?: FrenchDirectoryEntry[] };
  return payload.data ?? [];
}

export async function convertInvoice(
  from: 'en16931' | 'cii' | 'ubl' | 'factur-x',
  to: 'en16931' | 'cii' | 'ubl' | 'factur-x',
  body: unknown,
  contentType = 'application/json',
): Promise<ArrayBuffer | Record<string, unknown>> {
  const url = `${SUPERPDP_API_BASE}/v1.beta/invoices/convert?from=${from}&to=${to}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Accept: to === 'en16931' ? 'application/json' : 'application/xml',
      'Content-Type': contentType,
    },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`Conversion facture SUPER PDP échouée (${response.status}).`);
  }
  const ct = response.headers.get('content-type') || '';
  if (ct.includes('application/json')) return await response.json();
  return await response.arrayBuffer();
}

export async function createInvoice(
  accessToken: string,
  xmlOrPdf: ArrayBuffer | Uint8Array,
  options: {
    contentType: 'application/xml' | 'application/pdf';
    externalId: string;
    disablePreCheck?: boolean;
    processingRule?: string;
  },
): Promise<{ id: number; company_id: number; created_at: string; direction?: string; external_id?: string }> {
  const url = new URL(`${SUPERPDP_API_BASE}/v1.beta/invoices`);
  url.searchParams.set('external_id', options.externalId.slice(0, 36));
  if (options.disablePreCheck) url.searchParams.set('disable_pre_check', 'true');
  if (options.processingRule) url.searchParams.set('processing_rule', options.processingRule);

  return superPdpFetch(accessToken, url.toString(), {
    method: 'POST',
    headers: { 'Content-Type': options.contentType, Accept: 'application/json' },
    body: xmlOrPdf instanceof Uint8Array ? xmlOrPdf : new Uint8Array(xmlOrPdf),
  });
}

export async function listInvoices(
  accessToken: string,
  query: Record<string, string | number | undefined>,
): Promise<{ data: Array<Record<string, unknown>>; has_after?: boolean; count?: number }> {
  const url = new URL(`${SUPERPDP_API_BASE}/v1.beta/invoices`);
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined || v === null || v === '') continue;
    url.searchParams.set(k, String(v));
  }
  return superPdpFetch(accessToken, url.toString());
}

export async function listInvoiceEvents(
  accessToken: string,
  invoiceId: number,
): Promise<{ data: Array<{ id: number; invoice_id: number; status_code: string; status_text?: string; created_at: string }> }> {
  const url = new URL(`${SUPERPDP_API_BASE}/v1.beta/invoice_events`);
  url.searchParams.set('invoice_id', String(invoiceId));
  return superPdpFetch(accessToken, url.toString());
}

export async function listDirectoryEntries(
  accessToken: string,
): Promise<{ data: Array<Record<string, unknown>> }> {
  return superPdpFetch(accessToken, '/v1.beta/directory_entries');
}
