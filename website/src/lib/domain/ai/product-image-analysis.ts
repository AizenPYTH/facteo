import { supabase } from '@/lib/supabase';

export type ProductImageAnalysis = {
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
  products?: ProductImageAnalysis[];
};

type ProductImageAnalysisResponse = ProductImageAnalysis & {
  analysis?: ProductImageAnalysis;
};

async function readErrorMessage(error: unknown): Promise<string> {
  const status = readStatusCode(error);
  const edgeMessage = await readEdgeContextMessage(error);

  if (edgeMessage) {
    return edgeMessage;
  }

  if (status === 401) {
    return 'Session expirée. Reconnectez-vous puis réessayez.';
  }
  if (status === 404) {
    return "Fonction Edge introuvable. Déployez analyze-product-image sur le bon projet Supabase.";
  }
  if (status === 503) {
    return "OPENAI_API_KEY manquant dans les secrets Supabase.";
  }
  if (status === 504) {
    return "L'assistant IA met trop de temps à répondre. Réessayez.";
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return 'Analyse IA indisponible.';
}

export async function analyzeProductImage(input: {
  imageBase64: string;
  mimeType: string;
}): Promise<ProductImageAnalysis> {
  const { data, error } = await supabase.functions.invoke<ProductImageAnalysisResponse>(
    'analyze-product-image',
    {
      body: {
        imageBase64: input.imageBase64,
        mimeType: input.mimeType,
      },
    },
  );

  if (error) {
    throw new Error(await readErrorMessage(error));
  }

  const payload = data?.analysis ?? data;

  if (!payload || typeof payload !== 'object' || !('title' in payload)) {
    throw new Error("Aucune donnée d'analyse reçue.");
  }

  const products = Array.isArray(payload.products)
    ? payload.products.filter((entry): entry is ProductImageAnalysis => Boolean(entry))
    : undefined;

  return {
    ...payload,
    products: products && products.length > 0 ? products : undefined,
  };
}

function readStatusCode(error: unknown): number | null {
  if (!error || typeof error !== 'object') {
    return null;
  }
  const status = (error as { context?: { status?: number } }).context?.status;
  return typeof status === 'number' ? status : null;
}

async function readEdgeContextMessage(error: unknown): Promise<string | null> {
  if (!error || typeof error !== 'object') {
    return null;
  }

  const context = (error as { context?: Response }).context;
  if (!context || typeof context !== 'object') {
    return null;
  }

  try {
    const cloned = context.clone();
    const payload = (await cloned.json().catch(() => null)) as { error?: unknown; message?: unknown } | null;
    const rawMessage = payload?.error ?? payload?.message;
    if (typeof rawMessage === 'string' && rawMessage.trim()) {
      return rawMessage.trim();
    }
  } catch {
    // noop
  }

  try {
    const cloned = context.clone();
    const text = await cloned.text();
    if (text.trim()) {
      return text.trim();
    }
  } catch {
    // noop
  }

  return null;
}
