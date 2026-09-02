import { corsHeaders, jsonResponse } from '../_shared/http.ts';
import {
  assertCompanyAccess,
  createAuthedClients,
  loadConnection,
  resolveCompanyId,
} from '../_shared/superpdp/auth.ts';

/**
 * POST { companyId } — disconnect SUPER PDP for the company.
 * Clears encrypted tokens. Does not call an undocumented remote revoke endpoint
 * (none listed in official OpenAPI v1.30.0.beta).
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
    const body = (await request.json().catch(() => ({}))) as { companyId?: string };
    const companyId = resolveCompanyId(request, body.companyId ?? null);
    if (!companyId) return jsonResponse({ error: 'companyId is required.' }, 400);
    await assertCompanyAccess(serviceClient, userId, companyId);

    const connection = await loadConnection(serviceClient, companyId);
    if (!connection) {
      return jsonResponse({ disconnected: true });
    }

    // Overwrite secrets with non-usable placeholders then mark disconnected.
    const { error } = await serviceClient
      .from('company_superpdp_connections')
      .update({
        status: 'disconnected',
        access_token_encrypted: 'revoked',
        refresh_token_encrypted: 'revoked',
        token_expires_at: new Date(0).toISOString(),
        last_error: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', connection.id)
      .eq('company_id', companyId);

    if (error) {
      return jsonResponse({ error: 'Unable to disconnect.' }, 500);
    }

    return jsonResponse({ disconnected: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error.';
    const status = message === 'Unauthorized.' ? 401 : message.includes('Forbidden') ? 403 : 400;
    return jsonResponse({ error: message }, status);
  }
});
