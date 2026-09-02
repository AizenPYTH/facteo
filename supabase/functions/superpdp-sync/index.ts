import { corsHeaders, jsonResponse } from '../_shared/http.ts';
import {
  assertCompanyAccess,
  createAuthedClients,
  getValidAccessToken,
  loadConnection,
  resolveCompanyId,
} from '../_shared/superpdp/auth.ts';
import { listInvoiceEvents, listInvoices } from '../_shared/superpdp/client.ts';
import { deriveElectronicStatusFromEvents } from '../_shared/superpdp/status-map.ts';

/**
 * POST { companyId, mode?: 'out' | 'in' | 'both' }
 * Polls SUPER PDP invoices + events (documented API).
 * Primary lifecycle sync until SUPER PDP documents a product webhook signature scheme.
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
      mode?: 'out' | 'in' | 'both';
    };
    const companyId = resolveCompanyId(request, body.companyId ?? null);
    if (!companyId) return jsonResponse({ error: 'companyId is required.' }, 400);
    await assertCompanyAccess(serviceClient, userId, companyId);

    const connection = await loadConnection(serviceClient, companyId);
    if (!connection || connection.status === 'disconnected') {
      return jsonResponse({ error: 'SUPER PDP non connecté.' }, 400);
    }

    const accessToken = await getValidAccessToken(serviceClient, connection);
    const mode = body.mode || 'both';
    let updatedOut = 0;
    let upsertedIn = 0;

    if (mode === 'out' || mode === 'both') {
      const { data: localOut } = await serviceClient
        .from('invoices')
        .select('id, superpdp_invoice_id, electronic_invoice_status')
        .eq('company_id', companyId)
        .not('superpdp_invoice_id', 'is', null)
        .is('deleted_at', null)
        .limit(100);

      for (const inv of localOut ?? []) {
        if (!inv.superpdp_invoice_id) continue;
        const events = await listInvoiceEvents(accessToken, Number(inv.superpdp_invoice_id));
        const codes = (events.data ?? []).map((e) => e.status_code);
        const status = deriveElectronicStatusFromEvents(
          codes,
          (inv.electronic_invoice_status as 'submitted') || 'submitted',
        );
        const eventKey = `poll:out:${companyId}:${inv.superpdp_invoice_id}:${codes.join(',')}`;
        await serviceClient.from('superpdp_webhook_events').upsert(
          {
            company_id: companyId,
            event_key: eventKey.slice(0, 500),
            source: 'poll',
            payload: { invoice_id: inv.superpdp_invoice_id, events: events.data ?? [] },
            processed_at: new Date().toISOString(),
          },
          { onConflict: 'event_key', ignoreDuplicates: true },
        );

        await serviceClient
          .from('invoices')
          .update({
            electronic_invoice_status: status,
            electronic_invoice_updated_at: new Date().toISOString(),
            electronic_invoice_last_error: null,
          })
          .eq('id', inv.id)
          .eq('company_id', companyId);
        updatedOut += 1;
      }
    }

    if (mode === 'in' || mode === 'both') {
      const remote = await listInvoices(accessToken, {
        direction: 'in',
        order: 'desc',
        limit: 50,
        'expand[]': 'en_invoice',
      });

      for (const item of remote.data ?? []) {
        const remoteId = Number(item.id);
        if (!Number.isFinite(remoteId)) continue;

        const en = (item.en_invoice || {}) as Record<string, unknown>;
        const seller = (en.seller || {}) as Record<string, unknown>;
        const totals = (en.totals || {}) as Record<string, unknown>;
        const events = Array.isArray(item.events) ? item.events : [];
        const codes = events.map((e: { status_code?: string }) => e.status_code || '').filter(Boolean);
        const status = deriveElectronicStatusFromEvents(codes, 'received');

        const eventKey = `poll:in:${companyId}:${remoteId}`;
        const { error: eventError } = await serviceClient.from('superpdp_webhook_events').upsert(
          {
            company_id: companyId,
            event_key: eventKey,
            source: 'poll',
            payload: item,
            processed_at: new Date().toISOString(),
          },
          { onConflict: 'event_key', ignoreDuplicates: true },
        );
        // Even if duplicate event, refresh received invoice snapshot.

        const vatAmount =
          typeof totals.total_vat_amount === 'object' && totals.total_vat_amount
            ? Number((totals.total_vat_amount as { value?: string }).value)
            : Number(totals.total_vat_amount);

        await serviceClient.from('superpdp_received_invoices').upsert(
          {
            company_id: companyId,
            superpdp_invoice_id: remoteId,
            supplier_name: (seller.name as string) || null,
            supplier_number:
              ((seller.legal_registration_identifier as { value?: string })?.value as string) || null,
            invoice_number: (en.number as string) || null,
            issue_date: (en.issue_date as string) || null,
            currency: (en.currency_code as string) || 'EUR',
            subtotal_ht: totals.total_without_vat ? Number(totals.total_without_vat) : null,
            total_vat: Number.isFinite(vatAmount) ? vatAmount : null,
            total_ttc: totals.total_with_vat ? Number(totals.total_with_vat) : null,
            latest_status_code: codes[codes.length - 1] || null,
            electronic_invoice_status: status,
            received_at: (item.created_at as string) || new Date().toISOString(),
            structured_payload: en,
            raw_events: events,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'company_id,superpdp_invoice_id' },
        );
        if (!eventError) upsertedIn += 1;
        else upsertedIn += 1;
      }
    }

    await serviceClient
      .from('company_superpdp_connections')
      .update({ last_sync_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', connection.id);

    return jsonResponse({
      ok: true,
      updatedOutgoing: updatedOut,
      upsertedIncoming: upsertedIn,
      lastSyncAt: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error.';
    const status = message === 'Unauthorized.' ? 401 : message.includes('Forbidden') ? 403 : 400;
    return jsonResponse({ error: message }, status);
  }
});
