import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

import { corsHeaders, jsonResponse } from '../_shared/http.ts';
import {
  buildEmailContent,
  buildResendPayload,
  isEmail,
  resolveClientName,
  sanitizeFileName,
  type DocumentType,
} from '../_shared/email/document-email.ts';

/**
 * Envoi réel d'un devis / d'une facture au client, par e-mail, via Resend.
 *
 * POST { documentType, documentId, pdfBase64, pdfFileName, recipientEmail?, subject?, message? }
 *
 * Sécurité :
 * - le JWT Supabase est vérifié (aucun appel anonyme) ;
 * - le document est relu côté serveur et doit appartenir à l'utilisateur ;
 * - le destinataire, le sujet et le corps sont reconstruits côté serveur à
 *   partir de la base : le client ne peut pas transformer la fonction en relais
 *   d'envoi arbitraire ;
 * - RESEND_API_KEY n'existe que dans les secrets Supabase, jamais dans l'app.
 */

const RESEND_ENDPOINT = 'https://api.resend.com/emails';
const FROM_ADDRESS = Deno.env.get('RESEND_FROM_ADDRESS')?.trim() || 'factures@inveq.fr';
const FROM_NAME = Deno.env.get('RESEND_FROM_NAME')?.trim() || 'INVEQ';

/** Resend accepte 40 Mo par message ; on reste très en dessous. */
const MAX_PDF_BASE64_LENGTH = 12_000_000;

type RequestBody = {
  documentType?: DocumentType;
  documentId?: string;
  pdfBase64?: string;
  pdfFileName?: string;
  message?: string;
};

async function createAuthedClients(request: Request): Promise<{
  serviceClient: SupabaseClient;
  userId: string;
}> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !anonKey || !serviceKey) {
    throw new Error('Supabase configuration missing.');
  }

  const authHeader = request.headers.get('Authorization');

  if (!authHeader) {
    throw new Error('Unauthorized.');
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const {
    data: { user },
    error,
  } = await userClient.auth.getUser();

  if (error || !user) {
    throw new Error('Unauthorized.');
  }

  return { serviceClient: createClient(supabaseUrl, serviceKey), userId: user.id };
}

type DocumentRecord = {
  id: string;
  number: string;
  companyId: string | null;
  clientId: string | null;
};

/** Code Postgres 42703 : la colonne demandée n'existe pas sur cette base. */
function isUndefinedColumn(error: { code?: string; message?: string }): boolean {
  return error.code === '42703' || /does not exist/i.test(error.message ?? '');
}

type DocumentLookup =
  | { ok: true; document: DocumentRecord }
  | { ok: false; reason: 'missing' | 'deleted' | 'forbidden' | 'error' };

/**
 * Relit le document côté serveur.
 *
 * La recherche se fait d'abord sur le seul identifiant, puis les contrôles
 * sont appliqués un par un : un « introuvable » et un « pas à vous » n'ont ni
 * la même cause ni la même réponse à donner à l'utilisateur.
 *
 * L'appartenance suit exactement la RLS de la table (`auth.uid() = user_id`) :
 * cette fonction n'ouvre aucun accès que l'application n'accorderait pas.
 */
async function loadDocument(
  serviceClient: SupabaseClient,
  userId: string,
  documentType: DocumentType,
  documentId: string,
): Promise<DocumentLookup> {
  const table = documentType === 'quote' ? 'quotes' : 'invoices';

  const SAFE_COLUMNS = 'id, number, company_id, client_id, user_id';

  // `deleted_at` n'existe pas sur toutes les bases : en Postgres, une colonne
  // absente fait ÉCHOUER la requête au lieu de la laisser vide. On tente donc
  // avec, puis sans, plutôt que de prendre l'échec pour un document absent.
  let { data, error } = await serviceClient
    .from(table)
    .select(`${SAFE_COLUMNS}, deleted_at`)
    .eq('id', documentId)
    .maybeSingle();

  if (error && isUndefinedColumn(error)) {
    ({ data, error } = await serviceClient
      .from(table)
      .select(SAFE_COLUMNS)
      .eq('id', documentId)
      .maybeSingle());
  }

  if (error) {
    console.error('[send-document-email] lookup', error.message);
    return { ok: false, reason: 'error' };
  }
  if (!data) {
    return { ok: false, reason: 'missing' };
  }
  // Absente du schéma : le document ne peut pas être en corbeille.
  if ((data as { deleted_at?: string | null }).deleted_at) {
    return { ok: false, reason: 'deleted' };
  }
  if (data.user_id !== userId) {
    return { ok: false, reason: 'forbidden' };
  }

  return {
    ok: true,
    document: {
      id: data.id as string,
      number: data.number as string,
      companyId: (data.company_id as string | null) ?? null,
      clientId: (data.client_id as string | null) ?? null,
    },
  };
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed.' }, 405);
  }

  const resendApiKey = Deno.env.get('RESEND_API_KEY')?.trim();

  if (!resendApiKey) {
    // Message explicite : l'app peut alors proposer le repli Mail sans mentir.
    return jsonResponse({ error: 'L’envoi automatique n’est pas encore configuré.' }, 503);
  }

  let serviceClient: SupabaseClient;
  let userId: string;

  try {
    ({ serviceClient, userId } = await createAuthedClients(request));
  } catch {
    return jsonResponse({ error: 'Session expirée. Reconnectez-vous.' }, 401);
  }

  const body = (await request.json().catch(() => ({}))) as RequestBody;
  const documentType = body.documentType;
  const documentId = body.documentId;
  const pdfBase64 = body.pdfBase64;

  if (documentType !== 'quote' && documentType !== 'invoice') {
    return jsonResponse({ error: 'documentType invalide.' }, 400);
  }

  if (!documentId || !pdfBase64) {
    return jsonResponse({ error: 'documentId et pdfBase64 sont requis.' }, 400);
  }

  if (pdfBase64.length > MAX_PDF_BASE64_LENGTH) {
    return jsonResponse({ error: 'Le PDF est trop volumineux pour être envoyé par e-mail.' }, 413);
  }

  const lookup = await loadDocument(serviceClient, userId, documentType, documentId);

  if (!lookup.ok) {
    const label = documentType === 'quote' ? 'devis' : 'facture';
    const responses = {
      missing: { error: `Cette ${label} n’existe pas dans la base.`, status: 404 },
      deleted: { error: `Cette ${label} a été supprimée.`, status: 404 },
      forbidden: {
        error: `Cette ${label} appartient à un autre compte utilisateur.`,
        status: 403,
      },
      error: { error: 'Lecture du document impossible.', status: 500 },
    } as const;
    const chosen = responses[lookup.reason];
    return jsonResponse({ error: chosen.error, reason: lookup.reason }, chosen.status);
  }

  const document = lookup.document;

  const [{ data: client }, { data: company }] = await Promise.all([
    document.clientId
      ? serviceClient
          .from('clients')
          .select('email, company, name')
          .eq('id', document.clientId)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    document.companyId
      ? serviceClient
          .from('companies')
          .select('name, email')
          .eq('id', document.companyId)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  // Le destinataire vient de la base, pas de la requête : la fonction ne peut
  // pas servir à envoyer un PDF à une adresse arbitraire.
  const recipientEmail = (client?.email as string | null)?.trim() ?? '';

  if (!isEmail(recipientEmail)) {
    return jsonResponse(
      { error: 'Ajoutez une adresse e-mail valide au client avant l’envoi.', code: 'recipient' },
      400,
    );
  }

  const clientName = resolveClientName(
    (client?.company as string | null) ?? null,
    (client?.name as string | null) ?? null,
  );
  const companyName = ((company?.name as string | null)?.trim()) || 'INVEQ';
  const companyEmail = (company?.email as string | null)?.trim() ?? '';

  const content = buildEmailContent({
    documentType,
    documentNumber: document.number,
    clientName,
    companyName,
    customMessage: body.message,
  });

  const fileName = sanitizeFileName(body.pdfFileName, `${document.number}.pdf`);

  let resendResponse: Response;

  try {
    resendResponse = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(
        buildResendPayload({
          fromName: FROM_NAME,
          fromAddress: FROM_ADDRESS,
          recipientEmail,
          replyTo: companyEmail,
          content,
          fileName,
          pdfBase64,
        }),
      ),
    });
  } catch {
    return jsonResponse({ error: 'Service d’envoi injoignable. Réessayez.' }, 502);
  }

  const payload = (await resendResponse.json().catch(() => null)) as
    | { id?: string; message?: string; name?: string }
    | null;

  if (!resendResponse.ok || !payload?.id) {
    // On journalise l'échec pour que l'historique reflète la réalité.
    await serviceClient.from('sent_documents').insert({
      user_id: userId,
      document_type: documentType,
      document_id: document.id,
      document_number: document.number,
      recipient_email: recipientEmail,
      subject: content.subject,
      message: content.text,
      channel: 'resend',
      status: 'failed',
      provider_message_id: null,
    });

    return jsonResponse(
      { error: payload?.message || 'L’envoi automatique a échoué.', code: 'provider' },
      502,
    );
  }

  await serviceClient.from('sent_documents').insert({
    user_id: userId,
    document_type: documentType,
    document_id: document.id,
    document_number: document.number,
    recipient_email: recipientEmail,
    subject: content.subject,
    message: content.text,
    channel: 'resend',
    status: 'sent',
    provider_message_id: payload.id,
  });

  return jsonResponse({
    sent: true,
    providerMessageId: payload.id,
    recipientEmail,
    subject: content.subject,
  });
});
