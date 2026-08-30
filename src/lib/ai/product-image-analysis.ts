import { callAiEdgeFunction } from '@/lib/ai/edge-ai';
import type { ProductImageAnalysis, ProductImageAnalysisInput } from '@/types/ai-product';

type AnalyzeProductImageResponse = ProductImageAnalysis & {
  error?: string;
  analysis?: ProductImageAnalysis;
};

export async function analyzeProductImage(
  input: ProductImageAnalysisInput,
): Promise<ProductImageAnalysis> {
  const payload = await callAiEdgeFunction<AnalyzeProductImageResponse>(
    'analyze-product-image',
    {
      imageBase64: input.imageBase64,
      mimeType: input.mimeType,
      barcodeHint: input.barcodeHint,
    },
    'Analyse IA indisponible. Réessayez dans quelques instants.',
  );

  const root = payload.analysis ?? payload;
  const products = normalizeProductList(root);

  return {
    ...normalizeOne(root),
    products,
  };
}

function normalizeProductList(root: ProductImageAnalysis): ProductImageAnalysis[] {
  if (Array.isArray(root.products) && root.products.length > 0) {
    return root.products.map(normalizeOne).filter((item) => item.title || item.description || item.reference);
  }
  const single = normalizeOne(root);
  return single.title || single.description || single.reference ? [single] : [];
}

function normalizeOne(payload: Partial<ProductImageAnalysis>): ProductImageAnalysis {
  return {
    title: payload.title ?? '',
    brand: payload.brand ?? '',
    model: payload.model ?? '',
    reference: payload.reference ?? '',
    description: payload.description ?? '',
    price_ttc: toNullableNumber(payload.price_ttc),
    price_ht: toNullableNumber(payload.price_ht),
    vat: toNullableNumber(payload.vat),
    currency: payload.currency ?? 'EUR',
    unit: payload.unit ?? 'pièce',
    quantity: Math.max(1, toNullableNumber(payload.quantity) ?? 1),
    confidence: clamp(payload.confidence ?? 0, 0, 1),
    sku: payload.sku ?? '',
    ean: payload.ean ?? '',
    source_url: payload.source_url ?? '',
    image_url: payload.image_url ?? '',
  };
}

function toNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
