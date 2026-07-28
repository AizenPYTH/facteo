import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { requestOpenAiJsonSchema } from '../_shared/openai.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type ParseClientsBody = {
  text?: string;
  fileName?: string;
  fileBase64?: string;
  mimeType?: string;
};

const CLIENT_FIELD_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    company: { type: 'string' },
    firstName: { type: 'string' },
    lastName: { type: 'string' },
    address: { type: 'string' },
    addressLine2: { type: 'string' },
    postalCode: { type: 'string' },
    city: { type: 'string' },
    region: { type: 'string' },
    country: { type: 'string' },
    phone: { type: 'string' },
    email: { type: 'string' },
    website: { type: 'string' },
    vatNumber: { type: 'string' },
    siren: { type: 'string' },
    siret: { type: 'string' },
    notes: { type: 'string' },
    confidence: { type: 'number' },
    ambiguities: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          field: { type: 'string' },
          options: { type: 'array', items: { type: 'string' } },
          message: { type: 'string' },
        },
        required: ['field', 'options', 'message'],
      },
    },
  },
  required: [
    'company',
    'firstName',
    'lastName',
    'address',
    'addressLine2',
    'postalCode',
    'city',
    'region',
    'country',
    'phone',
    'email',
    'website',
    'vatNumber',
    'siren',
    'siret',
    'notes',
    'confidence',
    'ambiguities',
  ],
};

const PARSE_CLIENTS_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    clients: {
      type: 'array',
      items: CLIENT_FIELD_SCHEMA,
    },
    warnings: {
      type: 'array',
      items: { type: 'string' },
    },
  },
  required: ['clients', 'warnings'],
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

    const body = (await request.json().catch(() => null)) as ParseClientsBody | null;
    let text = body?.text?.trim() ?? '';

    if ((!text || text.length < 3) && body?.fileBase64) {
      text = await extractTextFromFile(body.fileBase64, body.mimeType, body.fileName);
    }

    if (!text || text.trim().length < 3) {
      return jsonResponse({ error: 'Aucun texte exploitable à analyser.' }, 400);
    }

    if (text.length > 60_000) {
      text = text.slice(0, 60_000);
    }

    const model = Deno.env.get('OPENAI_TEXT_MODEL')?.trim() || 'gpt-4.1-mini';

    const modelOutput = await requestOpenAiJsonSchema({
      apiKey: openAiApiKey,
      model,
      schemaName: 'parse_clients',
      schema: PARSE_CLIENTS_SCHEMA,
      systemPrompt: [
        'Tu es un assistant INVEQ qui extrait des fiches clients depuis du texte collé, un email, un CSV ou un carnet d’adresses.',
        'Détecte automatiquement s’il y a un ou plusieurs clients.',
        'Remplis tous les champs disponibles. Si une info est absente, laisse une chaîne vide.',
        'Ne jamais inventer de SIREN, TVA, email ou téléphone.',
        'Sépare prénom et nom quand c’est possible. Si un seul nom est donné, mets-le dans lastName.',
        'address = ligne principale, addressLine2 = complément (bâtiment, CC, bloc…).',
        'region = région / district / état si présent.',
        'country en français si possible (Portugal, France, etc.).',
        'notes = informations restantes utiles non mappées.',
        'Si une ambiguïté existe (plusieurs téléphones, prénom/nom flous), renseigne ambiguities.',
        'confidence entre 0 et 1 pour chaque client.',
      ].join('\n'),
      userPrompt: `Extrais les clients depuis ce texte:\n\n${text}`,
    });

    const parsed = JSON.parse(modelOutput) as {
      clients?: Array<Record<string, unknown>>;
      warnings?: string[];
    };

    const clients = (parsed.clients ?? []).map(normalizeClient);
    const warnings = Array.isArray(parsed.warnings)
      ? parsed.warnings.map((w) => String(w))
      : [];

    if (clients.length === 0) {
      return jsonResponse(
        {
          clients: [],
          warnings: [...warnings, 'Aucun client détecté dans le texte fourni.'],
        },
        200,
      );
    }

    return jsonResponse({ clients, warnings }, 200);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inattendue.';
    if (message === 'OPENAI_TIMEOUT') {
      return jsonResponse({ error: 'L’analyse prend trop de temps. Réessayez.' }, 504);
    }
    return jsonResponse({ error: message }, 500);
  }
});

function normalizeClient(raw: Record<string, unknown>) {
  const ambiguities = Array.isArray(raw.ambiguities)
    ? raw.ambiguities.map((item) => {
        const row = (item ?? {}) as Record<string, unknown>;
        return {
          field: String(row.field ?? ''),
          options: Array.isArray(row.options) ? row.options.map((o) => String(o)) : [],
          message: String(row.message ?? ''),
        };
      })
    : [];

  return {
    company: String(raw.company ?? ''),
    firstName: String(raw.firstName ?? ''),
    lastName: String(raw.lastName ?? ''),
    address: String(raw.address ?? ''),
    addressLine2: String(raw.addressLine2 ?? ''),
    postalCode: String(raw.postalCode ?? ''),
    city: String(raw.city ?? ''),
    region: String(raw.region ?? ''),
    country: String(raw.country ?? ''),
    phone: String(raw.phone ?? ''),
    email: String(raw.email ?? ''),
    website: String(raw.website ?? ''),
    vatNumber: String(raw.vatNumber ?? '').replace(/\s/g, '').toUpperCase(),
    siren: String(raw.siren ?? '').replace(/\D/g, ''),
    siret: String(raw.siret ?? '').replace(/\D/g, ''),
    notes: String(raw.notes ?? ''),
    confidence: clampNumber(raw.confidence, 0, 1),
    ambiguities,
  };
}

function clampNumber(value: unknown, min: number, max: number): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.min(max, Math.max(min, n));
}

async function extractTextFromFile(
  fileBase64: string,
  mimeType?: string,
  fileName?: string,
): Promise<string> {
  const mime = (mimeType ?? '').toLowerCase();
  const name = (fileName ?? '').toLowerCase();
  const bytes = base64ToUint8Array(fileBase64);

  if (
    mime.includes('text') ||
    mime.includes('csv') ||
    name.endsWith('.txt') ||
    name.endsWith('.csv') ||
    name.endsWith('.md')
  ) {
    return new TextDecoder().decode(bytes);
  }

  // Best-effort binary → UTF-8 for email/PDF text streams; AI still parses residual text.
  try {
    const decoded = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
    const printable = decoded.replace(/[^\x09\x0A\x0D\x20-\x7E\u00A0-\u024F]/g, ' ');
    return printable.replace(/[ \t]{2,}/g, ' ').trim();
  } catch {
    return '';
  }
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function jsonResponse(payload: Record<string, unknown>, status: number): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
