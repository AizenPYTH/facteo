import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { requestOpenAiJsonSchema } from '../_shared/openai.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type AnalyzeProductBody = {
  imageBase64?: string;
  mimeType?: string;
};

type ProductAnalysis = {
  title: string;
  brand: string;
  model: string;
  reference: string;
  description: string;
  price_ttc: number | null;
  price_ht: number | null;
  vat: number | null;
  currency: string;
  unit: string;
  quantity: number;
  confidence: number;
};

const PRODUCT_ANALYSIS_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    title: { type: 'string' },
    brand: { type: 'string' },
    model: { type: 'string' },
    reference: { type: 'string' },
    description: { type: 'string' },
    price_ttc: { type: ['number', 'null'] },
    price_ht: { type: ['number', 'null'] },
    vat: { type: ['number', 'null'] },
    currency: { type: 'string' },
    unit: { type: 'string' },
    quantity: { type: 'number' },
    confidence: { type: 'number' },
    products: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          title: { type: 'string' },
          brand: { type: 'string' },
          model: { type: 'string' },
          reference: { type: 'string' },
          description: { type: 'string' },
          price_ttc: { type: ['number', 'null'] },
          price_ht: { type: ['number', 'null'] },
          vat: { type: ['number', 'null'] },
          currency: { type: 'string' },
          unit: { type: 'string' },
          quantity: { type: 'number' },
          confidence: { type: 'number' },
        },
        required: [
          'title',
          'brand',
          'model',
          'reference',
          'description',
          'price_ttc',
          'price_ht',
          'vat',
          'currency',
          'unit',
          'quantity',
          'confidence',
        ],
      },
    },
  },
  required: [
    'title',
    'brand',
    'model',
    'reference',
    'description',
    'price_ttc',
    'price_ht',
    'vat',
    'currency',
    'unit',
    'quantity',
    'confidence',
    'products',
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
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();

    if (userError || !user) {
      return jsonResponse({ error: 'Non autorisé.' }, 401);
    }

    const body = (await request.json().catch(() => null)) as AnalyzeProductBody | null;

    if (!body?.imageBase64 || body.imageBase64.trim().length < 100) {
      return jsonResponse({ error: 'Image invalide.' }, 400);
    }

    const mimeType = (body.mimeType ?? 'image/jpeg').trim() || 'image/jpeg';
    const imageDataUrl = `data:${mimeType};base64,${body.imageBase64}`;
    const model = Deno.env.get('OPENAI_VISION_MODEL')?.trim() || 'gpt-4.1-mini';

    const modelOutput = await requestOpenAiJsonSchema({
      apiKey: openAiApiKey,
      model,
      schemaName: 'product_analysis',
      schema: PRODUCT_ANALYSIS_SCHEMA,
      systemPrompt: [
        'Tu es un assistant Factume qui extrait des produits depuis une photo.',
        'Tu dois comprendre le contexte visuel, pas seulement lire du texte.',
        'Si plusieurs prix existent, choisis le prix actuel (et non barré).',
        'Si un prix est présent TTC avec TVA visible, renseigne aussi le HT.',
        'Si aucune TVA n’est visible mais le prix semble TTC, laisse vat à null.',
        'Si aucune information n’est visible, retourne des champs vides/null sans inventer.',
        'La quantité par défaut est 1. L’unité par défaut est "pièce".',
        'La devise par défaut est EUR pour un contexte francophone.',
        'confidence doit représenter ton niveau de certitude entre 0 et 1.',
        'Si plusieurs produits sont visibles (tableau, liste, feuille Excel, capture e-commerce), renseigne products avec tous les produits détectés.',
        'Chaque entrée de products doit contenir les mêmes champs que le produit principal.',
        'Le produit principal (champs top-level) doit être le premier élément pertinent détecté.',
      ].join('\n'),
      userContent: [
        {
          type: 'input_text',
          text: 'Analyse cette image et retourne uniquement les données produit au format JSON.',
        },
        {
          type: 'input_image',
          image_url: imageDataUrl,
        },
      ],
    });

    const parsed = JSON.parse(modelOutput) as Partial<ProductAnalysis> & {
      products?: Array<Partial<ProductAnalysis>> | null;
    };
    const normalizedPrimary = normalizeProductAnalysis(parsed);
    const normalizedProducts = normalizeProducts(parsed.products, normalizedPrimary);
    const response = {
      ...normalizedProducts[0],
      products: normalizedProducts,
    };

    return jsonResponse(response, 200);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inattendue.';
    if (message === 'OPENAI_TIMEOUT') {
      return jsonResponse({ error: "L'assistant IA met trop de temps à répondre. Réessayez." }, 504);
    }
    return jsonResponse({ error: message }, 500);
  }
});

function normalizeProductAnalysis(source: Partial<ProductAnalysis>): ProductAnalysis {
  const vat = toNullableNumber(source.vat);
  const priceTtc = toNullableNumber(source.price_ttc);
  const directPriceHt = toNullableNumber(source.price_ht);
  const inferredPriceHt =
    directPriceHt !== null ? directPriceHt : priceTtc !== null ? computeHt(priceTtc, vat) : null;

  return {
    title: normalizeText(source.title),
    brand: normalizeText(source.brand),
    model: normalizeText(source.model),
    reference: normalizeText(source.reference),
    description: normalizeText(source.description),
    price_ttc: priceTtc,
    price_ht: inferredPriceHt,
    vat,
    currency: normalizeCurrency(source.currency),
    unit: normalizeText(source.unit) || 'pièce',
    quantity: Math.max(1, toNullableNumber(source.quantity) ?? 1),
    confidence: clamp(toNullableNumber(source.confidence) ?? 0.5, 0, 1),
  };
}

function normalizeProducts(
  rawProducts: Array<Partial<ProductAnalysis>> | null | undefined,
  fallback: ProductAnalysis,
): ProductAnalysis[] {
  const normalized =
    Array.isArray(rawProducts) && rawProducts.length > 0
      ? rawProducts.slice(0, 20).map(normalizeProductAnalysis)
      : [fallback];

  const filtered = normalized.filter((item) => item.title || item.description || item.reference);
  return filtered.length > 0 ? filtered : [fallback];
}

function toNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function computeHt(priceTtc: number, vat: number | null): number | null {
  if (vat === null) {
    return null;
  }

  const divider = 1 + Math.max(0, vat) / 100;
  return divider > 0 ? priceTtc / divider : null;
}

function normalizeText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeCurrency(value: unknown): string {
  const currency = normalizeText(value);
  return currency ? currency.toUpperCase() : 'EUR';
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
