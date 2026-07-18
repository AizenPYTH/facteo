import { callAiEdgeFunction } from '@/lib/ai/edge-ai';
import type { ProductImageAnalysis, ProductImageAnalysisInput } from '@/types/ai-product';

type AnalyzeProductImageResponse = ProductImageAnalysis & {
  error?: string;
};

export async function analyzeProductImage(
  input: ProductImageAnalysisInput,
): Promise<ProductImageAnalysis> {
  const payload = await callAiEdgeFunction<AnalyzeProductImageResponse>(
    'analyze-product-image',
    input,
    'Analyse IA indisponible. Réessayez dans quelques instants.',
  );

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
