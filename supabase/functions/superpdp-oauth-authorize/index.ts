import { corsHeaders, jsonResponse } from '../_shared/http.ts';
import {
  assertCompanyAccess,
  createAuthedClients,
  randomState,
  resolveCompanyId,
} from '../_shared/superpdp/auth.ts';
import { buildAuthorizationUrl } from '../_shared/superpdp/client.ts';

/**
 * POST { companyId?: string, redirectTo?: string, loginHint?: string }
 * Returns { authorizationUrl, state, expiresAt } — never returns secrets.
 *
 * Company is taken from authenticated membership + body/header company id.
 * The OAuth `state` is bound server-side to company_id (CSRF + tenant isolation).
 */
Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed.' }, 405);
  }

  try {
    const { serviceClient, userId, userClient } = await createAuthedClients(request);
    const body = (await request.json().catch(() => ({}))) as {
      companyId?: string;
      redirectTo?: string;
      loginHint?: string;
    };

    const companyId = resolveCompanyId(request, body.companyId ?? null);
    if (!companyId) {
      return jsonResponse({ error: 'companyId is required.' }, 400);
    }

    await assertCompanyAccess(serviceClient, userId, companyId);

    const { data: company, error: companyError } = await serviceClient
      .from('companies')
      .select('id, siret, siren, name')
      .eq('id', companyId)
      .maybeSingle();
    if (companyError || !company) {
      return jsonResponse({ error: 'Company not found.' }, 404);
    }

    const state = randomState();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const redirectTo =
      typeof body.redirectTo === 'string' && body.redirectTo.startsWith('https://')
        ? body.redirectTo
        : null;

    const { error: stateError } = await serviceClient.from('superpdp_oauth_states').insert({
      state,
      company_id: companyId,
      user_id: userId,
      redirect_to: redirectTo,
      expires_at: expiresAt,
    });
    if (stateError) {
      return jsonResponse({ error: 'Unable to create OAuth state.' }, 500);
    }

    const { data: userData } = await userClient.auth.getUser();
    const loginHint = body.loginHint || userData.user?.email || null;
    const siren =
      (typeof company.siren === 'string' && company.siren) ||
      (typeof company.siret === 'string' && company.siret.length >= 9
        ? company.siret.slice(0, 9)
        : null);

    const authorizationUrl = buildAuthorizationUrl({
      state,
      loginHint,
      companyNumber: siren,
      companyNumberScheme: siren ? 'fr_siren' : null,
    });

    return jsonResponse({
      authorizationUrl,
      expiresAt,
      companyId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error.';
    const status = message === 'Unauthorized.' ? 401 : message.includes('Forbidden') ? 403 : 400;
    return jsonResponse({ error: message }, status);
  }
});
