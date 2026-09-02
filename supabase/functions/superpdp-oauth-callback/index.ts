import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

import { corsHeaders, htmlRedirect, jsonResponse } from '../_shared/http.ts';
import { fetchConnectionMeta, siteSuccessRedirect, upsertConnectionFromTokens } from '../_shared/superpdp/auth.ts';
import { exchangeAuthorizationCode, listDirectoryEntries } from '../_shared/superpdp/client.ts';

/**
 * OAuth callback (Authorization Code).
 * GET ?code=&state=  (or error=)
 *
 * Validates one-time state → company_id binding, exchanges code server-side,
 * stores encrypted tokens for THAT company only.
 */
Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const url = new URL(request.url);
  const errorParam = url.searchParams.get('error');
  const errorDescription = url.searchParams.get('error_description');
  if (errorParam) {
    return htmlRedirect(
      siteSuccessRedirect({
        superpdp: 'error',
        reason: errorParam,
        message: errorDescription || 'Authorization denied.',
      }),
    );
  }

  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  if (!code || !state) {
    return jsonResponse({ error: 'Missing code or state.' }, 400);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceKey) {
    return jsonResponse({ error: 'Server misconfigured.' }, 500);
  }
  const serviceClient = createClient(supabaseUrl, serviceKey);

  try {
    const { data: stateRow, error: stateError } = await serviceClient
      .from('superpdp_oauth_states')
      .select('*')
      .eq('state', state)
      .maybeSingle();

    if (stateError || !stateRow) {
      return htmlRedirect(siteSuccessRedirect({ superpdp: 'error', reason: 'invalid_state' }));
    }
    if (stateRow.used_at) {
      return htmlRedirect(siteSuccessRedirect({ superpdp: 'error', reason: 'state_reused' }));
    }
    if (new Date(stateRow.expires_at).getTime() < Date.now()) {
      return htmlRedirect(siteSuccessRedirect({ superpdp: 'error', reason: 'state_expired' }));
    }

    const { error: consumeError } = await serviceClient
      .from('superpdp_oauth_states')
      .update({ used_at: new Date().toISOString() })
      .eq('id', stateRow.id)
      .is('used_at', null);
    if (consumeError) {
      return htmlRedirect(siteSuccessRedirect({ superpdp: 'error', reason: 'state_consume_failed' }));
    }

    const tokens = await exchangeAuthorizationCode(code);
    const meta = await fetchConnectionMeta(tokens.access_token);

    // Prefer directory entries on the connected company if available.
    try {
      const entries = await listDirectoryEntries(tokens.access_token);
      meta.directoryRegistered = (entries.data?.length ?? 0) > 0;
    } catch {
      // keep previous meta.directoryRegistered
    }

    await upsertConnectionFromTokens(serviceClient, stateRow.company_id, tokens, meta);

    const redirectBase =
      (typeof stateRow.redirect_to === 'string' && stateRow.redirect_to.startsWith('https://')
        ? stateRow.redirect_to
        : null) || siteSuccessRedirect({ superpdp: 'connected' });

    const redirectUrl = new URL(redirectBase);
    redirectUrl.searchParams.set('superpdp', 'connected');
    redirectUrl.searchParams.set('companyId', stateRow.company_id);
    return htmlRedirect(redirectUrl.toString());
  } catch (error) {
    const message = error instanceof Error ? error.message : 'callback_failed';
    console.error('[superpdp-oauth-callback]', message);
    return htmlRedirect(
      siteSuccessRedirect({
        superpdp: 'error',
        reason: 'callback_failed',
        message: 'La connexion SUPER PDP a échoué.',
      }),
    );
  }
});
