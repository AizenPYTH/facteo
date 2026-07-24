import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

import { requestOpenAiJsonSchema, requestOpenAiTranscription } from '../_shared/openai.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type ProcessVoiceBody = {
  documentType?: 'quote' | 'invoice';
  audioBase64?: string;
  mimeType?: string;
};

const VOICE_COMMAND_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    document_type: {
      type: 'string',
      enum: ['quote', 'invoice'],
    },
    client: { type: 'string' },
    items: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          description: { type: 'string' },
          quantity: { type: 'number' },
          unit: { type: 'string' },
          price_ht: { type: 'number' },
        },
        required: ['description', 'quantity', 'unit', 'price_ht'],
      },
    },
    vat: { type: ['number', 'null'] },
    payment_terms: { type: ['number', 'null'] },
    discount: { type: ['number', 'null'] },
    currency: { type: 'string' },
    payment_method: { type: 'string' },
    confidence: { type: 'number' },
  },
  required: [
    'document_type',
    'client',
    'items',
    'vat',
    'payment_terms',
    'discount',
    'currency',
    'payment_method',
    'confidence',
  ],
};

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

    const body = (await request.json().catch(() => null)) as ProcessVoiceBody | null;
    const documentType = body?.documentType === 'invoice' ? 'invoice' : 'quote';
    const audioBase64 = body?.audioBase64?.trim() ?? '';
    const mimeType = body?.mimeType?.trim() || 'audio/mp4';

    if (audioBase64.length < 100) {
      return jsonResponse({ error: 'Audio invalide.' }, 400);
    }

    const transcript = await requestOpenAiTranscription({
      apiKey: openAiApiKey,
      audioBase64,
      mimeType,
      model: Deno.env.get('OPENAI_TRANSCRIBE_MODEL')?.trim() || 'gpt-4o-mini-transcribe',
      language: 'fr',
    });

    const systemPrompt = [
      'Tu analyses une commande vocale artisan pour INVEQ.',
      'Tu retournes un JSON structuré propre sans blabla.',
      'Comprends les nombres en lettres (ex: "deux heures", "cent vingt euros").',
      'Comprends TVA, remise, délai de paiement, unités.',
      'Les prix doivent être HT.',
      'Si info absente, garde un défaut raisonnable: quantity=1, unit="unité", currency="EUR".',
      'confidence entre 0 et 1.',
    ].join('\n');

    const userPrompt = [
      `Type de document cible: ${documentType}`,
      'Transcription utilisateur:',
      transcript,
    ].join('\n\n');

    const parsedJson = await requestOpenAiJsonSchema({
      apiKey: openAiApiKey,
      model: Deno.env.get('OPENAI_VOICE_MODEL')?.trim() || 'gpt-4.1-mini',
      schemaName: 'voice_command',
      schema: VOICE_COMMAND_SCHEMA,
      systemPrompt,
      userPrompt,
    });

    const command = JSON.parse(parsedJson) as Record<string, unknown>;

    return jsonResponse(
      {
        transcript,
        command: normalizeVoiceCommand(command, documentType),
      },
      200,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inattendue.';
    const status = message === 'OPENAI_TIMEOUT'
      ? 504
      :
      message.includes("n'est pas encore configuré") || message.includes('n’est pas encore configuré')
        ? 503
        : 500;
    return jsonResponse(
      {
        error:
          message === 'OPENAI_TIMEOUT'
            ? "L'assistant IA met trop de temps à répondre. Réessayez."
            : message,
      },
      status,
    );
  }
});

function normalizeVoiceCommand(
  source: Record<string, unknown>,
  fallbackType: 'quote' | 'invoice',
): Record<string, unknown> {
  const rawItems = Array.isArray(source.items) ? source.items : [];

  const items = rawItems
    .map((entry) => {
      if (!entry || typeof entry !== 'object') {
        return null;
      }

      const row = entry as Record<string, unknown>;
      const description = toText(row.description);
      if (!description) {
        return null;
      }

      return {
        description,
        quantity: Math.max(0, toNumber(row.quantity) ?? 1),
        unit: toText(row.unit) || 'unité',
        price_ht: Math.max(0, toNumber(row.price_ht) ?? 0),
      };
    })
    .filter((entry) => Boolean(entry));

  return {
    document_type: source.document_type === 'invoice' ? 'invoice' : fallbackType,
    client: toText(source.client),
    items,
    vat: toNumber(source.vat),
    payment_terms: toNumber(source.payment_terms),
    discount: toNumber(source.discount),
    currency: toText(source.currency).toUpperCase() || 'EUR',
    payment_method: toText(source.payment_method),
    confidence: clamp(toNumber(source.confidence) ?? 0.5, 0, 1),
  };
}

function toText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined) {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function jsonResponse(payload: Record<string, unknown>, status: number): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}
