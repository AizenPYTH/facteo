import { corsHeaders, jsonResponse } from '../_shared/http.ts';
import {
  assertCompanyAccess,
  createAuthedClients,
  fetchConnectionMeta,
  getValidAccessToken,
  loadConnection,
  resolveCompanyId,
  toPublicConnection,
} from '../_shared/superpdp/auth.ts';
import { listDirectoryEntries } from '../_shared/superpdp/client.ts';

/**
 * GET/POST connection status for the authenticated user's company.
 * Never returns access_token / refresh_token.
 *
 * POST { companyId, action?: 'status' | 'verify' }
 */
Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { serviceClient, userId } = await createAuthedClients(request);
    const body =
      request.method === 'POST'
        ? ((await request.json().catch(() => ({}))) as { companyId?: string; action?: string })
        : {};
    const companyId =
      resolveCompanyId(request, body.companyId ?? null) ||
      new URL(request.url).searchParams.get('companyId');

    if (!companyId) return jsonResponse({ error: 'companyId is required.' }, 400);
    await assertCompanyAccess(serviceClient, userId, companyId);

    let connection = await loadConnection(serviceClient, companyId);
    if (!connection || connection.status === 'disconnected') {
      return jsonResponse({ connected: false, connection: null });
    }

    const action = body.action || 'status';
    if (action === 'verify') {
      try {
        const accessToken = await getValidAccessToken(serviceClient, connection);
        const meta = await fetchConnectionMeta(accessToken);
        try {
          const entries = await listDirectoryEntries(accessToken);
          meta.directoryRegistered = (entries.data?.length ?? 0) > 0;
        } catch {
          /* ignore */
        }

        const status =
          meta.session.company_verification_status === 'verified'
            ? 'connected'
            : meta.session.company_verification_status === 'needs_review'
              ? 'needs_review'
              : 'failed';

        const { data } = await serviceClient
          .from('company_superpdp_connections')
          .update({
            status,
            remote_company_id: meta.company.id,
            remote_company_number: meta.company.number,
            remote_company_name: meta.company.formal_name || meta.company.trade_name,
            remote_env: meta.company.env,
            company_verification_status: meta.session.company_verification_status,
            directory_registered: meta.directoryRegistered,
            last_sync_at: new Date().toISOString(),
            last_error: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', connection.id)
          .select('*')
          .single();
        connection = (data as typeof connection) ?? connection;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Verification failed.';
        await serviceClient
          .from('company_superpdp_connections')
          .update({
            last_error: message,
            updated_at: new Date().toISOString(),
          })
          .eq('id', connection.id);
        return jsonResponse(
          {
            connected: connection.status === 'connected',
            connection: toPublicConnection(connection),
            verifyError: message,
          },
          200,
        );
      }
    }

    return jsonResponse({
      connected: connection.status === 'connected' || connection.status === 'needs_review',
      connection: toPublicConnection(connection),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error.';
    const status = message === 'Unauthorized.' ? 401 : message.includes('Forbidden') ? 403 : 400;
    return jsonResponse({ error: message }, status);
  }
});
