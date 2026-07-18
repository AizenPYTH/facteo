import { callAiEdgeFunction } from '@/lib/ai/edge-ai';
import type { VoiceCommandResponse } from '@/types/voice-command';

export type ProcessVoiceCommandInput = {
  documentType: 'quote' | 'invoice';
  audioBase64: string;
  mimeType: string;
};

export type ProcessVoiceCommandResult = {
  transcript: string;
  command: VoiceCommandResponse;
};

export async function processVoiceCommand(
  input: ProcessVoiceCommandInput,
): Promise<ProcessVoiceCommandResult> {
  const payload = await callAiEdgeFunction<ProcessVoiceCommandResult>(
    'process-voice-command',
    input,
    'Assistant vocal indisponible. Réessayez dans quelques instants.',
  );

  return {
    transcript: typeof payload.transcript === 'string' ? payload.transcript.trim() : '',
    command: {
      document_type: payload.command?.document_type === 'invoice' ? 'invoice' : 'quote',
      client: payload.command?.client ?? '',
      items: normalizeItems(payload.command?.items),
      vat: toNullableNumber(payload.command?.vat),
      payment_terms: toNullableNumber(payload.command?.payment_terms),
      discount: toNullableNumber(payload.command?.discount),
      currency: payload.command?.currency ?? 'EUR',
      payment_method: payload.command?.payment_method ?? '',
      confidence: clamp(Number(payload.command?.confidence) || 0, 0, 1),
    },
  };
}

function normalizeItems(value: unknown): VoiceCommandResponse['items'] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((entry) => {
      if (!entry || typeof entry !== 'object') {
        return null;
      }

      const item = entry as Record<string, unknown>;
      const description = typeof item.description === 'string' ? item.description.trim() : '';

      if (!description) {
        return null;
      }

      return {
        description,
        quantity: Math.max(0, Number(item.quantity) || 0),
        unit: typeof item.unit === 'string' && item.unit.trim() ? item.unit.trim() : 'unité',
        price_ht: Math.max(0, Number(item.price_ht) || 0),
      };
    })
    .filter((entry): entry is VoiceCommandResponse['items'][number] => Boolean(entry));
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
