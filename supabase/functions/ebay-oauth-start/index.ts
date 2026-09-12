import { corsHeaders, jsonResponse } from '../_shared/http.ts';
import {
  assertCompanyAccess,
  createAuthedClients,
  resolveCompanyId,
  statusForError,
} from '../_shared/integrations/auth.ts';
import { randomState } from '../_shared/integrations/crypto.ts';
import { EBAY_PROVIDER } from '../_shared/integrations/ebay/connection.ts';
import {
  EBAY_APP_RETURN_MARKER,
  defaultEbayEnvironment,
  isEbayEnvironment,
  loadEbayConfig,
} from '../_shared/integrations/ebay/config.ts';
import { buildAuthorizationUrl } from '../_shared/integrations/ebay/oauth.ts';

/**
 * POST { companyId?, environment?, redirectTo? }
 * → { authorizationUrl, expiresAt, environment }
 *
 * Ne renvoie jamais de secret : ni client_secret, ni RuName, ni jeton.
 * Le `state` est aléatoire (32 octets), à usage unique, valable 10 minutes,
 * et lié en base à (company_id, user_id) : c'est la seule protection du
 * callback, qui est public côté JWT.
 */
Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed.' }, 405);
  }

  try {
    const { serviceClient, userId } = await createAuthedClients(request);
    const body = (await request.json().catch(() => ({}))) as {
      companyId?: string;
      environment?: string;
      redirectTo?: string;
      platform?: string;
    };

    const companyId = resolveCompanyId(request, body.companyId);
    if (!companyId) {
      return jsonResponse({ error: 'companyId est requis.' }, 400);
    }
    await assertCompanyAccess(serviceClient, userId, companyId);

    const environment = isEbayEnvironment(body.environment)
      ? body.environment
      : defaultEbayEnvironment();
    const config = loadEbayConfig(environment);

    // Purge opportuniste : évite d'accumuler des states périmés.
    await serviceClient.rpc('purge_expired_integration_oauth_states').then(
      () => undefined,
      () => undefined,
    );

    const state = randomState();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    // Web : on n'accepte qu'une URL https, stockée telle quelle.
    // Natif : on stocke un simple marqueur ; la cible réelle vient des secrets
    // Supabase, ce qui rend une redirection ouverte impossible.
    const redirectTo =
      body.platform === 'native'
        ? EBAY_APP_RETURN_MARKER
        : typeof body.redirectTo === 'string' && body.redirectTo.startsWith('https://')
          ? body.redirectTo
          : null;

    const { error: stateError } = await serviceClient.from('integration_oauth_states').insert({
      state,
      company_id: companyId,
      user_id: userId,
      provider: EBAY_PROVIDER,
      environment,
      redirect_to: redirectTo,
      expires_at: expiresAt,
    });
    if (stateError) {
      return jsonResponse({ error: 'Impossible de préparer la connexion eBay.' }, 500);
    }

    return jsonResponse({
      authorizationUrl: buildAuthorizationUrl(config, state),
      expiresAt,
      environment,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inattendue.';
    console.error('[ebay-oauth-start]', message);
    return jsonResponse({ error: message }, statusForError(error));
  }
});
