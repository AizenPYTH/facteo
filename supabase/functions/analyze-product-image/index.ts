import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { requestOpenAiJsonSchema } from '../_shared/openai.ts';
import { assertUserHasFeature } from '../_shared/entitlements.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type AnalyzeProductBody = {
  imageBase64?: string;
  mimeType?: string;
  /** `invoices` : découpe l'image en factures (écran « Créer plusieurs factures »). */
  mode?: 'products' | 'invoices';
};

/**
 * Règle commune aux deux modes : l'IA recopie, elle ne calcule jamais.
 * Les erreurs constatées venaient de montants recalculés ou « corrigés »
 * par le modèle. Toute conversion (TTC → HT, total → prix unitaire) est
 * faite ensuite par le code, de façon déterministe.
 */
const COPY_ONLY_RULES = [
  'RÈGLE ABSOLUE : tu RECOPIES, tu ne calcules JAMAIS.',
  'Recopie chaque nombre exactement comme il est imprimé, chiffre par chiffre, virgule décimale comprise (1 234,50 → 1234.5).',
  'N’additionne rien, ne multiplie rien, ne convertis rien entre HT et TTC, n’arrondis rien, ne corrige aucune valeur même si elle te semble fausse.',
  'Si une valeur n’est pas imprimée, mets null (ou une chaîne vide) : ne la déduis pas des autres.',
  'Recopie les libellés mot pour mot, sans les reformuler ni les traduire.',
  'Relis chaque nombre sur l’image avant de répondre : un chiffre mal lu est la pire erreur possible.',
];

const INVOICE_LINE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    title: { type: 'string' },
    description: { type: 'string' },
    quantity: { type: ['number', 'null'] },
    unit: { type: 'string' },
    unit_price: { type: ['number', 'null'] },
    price_kind: { type: 'string', enum: ['ht', 'ttc', 'unknown'] },
    vat_rate: { type: ['number', 'null'] },
    line_total: { type: ['number', 'null'] },
  },
  required: ['title', 'description', 'quantity', 'unit', 'unit_price', 'price_kind', 'vat_rate', 'line_total'],
};

const INVOICES_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    invoices: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          client_name: { type: 'string' },
          client_address: { type: 'string' },
          issued_date: { type: ['string', 'null'] },
          reference: { type: 'string' },
          lines: { type: 'array', items: INVOICE_LINE_SCHEMA },
        },
        required: ['client_name', 'client_address', 'issued_date', 'reference', 'lines'],
      },
    },
  },
  required: ['invoices'],
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

    try {
      await assertUserHasFeature(userClient, user.id, 'ai_assistant');
    } catch (entitlementError) {
      const message =
        entitlementError instanceof Error && entitlementError.message.startsWith('FONCTIONNALITE_REQUISE')
          ? 'L’assistant IA est réservé à l’offre Max.'
          : entitlementError instanceof Error
            ? entitlementError.message
            : 'Droits insuffisants.';
      return jsonResponse({ error: message }, 403);
    }

    const body = (await request.json().catch(() => null)) as AnalyzeProductBody | null;

    if (!body?.imageBase64 || body.imageBase64.trim().length < 100) {
      return jsonResponse({ error: 'Image invalide.' }, 400);
    }

    const mimeType = (body.mimeType ?? 'image/jpeg').trim() || 'image/jpeg';
    const imageDataUrl = `data:${mimeType};base64,${body.imageBase64}`;
    // gpt-4.1 lit nettement mieux les chiffres que la version mini ; le secret
    // OPENAI_VISION_MODEL permet toujours d'en choisir un autre.
    const model = Deno.env.get('OPENAI_VISION_MODEL')?.trim() || 'gpt-4.1';

    if (body.mode === 'invoices') {
      const invoicesOutput = await requestOpenAiJsonSchema({
        apiKey: openAiApiKey,
        model,
        temperature: 0,
        schemaName: 'invoices_analysis',
        schema: INVOICES_SCHEMA,
        systemPrompt: [
          'Tu es un assistant INVEQ qui transforme une capture (commandes, ventes, relevé, tableau) en factures à émettre.',
          ...COPY_ONLY_RULES,
          'Une facture = un client ou une commande distincte. Si l’image montre plusieurs commandes ou plusieurs clients, crée une entrée par commande, dans l’ordre de l’image.',
          'Pour chaque facture, recopie TOUTES les lignes facturées, frais compris (livraison, port, service, emballage…), sans les sous-totaux, totaux ni montants de TVA.',
          'client_name : nom du client ou de l’acheteur tel qu’imprimé, sinon chaîne vide. client_address : son adresse telle qu’imprimée, sinon chaîne vide.',
          'issued_date : date de la commande au format AAAA-MM-JJ si elle est imprimée, sinon null.',
          'reference : numéro de commande ou de référence tel qu’imprimé, sinon chaîne vide.',
          'Pour chaque ligne : title = libellé exact ; description = détail éventuel (taille, couleur…) ou chaîne vide ; quantity = quantité imprimée ou null ; unit_price = prix unitaire imprimé ou null ; line_total = total de la ligne imprimé ou null ; vat_rate = taux de TVA imprimé ou null.',
          'price_kind : "ht" si le document indique que les prix sont HT, "ttc" s’il indique TTC ou s’il s’agit manifestement d’un prix payé par un particulier, sinon "unknown".',
          'Une ligne de frais offerte (0 €) est recopiée avec 0.',
        ].join('\n'),
        userContent: [
          { type: 'input_text', text: 'Recopie les factures présentes sur cette image au format JSON, sans rien calculer.' },
          { type: 'input_image', image_url: imageDataUrl, detail: 'high' },
        ],
      });

      const parsedInvoices = JSON.parse(invoicesOutput) as { invoices?: unknown[] };
      return jsonResponse({ invoices: normalizeInvoices(parsedInvoices.invoices) }, 200);
    }

    const modelOutput = await requestOpenAiJsonSchema({
      apiKey: openAiApiKey,
      model,
      temperature: 0,
      schemaName: 'product_analysis',
      schema: PRODUCT_ANALYSIS_SCHEMA,
      systemPrompt: [
        'Tu es un assistant INVEQ qui extrait des produits depuis une photo.',
        ...COPY_ONLY_RULES,
        'Si plusieurs prix existent, choisis le prix actuel (et non barré).',
        'Si le prix imprimé est TTC, mets-le dans price_ttc et laisse price_ht à null ; s’il est HT, mets-le dans price_ht et laisse price_ttc à null. Ne remplis les deux que si les deux sont imprimés.',
        'Si aucune TVA n’est imprimée, laisse vat à null.',
        'Si aucune information n’est visible, retourne des champs vides/null sans inventer.',
        'La quantité par défaut est 1. L’unité par défaut est "pièce".',
        'La devise par défaut est EUR pour un contexte francophone.',
        'confidence doit représenter ton niveau de certitude entre 0 et 1.',
        'Si plusieurs produits sont visibles (tableau, liste, feuille Excel, capture e-commerce), renseigne products avec tous les produits détectés.',
        'Sur une commande, un panier, un ticket ou une facture, products doit contenir TOUTES les lignes facturées, dans l’ordre du document, sans en omettre aucune.',
        'Cela inclut les lignes qui ne sont pas des produits : frais de livraison, frais de port, expédition, emballage, frais de service, frais de dossier, installation, main-d’œuvre, déplacement, supplément, garantie, abonnement.',
        'Chaque ligne de frais devient une entrée de products avec son libellé exact dans title (par exemple « Frais de livraison ») et son montant, quantité 1 et unité "forfait".',
        'Une ligne de frais à 0 (livraison offerte) est incluse avec un prix de 0.',
        'N’ajoute pas comme ligne les sous-totaux, le total, le montant de TVA ni les remises globales.',
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
          detail: 'high',
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
      ? rawProducts.slice(0, 60).map(normalizeProductAnalysis)
      : [fallback];

  const filtered = normalized.filter((item) => item.title || item.description || item.reference);
  return filtered.length > 0 ? filtered : [fallback];
}

type InvoiceLineAnalysis = {
  title: string;
  description: string;
  quantity: number | null;
  unit: string;
  unit_price: number | null;
  price_kind: 'ht' | 'ttc' | 'unknown';
  vat_rate: number | null;
  line_total: number | null;
};

function normalizeInvoices(raw: unknown[] | undefined) {
  return (Array.isArray(raw) ? raw : [])
    .slice(0, 30)
    .map((entry) => {
      const source = (entry ?? {}) as Record<string, unknown>;
      const lines = (Array.isArray(source.lines) ? source.lines : [])
        .slice(0, 80)
        .map((line): InvoiceLineAnalysis => {
          const item = (line ?? {}) as Record<string, unknown>;
          const kind = item.price_kind;
          return {
            title: normalizeText(item.title),
            description: normalizeText(item.description),
            quantity: toNullableNumber(item.quantity),
            unit: normalizeText(item.unit),
            unit_price: toNullableNumber(item.unit_price),
            price_kind: kind === 'ht' || kind === 'ttc' ? kind : 'unknown',
            vat_rate: toNullableNumber(item.vat_rate),
            line_total: toNullableNumber(item.line_total),
          };
        })
        .filter((line) => line.title || line.description);
      const issued = normalizeText(source.issued_date);

      return {
        client_name: normalizeText(source.client_name),
        client_address: normalizeText(source.client_address),
        issued_date: /^\d{4}-\d{2}-\d{2}$/.test(issued) ? issued : null,
        reference: normalizeText(source.reference),
        lines,
      };
    })
    .filter((invoice) => invoice.lines.length > 0);
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
