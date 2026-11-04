import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

import { requestOpenAiJsonSchema, requestOpenAiTranscription } from '../_shared/openai.ts';
import { assertUserHasFeature } from '../_shared/entitlements.ts';

/**
 * Assistant vocal (après « Dis Siri, facture INVEQ ») : comprend la réponse
 * dite à voix haute à une question de l'app.
 *
 * POST { stage: 'confirm_invoice' | 'confirm_send', audioBase64, mimeType } ou { stage, transcript }
 * → { transcript, action, email }
 *
 * - confirm_invoice : « Je crée la facture ? » → confirm | confirm_and_send | cancel | unclear
 * - confirm_send : « Je l'envoie par mail ? » → send | cancel | unclear
 * `email` : adresse dictée (« martin arobase gmail point com »), sinon null.
 * Ni l'audio ni la transcription ne sont conservés.
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type Stage = 'confirm_invoice' | 'confirm_send';

type ReplyBody = {
  stage?: Stage;
  audioBase64?: string;
  mimeType?: string;
  transcript?: string;
};

const ACTIONS: Record<Stage, string[]> = {
  confirm_invoice: ['confirm', 'confirm_and_send', 'cancel', 'unclear'],
  confirm_send: ['send', 'cancel', 'unclear'],
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (request.method !== 'POST') {
      return jsonResponse({ error: 'Method not allowed.' }, 405);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const openAiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!supabaseUrl || !supabaseAnonKey) {
      return jsonResponse({ error: 'Configuration serveur incomplète.' }, 500);
    }
    if (!openAiApiKey) {
      return jsonResponse({ error: "L'assistant IA n'est pas encore configuré." }, 503);
    }

    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return jsonResponse({ error: 'Non autorisé.' }, 401);
    }
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();
    if (userError || !user) {
      return jsonResponse({ error: 'Non autorisé.' }, 401);
    }

    try {
      await assertUserHasFeature(userClient, user.id, 'ai_assistant');
    } catch {
      return jsonResponse({ error: 'L’assistant IA est réservé à l’offre Max.' }, 403);
    }

    const body = (await request.json().catch(() => null)) as ReplyBody | null;
    const stage: Stage = body?.stage === 'confirm_send' ? 'confirm_send' : 'confirm_invoice';
    const dictated = body?.transcript?.trim().slice(0, 1000) ?? '';
    const audioBase64 = body?.audioBase64?.trim() ?? '';
    if (!dictated && audioBase64.length < 100) {
      return jsonResponse({ error: 'Audio invalide.' }, 400);
    }
    // Une réponse courte : quelques secondes d'audio suffisent largement.
    if (audioBase64.length > 4_000_000) {
      return jsonResponse({ error: 'Réponse trop longue.' }, 413);
    }

    const transcript = dictated
      ? dictated
      : await requestOpenAiTranscription({
          apiKey: openAiApiKey,
          audioBase64,
          mimeType: body?.mimeType?.trim() || 'audio/mp4',
          model: Deno.env.get('OPENAI_TRANSCRIBE_MODEL')?.trim() || 'gpt-4o-mini-transcribe',
          language: 'fr',
        });

    const actions = ACTIONS[stage];
    const question =
      stage === 'confirm_invoice'
        ? "L'application a demandé : « Je crée cette facture ? »"
        : "L'application a demandé : « Je l'envoie par e-mail au client ? »";

    const parsed = await requestOpenAiJsonSchema({
      apiKey: openAiApiKey,
      model: Deno.env.get('OPENAI_VOICE_MODEL')?.trim() || 'gpt-4.1-mini',
      schemaName: 'voice_assistant_reply',
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          action: { type: 'string', enum: actions },
          email: { type: ['string', 'null'] },
        },
        required: ['action', 'email'],
      },
      systemPrompt: [
        "Tu classes la réponse orale d'un artisan à une question de son logiciel de facturation.",
        question,
        stage === 'confirm_invoice'
          ? 'confirm : il accepte (oui, ok, vas-y, valide, c’est bon). confirm_and_send : il accepte ET demande l’envoi par mail. cancel : il refuse ou veut modifier. unclear : sinon.'
          : 'send : il accepte l’envoi (oui, envoie, vas-y), y compris s’il donne une adresse. cancel : il refuse. unclear : sinon.',
        'email : l’adresse e-mail dictée, reconstituée en minuscules (« arobase » = @, « point » = .,'
          + ' « tiret » = -, « tiret du bas » = _), sans espace ; null si aucune adresse n’est dite.',
      ].join('\n'),
      userPrompt: `Réponse : ${transcript}`,
    });

    const result = JSON.parse(parsed) as { action?: unknown; email?: unknown };
    const action = typeof result.action === 'string' && actions.includes(result.action) ? result.action : 'unclear';
    const email =
      typeof result.email === 'string' && EMAIL_PATTERN.test(result.email.trim().toLowerCase())
        ? result.email.trim().toLowerCase()
        : null;

    return jsonResponse({ transcript, action, email }, 200);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inattendue.';
    return jsonResponse(
      {
        error:
          message === 'OPENAI_TIMEOUT'
            ? "L'assistant IA met trop de temps à répondre. Réessayez."
            : 'Réponse non comprise. Réessayez.',
      },
      message === 'OPENAI_TIMEOUT' ? 504 : 500,
    );
  }
});

function jsonResponse(payload: Record<string, unknown>, status: number): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
