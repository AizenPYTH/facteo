import { corsHeaders, jsonResponse } from '../_shared/http.ts';
import {
  assertCompanyAccess,
  createAuthedClients,
  getValidAccessToken,
  loadConnection,
  resolveCompanyId,
} from '../_shared/superpdp/auth.ts';
import { convertInvoice, createInvoice, listFrenchDirectoryEntries } from '../_shared/superpdp/client.ts';
import { buildEnInvoice, validateEnInvoiceInputs } from '../_shared/superpdp/en-invoice.ts';

function toDateOnly(value: string | null | undefined): string | null {
  if (!value) return null;
  return value.slice(0, 10);
}

/**
 * POST { companyId, invoiceId }
 * Idempotent electronic emission via SUPER PDP.
 * Flow (official):
 *  1) Build en_invoice JSON
 *  2) POST /v1.beta/invoices/convert?from=en16931&to=cii
 *  3) POST /v1.beta/invoices (application/xml) with external_id = invoice.id
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
      invoiceId?: string;
    };
    const companyId = resolveCompanyId(request, body.companyId ?? null);
    const invoiceId = body.invoiceId;
    if (!companyId || !invoiceId) {
      return jsonResponse({ error: 'companyId and invoiceId are required.' }, 400);
    }
    await assertCompanyAccess(serviceClient, userId, companyId);

    const connection = await loadConnection(serviceClient, companyId);
    if (!connection || connection.status === 'disconnected') {
      return jsonResponse({ error: 'SUPER PDP n’est pas connecté pour cette entreprise.' }, 400);
    }
    if (connection.status === 'failed') {
      return jsonResponse({ error: 'Connexion SUPER PDP en échec. Reconnectez-vous.' }, 400);
    }

    const { data: invoice, error: invoiceError } = await serviceClient
      .from('invoices')
      .select(
        'id, company_id, client_id, number, status, subtotal_ht, total_vat, total_ttc, issued_at, due_at, notes, superpdp_invoice_id, superpdp_external_id, electronic_invoice_status, electronic_buyer_address',
      )
      .eq('id', invoiceId)
      .eq('company_id', companyId)
      .is('deleted_at', null)
      .maybeSingle();

    if (invoiceError || !invoice) {
      return jsonResponse({ error: 'Facture introuvable.' }, 404);
    }

    // Idempotence: already submitted to SUPER PDP.
    if (invoice.superpdp_invoice_id) {
      return jsonResponse({
        idempotent: true,
        superpdpInvoiceId: invoice.superpdp_invoice_id,
        electronicInvoiceStatus: invoice.electronic_invoice_status,
        message: 'Facture déjà transmise à SUPER PDP.',
      });
    }

    if (invoice.status === 'draft' || invoice.status === 'canceled') {
      return jsonResponse({ error: 'La facture doit être émise (hors brouillon / annulée).' }, 400);
    }

    const [{ data: company }, { data: client }, { data: items }] = await Promise.all([
      serviceClient
        .from('companies')
        .select('name, email, address, postal_code, city, country, siret, siren, vat_number, iban')
        .eq('id', companyId)
        .maybeSingle(),
      invoice.client_id
        ? serviceClient
            .from('clients')
            .select('name, company, email, address, postal_code, city, country, siren, siret, vat_number')
            .eq('id', invoice.client_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      serviceClient
        .from('invoice_items')
        .select('id, position, description, quantity, unit, unit_price, vat_rate, line_total_ht')
        .eq('invoice_id', invoiceId)
        .is('deleted_at', null)
        .order('position', { ascending: true }),
    ]);

    if (!company) return jsonResponse({ error: 'Entreprise introuvable.' }, 404);
    if (!client) return jsonResponse({ error: 'Client introuvable sur la facture.' }, 400);
    if (!items?.length) return jsonResponse({ error: 'Aucune ligne sur la facture.' }, 400);

    let buyerElectronic = invoice.electronic_buyer_address as string | null;
    const buyerSiren =
      (client.siren && String(client.siren).replace(/\s/g, '')) ||
      (client.siret && String(client.siret).replace(/\s/g, '').slice(0, 9)) ||
      null;

    if (!buyerElectronic && buyerSiren && /^\d{9}$/.test(buyerSiren)) {
      try {
        const entries = await listFrenchDirectoryEntries(buyerSiren);
        const active = entries.find((e) => e.is_active);
        if (active) buyerElectronic = active.identifier;
      } catch {
        // Directory lookup failure must not invent addressing; continue without if not required.
      }
    }

    const enInput = {
      invoiceNumber: invoice.number,
      issueDate: toDateOnly(invoice.issued_at) || toDateOnly(new Date().toISOString())!,
      dueDate: toDateOnly(invoice.due_at),
      currency: 'EUR',
      seller: {
        name: company.name,
        street: company.address,
        city: company.city,
        postalCode: company.postal_code,
        countryCode: company.country,
        siret: company.siret,
        siren: company.siren,
        vatNumber: company.vat_number,
        email: company.email,
        iban: company.iban,
      },
      buyer: {
        name: client.company || client.name,
        street: client.address,
        city: client.city,
        postalCode: client.postal_code,
        countryCode: client.country,
        siret: client.siret,
        siren: client.siren,
        vatNumber: client.vat_number,
        email: client.email,
        electronicAddress: buyerElectronic,
      },
      lines: items.map((item) => ({
        id: String(item.position || item.id),
        name: item.description,
        quantity: Number(item.quantity),
        unitCode: 'C62',
        unitPrice: Number(item.unit_price),
        vatRate: Number(item.vat_rate),
        lineTotalHt: Number(item.line_total_ht),
      })),
      notes: invoice.notes,
    };

    const validationErrors = validateEnInvoiceInputs(enInput);
    if (validationErrors.length) {
      await serviceClient
        .from('invoices')
        .update({
          electronic_invoice_status: 'error',
          electronic_invoice_last_error: validationErrors.join(' '),
          electronic_invoice_updated_at: new Date().toISOString(),
        })
        .eq('id', invoiceId)
        .eq('company_id', companyId);
      return jsonResponse({ error: 'Données facture incomplètes.', details: validationErrors }, 400);
    }

    const enInvoice = buildEnInvoice(enInput);
    const converted = await convertInvoice('en16931', 'cii', enInvoice, 'application/json');
    if (!(converted instanceof ArrayBuffer)) {
      return jsonResponse({ error: 'Conversion CII invalide.' }, 502);
    }

    const accessToken = await getValidAccessToken(serviceClient, connection);
    const externalId = String(invoice.id).slice(0, 36);

    // Claim idempotency before remote create to reduce double-send races.
    const { data: claimed, error: claimError } = await serviceClient
      .from('invoices')
      .update({
        superpdp_external_id: externalId,
        electronic_invoice_status: 'ready',
        electronic_invoice_format: 'cii',
        electronic_invoice_updated_at: new Date().toISOString(),
        electronic_buyer_address: buyerElectronic,
      })
      .eq('id', invoiceId)
      .eq('company_id', companyId)
      .is('superpdp_invoice_id', null)
      .select('id, superpdp_invoice_id')
      .maybeSingle();

    if (claimError) {
      return jsonResponse({ error: 'Impossible de verrouiller la facture pour émission.' }, 409);
    }

    // Re-read in case another worker won.
    const { data: fresh } = await serviceClient
      .from('invoices')
      .select('superpdp_invoice_id, electronic_invoice_status')
      .eq('id', invoiceId)
      .maybeSingle();
    if (fresh?.superpdp_invoice_id) {
      return jsonResponse({
        idempotent: true,
        superpdpInvoiceId: fresh.superpdp_invoice_id,
        electronicInvoiceStatus: fresh.electronic_invoice_status,
      });
    }
    if (!claimed) {
      return jsonResponse({ error: 'Émission déjà en cours.' }, 409);
    }

    let remote;
    try {
      remote = await createInvoice(accessToken, converted, {
        contentType: 'application/xml',
        externalId,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Émission SUPER PDP échouée.';
      await serviceClient
        .from('invoices')
        .update({
          electronic_invoice_status: 'error',
          electronic_invoice_last_error: message,
          electronic_invoice_updated_at: new Date().toISOString(),
        })
        .eq('id', invoiceId)
        .eq('company_id', companyId);
      return jsonResponse({ error: message }, 502);
    }

    const { error: saveError } = await serviceClient
      .from('invoices')
      .update({
        superpdp_invoice_id: remote.id,
        superpdp_external_id: remote.external_id || externalId,
        electronic_invoice_status: 'submitted',
        electronic_invoice_format: 'cii',
        electronic_invoice_sent_at: new Date().toISOString(),
        electronic_invoice_updated_at: new Date().toISOString(),
        electronic_invoice_last_error: null,
      })
      .eq('id', invoiceId)
      .eq('company_id', companyId);

    if (saveError) {
      // Remote created but local save failed — keep remote id in error for ops.
      return jsonResponse(
        {
          error: 'Facture envoyée mais non enregistrée localement. Contactez le support.',
          superpdpInvoiceId: remote.id,
        },
        500,
      );
    }

    await serviceClient
      .from('company_superpdp_connections')
      .update({ last_sync_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', connection.id);

    return jsonResponse({
      idempotent: false,
      superpdpInvoiceId: remote.id,
      electronicInvoiceStatus: 'submitted',
      format: 'cii',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error.';
    const status = message === 'Unauthorized.' ? 401 : message.includes('Forbidden') ? 403 : 400;
    return jsonResponse({ error: message }, status);
  }
});
