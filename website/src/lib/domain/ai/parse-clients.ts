import { supabase } from '@/lib/supabase';
import type { ParseClientsInput, ParseClientsResult, ParsedClientDraft } from '@/types/ai-client';

type ParseClientsResponse = ParseClientsResult & {
  error?: string;
  message?: string;
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
    return 'Fonction Edge introuvable. Déployez parse-clients sur le bon projet Supabase.';
  }
  if (status === 503) {
    return 'OPENAI_API_KEY manquant dans les secrets Supabase.';
  }
  if (status === 504) {
    return "L'assistant IA met trop de temps à répondre. Réessayez.";
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return 'Analyse IA indisponible. Réessayez dans quelques instants.';
}

export async function parseClientsWithAi(input: ParseClientsInput): Promise<ParseClientsResult> {
  const { data, error } = await supabase.functions.invoke<ParseClientsResponse>('parse-clients', {
    body: {
      text: input.text ?? '',
      fileName: input.fileName,
      fileBase64: input.fileBase64,
      mimeType: input.mimeType,
    },
  });

  if (error) {
    throw new Error(await readErrorMessage(error));
  }

  if (data?.error) {
    throw new Error(String(data.error));
  }

  return {
    clients: (data?.clients ?? []).map(normalizeParsedClient),
    warnings: Array.isArray(data?.warnings) ? data.warnings.map(String) : [],
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
    const payload = (await cloned.json().catch(() => null)) as {
      error?: unknown;
      message?: unknown;
    } | null;
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
