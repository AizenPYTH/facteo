import { callAiEdgeFunction } from '@/lib/ai/edge-ai';
import type { ParseClientsInput, ParseClientsResult, ParsedClientDraft } from '@/types/ai-client';

type ParseClientsResponse = ParseClientsResult & { error?: string };

export async function parseClientsWithAi(input: ParseClientsInput): Promise<ParseClientsResult> {
  const payload = await callAiEdgeFunction<ParseClientsResponse>(
    'parse-clients',
    {
      text: input.text ?? '',
      fileName: input.fileName,
      fileBase64: input.fileBase64,
      mimeType: input.mimeType,
    },
    'Analyse IA indisponible. Réessayez dans quelques instants.',
  );

  return {
    clients: (payload.clients ?? []).map(normalizeParsedClient),
    warnings: Array.isArray(payload.warnings) ? payload.warnings.map(String) : [],
  };
}

function normalizeParsedClient(raw: Partial<ParsedClientDraft>): ParsedClientDraft {
  return {
    company: raw.company ?? '',
    firstName: raw.firstName ?? '',
    lastName: raw.lastName ?? '',
    address: raw.address ?? '',
    addressLine2: raw.addressLine2 ?? '',
    postalCode: raw.postalCode ?? '',
    city: raw.city ?? '',
    region: raw.region ?? '',
    country: raw.country ?? '',
    phone: raw.phone ?? '',
    email: raw.email ?? '',
    website: raw.website ?? '',
    vatNumber: (raw.vatNumber ?? '').replace(/\s/g, '').toUpperCase(),
    siren: (raw.siren ?? '').replace(/\D/g, ''),
    siret: (raw.siret ?? '').replace(/\D/g, ''),
    notes: raw.notes ?? '',
    confidence: Math.min(1, Math.max(0, Number(raw.confidence) || 0)),
    ambiguities: Array.isArray(raw.ambiguities)
      ? raw.ambiguities.map((a) => ({
          field: a.field ?? '',
          options: Array.isArray(a.options) ? a.options.map(String) : [],
          message: a.message ?? '',
        }))
      : [],
  };
}

export function parsedClientToFormValues(client: ParsedClientDraft) {
  return {
    lastName: client.lastName || client.company || 'Client',
    firstName: client.firstName,
    company: client.company,
    email: client.email,
    phone: client.phone,
    address: client.address,
    addressLine2: client.addressLine2,
    postalCode: client.postalCode,
    city: client.city,
    region: client.region,
    country: client.country || 'France',
    website: client.website,
    siren: client.siren,
    siret: client.siret,
    vatNumber: client.vatNumber,
    notes: client.notes,
  };
}
