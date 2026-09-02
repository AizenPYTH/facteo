import { corsHeaders, jsonResponse } from '../_shared/http.ts';
import {
  assertCompanyAccess,
  createAuthedClients,
  resolveCompanyId,
} from '../_shared/superpdp/auth.ts';
import { listFrenchDirectoryEntries } from '../_shared/superpdp/client.ts';

/**
 * POST { companyId, siren, clientId? }
 * Looks up French e-invoicing directory entries (official public endpoint).
 * Does not require a per-company SUPER PDP token (OpenAPI security: []).
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
      siren?: string;
      clientId?: string;
    };
    const companyId = resolveCompanyId(request, body.companyId ?? null);
    if (!companyId) return jsonResponse({ error: 'companyId is required.' }, 400);
    await assertCompanyAccess(serviceClient, userId, companyId);

    const siren = (body.siren || '').replace(/\s/g, '');
    if (!/^\d{9}$/.test(siren)) {
      return jsonResponse({ error: 'SIREN invalide (9 chiffres requis).' }, 400);
    }

    const entries = await listFrenchDirectoryEntries(siren);
    const active = entries.filter((e) => e.is_active);
    const isRegistered = active.length > 0;
    const identifiers = active.map((e) => e.identifier);

    await serviceClient.from('superpdp_directory_lookups').insert({
      company_id: companyId,
      client_id: body.clientId || null,
      siren,
      is_registered: isRegistered,
      active_identifiers: identifiers,
      raw_result: { data: entries },
    });

    return jsonResponse({
      siren,
      isRegistered,
      compatible: isRegistered,
      message: isRegistered
        ? 'Client compatible facturation électronique'
        : 'Client non encore enregistré',
      identifiers,
      entries: active.map((e) => ({
        identifier: e.identifier,
        formalName: e.company.formal_name,
        isActive: e.is_active,
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error.';
    const status = message === 'Unauthorized.' ? 401 : message.includes('Forbidden') ? 403 : 400;
    return jsonResponse({ error: message }, status);
  }
});
