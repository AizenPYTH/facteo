import { formatDecimalForInput } from '@/types/quote';
import type { VoiceCommandDraft, VoiceCommandResponse } from '@/types/voice-command';

export function normalizeVoiceCommand(
  transcript: string,
  payload: VoiceCommandResponse,
): VoiceCommandDraft {
  return {
    documentType: payload.document_type,
    transcript: transcript.trim(),
    client: payload.client?.trim() ?? '',
    items: (payload.items ?? []).map((item) => ({
      description: item.description?.trim() ?? '',
      quantity: sanitizePositive(item.quantity, 1),
      unit: item.unit?.trim() || 'unité',
      price_ht: sanitizePositive(item.price_ht, 0),
    })),
    vat: formatNullable(payload.vat, '20'),
    paymentTerms: formatNullable(payload.payment_terms, '30'),
    discount: formatNullable(payload.discount, '0'),
    currency: (payload.currency?.trim() || 'EUR').toUpperCase(),
    paymentMethod: payload.payment_method?.trim() ?? '',
    confidence: clamp(Number(payload.confidence) || 0, 0, 1),
  };
}

export function toNumericInput(value: string, fallback: number): number {
  const normalized = value.trim().replace(/\s/g, '').replace(',', '.');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function sanitizePositive(value: unknown, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.max(0, parsed);
}

function formatNullable(value: unknown, fallback: string): string {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? formatDecimalForInput(parsed) : fallback;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
