import { corsHeaders, htmlRedirect, jsonResponse } from '../_shared/http.ts';
import { createServiceClient } from '../_shared/integrations/auth.ts';
import { EBAY_PROVIDER, upsertFromTokens } from '../_shared/integrations/ebay/connection.ts';
import {
  EBAY_APP_RETURN_MARKER,
  ebayReturnUrl,
  isEbayEnvironment,
  loadEbayConfig,
} from '../_shared/integrations/ebay/config.ts';
import { exchangeAuthorizationCode } from '../_shared/integrations/ebay/oauth.ts';

/**
 * Callback OAuth eBay — GET ?code=&state=  (ou ?error=)
 *
 * Cette fonction DOIT être déployée avec `--no-verify-jwt` : eBay redirige un
 * navigateur, sans en-tête Authorization. Sa sécurité repose entièrement sur
 * le `state` : aléatoire (32 octets), non expiré, consommé une seule fois par
 * un UPDATE conditionnel, et porteur de la liaison company + user.
 *
 * L'URL configurée dans le RuName eBay ne contient aucune query string :
 *   https://<project-ref>.supabase.co/functions/v1/ebay-oauth-callback
 */
Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const url = new URL(request.url);
  const errorParam = url.searchParams.get('error');
  if (errorParam) {
    return htmlRedirect(
      ebayReturnUrl({ ebay: 'error', reason: errorParam.slice(0, 64) }),
    );
  }

  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  if (!code || !state) {
    return jsonResponse({ error: 'Paramètres OAuth manquants.' }, 400);
  }

  let serviceClient;
  try {
    serviceClient = createServiceClient();
  } catch {
    return jsonResponse({ error: 'Serveur mal configuré.' }, 500);
  }

  try {
    const { data: stateRow, error: stateError } = await serviceClient
      .from('integration_oauth_states')
      .select('state, company_id, user_id, provider, environment, redirect_to, expires_at, consumed_at')
      .eq('state', state)
      .eq('provider', EBAY_PROVIDER)
      .maybeSingle();

    if (stateError || !stateRow) {
      return htmlRedirect(ebayReturnUrl({ ebay: 'error', reason: 'invalid_state' }));
    }
    if (stateRow.consumed_at) {
      return htmlRedirect(ebayReturnUrl({ ebay: 'error', reason: 'state_reused' }));
    }
    if (new Date(stateRow.expires_at).getTime() <= Date.now()) {
      return htmlRedirect(ebayReturnUrl({ ebay: 'error', reason: 'state_expired' }));
    }

    // Consommation atomique : `is('consumed_at', null)` empêche tout rejeu
    // même en cas d'appels concurrents.
    const { data: consumed, error: consumeError } = await serviceClient
      .from('integration_oauth_states')
      .update({ consumed_at: new Date().toISOString() })
      .eq('state', state)
      .is('consumed_at', null)
      .select('state')
      .maybeSingle();

    if (consumeError || !consumed) {
      return htmlRedirect(ebayReturnUrl({ ebay: 'error', reason: 'state_reused' }));
    }

    const environment = isEbayEnvironment(stateRow.environment)
      ? stateRow.environment
      : 'production';
    const config = loadEbayConfig(environment);
    const tokens = await exchangeAuthorizationCode(config, code);

    await upsertFromTokens(serviceClient, {
      companyId: stateRow.company_id,
      userId: stateRow.user_id,
      environment,
      tokens,
    });

    if (stateRow.redirect_to === EBAY_APP_RETURN_MARKER) {
      return htmlRedirect(
        ebayReturnUrl({ ebay: 'connected', companyId: stateRow.company_id }, 'app'),
      );
    }

    const base =
      typeof stateRow.redirect_to === 'string' && stateRow.redirect_to.startsWith('https://')
        ? stateRow.redirect_to
        : null;
    if (base) {
      const redirectUrl = new URL(base);
      redirectUrl.searchParams.set('ebay', 'connected');
      redirectUrl.searchParams.set('companyId', stateRow.company_id);
      return htmlRedirect(redirectUrl.toString());
    }

    return htmlRedirect(
      ebayReturnUrl({ ebay: 'connected', companyId: stateRow.company_id }),
    );
  } catch (error) {
    // On journalise le message d'erreur, jamais le code ni un jeton.
    console.error('[ebay-oauth-callback]', error instanceof Error ? error.message : 'failed');
    return htmlRedirect(ebayReturnUrl({ ebay: 'error', reason: 'callback_failed' }));
  }
});
