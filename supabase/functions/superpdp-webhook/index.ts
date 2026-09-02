import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

import { corsHeaders, jsonResponse } from '../_shared/http.ts';

/**
 * SUPER PDP webhook receiver (best-effort).
 *
 * BLOCKER DOCUMENTED IN docs/super-pdp.md:
 * Official SUPER PDP OpenAPI (v1.30.0.beta) does NOT document a product webhook
 * registration or signature scheme for https://api.superpdp.tech.
 * AFNOR XP Z12-013 Flow defines Afnor-Signature / Afnor-Signature-Timestamp —
 * that is a different interoperability API.
 *
 * Until SUPER PDP confirms the exact header + HMAC algorithm for product webhooks:
 * - If SUPER_PDP_WEBHOOK_SHARED_SECRET is set, require
 *   Authorization: Bearer <secret> OR X-Superpdp-Webhook-Secret: <secret>
 * - Otherwise reject with 503 (do not accept unverified webhooks in production).
 *
 * Lifecycle sync in production today must use `superpdp-sync` (polling invoice_events).
 */
Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed.' }, 405);
  }

  const sharedSecret = Deno.env.get('SUPER_PDP_WEBHOOK_SHARED_SECRET')?.trim();
  if (!sharedSecret) {
    return jsonResponse(
      {
        error:
          'Webhook receiver disabled: SUPER PDP product webhook signature is not documented in OpenAPI. Configure SUPER_PDP_WEBHOOK_SHARED_SECRET only after SUPER PDP confirms the scheme, or use polling via superpdp-sync.',
        code: 'webhook_signature_undocumented',
      },
      503,
    );
  }

  const auth = request.headers.get('Authorization') || '';
  const headerSecret = request.headers.get('X-Superpdp-Webhook-Secret') || '';
  const bearer = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  const provided = bearer || headerSecret;
  if (!provided || provided !== sharedSecret) {
    return jsonResponse({ error: 'Unauthorized webhook.' }, 401);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceKey) {
    return jsonResponse({ error: 'Server misconfigured.' }, 500);
  }
  const serviceClient = createClient(supabaseUrl, serviceKey);

  const raw = await request.text();
  let payload: Record<string, unknown> = {};
  try {
    payload = raw ? JSON.parse(raw) : {};
  } catch {
    return jsonResponse({ error: 'Invalid JSON.' }, 400);
  }

  const invoiceId = payload.invoice_id ?? payload.id ?? null;
  const statusCode = payload.status_code ?? null;
  const companyHint = payload.company_id ?? null;
  const eventKey = [
    'webhook',
    String(companyHint ?? 'unknown'),
    String(invoiceId ?? 'none'),
    String(statusCode ?? 'none'),
    String(payload.event_id ?? payload.created_at ?? hashLite(raw)),
  ].join(':');

  const { data: inserted, error } = await serviceClient
    .from('superpdp_webhook_events')
    .upsert(
      {
        company_id: null,
        event_key: eventKey.slice(0, 500),
        source: 'webhook',
        payload,
        headers: {
          'content-type': request.headers.get('content-type'),
          // Do not store Authorization / secrets.
        },
        signature_valid: true,
        processed_at: null,
      },
      { onConflict: 'event_key', ignoreDuplicates: true },
    )
    .select('id, processed_at')
    .maybeSingle();

  if (error) {
    return jsonResponse({ error: 'Unable to store webhook event.' }, 500);
  }

  if (inserted?.processed_at) {
    return jsonResponse({ ok: true, duplicate: true });
  }

  // Minimal processing: if we can map to a local invoice by superpdp_invoice_id, update status.
  if (invoiceId != null && statusCode) {
    const { deriveElectronicStatusFromEvents } = await import('../_shared/superpdp/status-map.ts');
    const status = deriveElectronicStatusFromEvents([String(statusCode)], 'submitted');
    await serviceClient
      .from('invoices')
      .update({
        electronic_invoice_status: status,
        electronic_invoice_updated_at: new Date().toISOString(),
      })
      .eq('superpdp_invoice_id', Number(invoiceId));

    await serviceClient
      .from('superpdp_received_invoices')
      .update({
        latest_status_code: String(statusCode),
        electronic_invoice_status: status,
        updated_at: new Date().toISOString(),
      })
      .eq('superpdp_invoice_id', Number(invoiceId));
  }

  if (inserted?.id) {
    await serviceClient
      .from('superpdp_webhook_events')
      .update({ processed_at: new Date().toISOString() })
      .eq('id', inserted.id);
  }

  return jsonResponse({ ok: true, duplicate: false });
});

function hashLite(value: string): string {
  let h = 0;
  for (let i = 0; i < value.length; i++) h = (h * 31 + value.charCodeAt(i)) >>> 0;
  return h.toString(16);
}
