import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

import { corsHeaders, jsonResponse } from '../_shared/http.ts';
import { isEmail, resolveClientName } from '../_shared/email/document-email.ts';
import {
  buildReminderEmail,
  formatEuro,
  formatFrenchDate,
  type ReminderStage,
} from '../_shared/email/reminder-email.ts';

/**
 * Relances des factures impayées, par e-mail (Resend).
 *
 * Deux usages :
 * - planifié (pg_cron, en-tête `x-inveq-cron`) : relances automatiques du
 *   jour (J-3, échéance, J+7, J+15), selon les réglages de chaque entreprise ;
 * - manuel (utilisateur connecté) : POST { invoiceId } → relance immédiate.
 *
 * La base décide de ce qui part (`claim_*`) : jamais de doublon, jamais de
 * relance pour une facture payée, annulée, supprimée ou en brouillon. La
 * fonction relit la facture juste avant l'envoi.
 * La clé service_role ne quitte jamais le serveur.
 */

const RESEND_ENDPOINT = 'https://api.resend.com/emails';
const FROM_ADDRESS = Deno.env.get('RESEND_FROM_ADDRESS')?.trim() || 'factures@inveq.fr';
const FROM_NAME = Deno.env.get('RESEND_FROM_NAME')?.trim() || 'INVEQ';
const PUBLIC_SITE_URL = (Deno.env.get('PUBLIC_SITE_URL')?.trim() || 'https://www.inveq.fr').replace(/\/$/, '');
/** Par passage planifié : reste sous la durée maximale d'une fonction. */
const BATCH_LIMIT = 80;
/** Resend limite le débit : une relance toutes les 600 ms. */
const SEND_INTERVAL_MS = 600;

const BLOCK_MESSAGES: Record<string, string> = {
  INVOICE_NOT_FOUND: 'Facture introuvable.',
  INVOICE_DELETED: 'Cette facture a été supprimée.',
  NOT_AN_INVOICE: 'Un avoir ne se relance pas.',
  INVOICE_CANCELED: 'Une facture annulée ne se relance pas.',
  INVOICE_PAID: 'Cette facture est déjà réglée.',
  INVOICE_DRAFT: 'Finalisez et envoyez la facture avant de la relancer.',
  CLIENT_EMAIL_MISSING: 'Ajoutez une adresse e-mail valide au client.',
  REMINDER_TOO_SOON: 'Une relance a déjà été envoyée il y a moins de 24 heures.',
  Unauthorized: 'Cette facture n’appartient pas à votre compte.',
};

type Payload = {
  reminder_id: string;
  stage: ReminderStage;
  invoice_id: string;
  user_id: string;
  company_id: string | null;
  number: string;
  total_ttc: number;
  amount_due: number;
  due_at: string | null;
  stripe_payment_link: string | null;
  client_email: string | null;
  client_name: string | null;
  client_company: string | null;
  company_name: string | null;
  company_email: string | null;
  include_payment_link: boolean;
  templates: unknown;
  block_reason: string | null;
};

type Outcome = { reminderId: string; status: 'sent' | 'failed'; error?: string };

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function blockMessage(code: string): string {
  return BLOCK_MESSAGES[code] ?? 'Relance impossible.';
}

async function complete(
  service: SupabaseClient,
  reminderId: string,
  status: 'sent' | 'failed',
  fields: { recipient?: string | null; subject?: string | null; body?: string | null; providerId?: string | null; error?: string | null },
): Promise<void> {
  const { error } = await service.rpc('complete_invoice_reminder', {
    p_reminder_id: reminderId,
    p_status: status,
    p_recipient: fields.recipient ?? null,
    p_subject: fields.subject ?? null,
    p_body: fields.body ?? null,
    p_provider_message_id: fields.providerId ?? null,
    p_error: fields.error ?? null,
  });
  if (error) console.error('[send-invoice-reminders] complete', error.message);
}

async function processReminder(service: SupabaseClient, resendKey: string, reminderId: string): Promise<Outcome> {
  const { data, error } = await service.rpc('invoice_reminder_payload', { p_reminder_id: reminderId });
  const payload = data as Payload | null;
  if (error || !payload) {
    await complete(service, reminderId, 'failed', { error: 'Lecture de la facture impossible.' });
    return { reminderId, status: 'failed', error: 'Lecture de la facture impossible.' };
  }

  // Relue juste avant l'envoi : payée ou annulée entre-temps → rien ne part.
  if (payload.block_reason) {
    const message = blockMessage(payload.block_reason);
    await complete(service, reminderId, 'failed', { error: `Non envoyée : ${message}` });
    return { reminderId, status: 'failed', error: message };
  }

  const recipient = payload.client_email?.trim() ?? '';
  if (!isEmail(recipient)) {
    await complete(service, reminderId, 'failed', { error: blockMessage('CLIENT_EMAIL_MISSING') });
    return { reminderId, status: 'failed', error: blockMessage('CLIENT_EMAIL_MISSING') };
  }

  const { data: token } = await service.rpc('issue_document_share_link', {
    p_document_type: 'invoice',
    p_document_id: payload.invoice_id,
    p_actor: payload.user_id,
    p_mark_sent: false,
  });
  const documentUrl = typeof token === 'string' ? `${PUBLIC_SITE_URL}/d/${token}` : null;
  const paymentUrl = payload.include_payment_link ? payload.stripe_payment_link : null;
  const companyName = payload.company_name?.trim() || 'INVEQ';

  const email = buildReminderEmail({
    stage: payload.stage,
    templates: payload.templates,
    values: {
      client: resolveClientName(payload.client_company, payload.client_name),
      numero: payload.number,
      montant: formatEuro(Number(payload.amount_due)),
      echeance: formatFrenchDate(payload.due_at),
      entreprise: companyName,
    },
    documentUrl,
    paymentUrl,
  });

  let providerId: string | null = null;
  let failure: string | null = null;
  try {
    const response = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: `${companyName.replace(/[<>"\r\n]/g, '')} via ${FROM_NAME} <${FROM_ADDRESS}>`,
        to: [recipient],
        ...(isEmail(payload.company_email) ? { reply_to: payload.company_email } : {}),
        subject: email.subject,
        text: email.text,
        html: email.html,
      }),
    });
    const result = (await response.json().catch(() => null)) as { id?: string; message?: string } | null;
    if (response.ok && result?.id) {
      providerId = result.id;
    } else {
      failure = result?.message || `Envoi refusé (${response.status}).`;
    }
  } catch {
    failure = 'Service d’envoi injoignable.';
  }

  await complete(service, reminderId, providerId ? 'sent' : 'failed', {
    recipient,
    subject: email.subject,
    body: email.text,
    providerId,
    error: failure,
  });

  // Visible aussi dans « Historique des envois » (site et application).
  await service.from('sent_documents').insert({
    user_id: payload.user_id,
    company_id: payload.company_id,
    document_type: 'invoice',
    document_id: payload.invoice_id,
    document_number: payload.number,
    recipient_email: recipient,
    subject: email.subject,
    message: email.text,
    channel: 'resend',
    status: providerId ? 'sent' : 'failed',
    provider_message_id: providerId,
  });

  return providerId ? { reminderId, status: 'sent' } : { reminderId, status: 'failed', error: failure ?? undefined };
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed.' }, 405);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const resendKey = Deno.env.get('RESEND_API_KEY')?.trim();
  if (!supabaseUrl || !anonKey || !serviceKey) {
    return jsonResponse({ error: 'Configuration serveur incomplète.' }, 500);
  }
  if (!resendKey) {
    return jsonResponse({ error: 'L’envoi automatique n’est pas encore configuré.' }, 503);
  }
  const service = createClient(supabaseUrl, serviceKey);

  // --- Passage planifié -----------------------------------------------------
  const cronSecret = request.headers.get('x-inveq-cron');
  if (cronSecret) {
    const { data: valid } = await service.rpc('verify_cron_secret', { p_secret: cronSecret });
    if (valid !== true) {
      return jsonResponse({ error: 'Non autorisé.' }, 401);
    }
    await service.rpc('release_stale_invoice_reminders');
    const { data: claimed, error } = await service.rpc('claim_due_invoice_reminders', { p_limit: BATCH_LIMIT });
    if (error) {
      console.error('[send-invoice-reminders] claim', error.message);
      return jsonResponse({ error: 'Lecture des relances impossible.' }, 500);
    }
    const outcomes: Outcome[] = [];
    for (const row of (claimed ?? []) as { reminder_id: string }[]) {
      outcomes.push(await processReminder(service, resendKey, row.reminder_id));
      await sleep(SEND_INTERVAL_MS);
    }
    return jsonResponse({
      processed: outcomes.length,
      sent: outcomes.filter((outcome) => outcome.status === 'sent').length,
      failed: outcomes.filter((outcome) => outcome.status === 'failed').length,
    });
  }

  // --- Relance manuelle -----------------------------------------------------
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) {
    return jsonResponse({ error: 'Non autorisé.' }, 401);
  }
  const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
  const {
    data: { user },
  } = await userClient.auth.getUser();
  if (!user) {
    return jsonResponse({ error: 'Session expirée. Reconnectez-vous.' }, 401);
  }

  const body = (await request.json().catch(() => null)) as { invoiceId?: string } | null;
  const invoiceId = body?.invoiceId?.trim() ?? '';
  if (!/^[0-9a-f-]{36}$/i.test(invoiceId)) {
    return jsonResponse({ error: 'Facture invalide.' }, 400);
  }

  const { data: reminderId, error: claimError } = await service.rpc('claim_manual_invoice_reminder', {
    p_invoice_id: invoiceId,
    p_actor: user.id,
  });
  if (claimError || typeof reminderId !== 'string') {
    const code = Object.keys(BLOCK_MESSAGES).find((key) => claimError?.message?.includes(key));
    return jsonResponse({ error: code ? blockMessage(code) : 'Relance impossible.', code: code ?? null }, code === 'Unauthorized' ? 403 : 400);
  }

  const outcome = await processReminder(service, resendKey, reminderId);
  if (outcome.status !== 'sent') {
    return jsonResponse({ error: outcome.error ?? 'L’envoi a échoué.' }, 502);
  }
  return jsonResponse({ sent: true, reminderId });
});
