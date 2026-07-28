import { supabase } from '@/lib/supabase';
import type { ParseClientsInput, ParseClientsResult, ParsedClientDraft } from '@/types/ai-client';

type ParseClientsResponse = ParseClientsResult & {
  error?: string;
  message?: string;
  code?: string;
};

/**
 * Appelle la Edge Function parse-clients avec des erreurs actionnables.
 * (functions.invoke masque souvent un 404 en « Failed to send a request… »)
 */
export async function parseClientsWithAi(input: ParseClientsInput): Promise<ParseClientsResult> {
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;

  if (!accessToken) {
    throw new Error('Session expirée. Reconnectez-vous pour utiliser l’assistant IA.');
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!supabaseUrl || !anonKey) {
    throw new Error('Configuration Supabase manquante.');
  }

  const endpoint = `${supabaseUrl.replace(/\/$/, '')}/functions/v1/parse-clients`;
  const projectRef = readProjectRef(supabaseUrl);

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        apikey: anonKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: input.text ?? '',
        fileName: input.fileName,
        fileBase64: input.fileBase64,
        mimeType: input.mimeType,
      }),
    });
  } catch {
    throw new Error(
      `Impossible de joindre l’assistant IA (réseau). Vérifiez votre connexion ou le déploiement de parse-clients sur ${projectRef ?? 'Supabase'}.`,
    );
  }

  const payload = (await response.json().catch(() => null)) as ParseClientsResponse | null;

  if (!response.ok) {
    throw new Error(formatHttpError(response.status, payload, projectRef));
  }

  if (payload?.error) {
    throw new Error(String(payload.error));
  }

  return {
    clients: (payload?.clients ?? []).map(normalizeParsedClient),
    warnings: Array.isArray(payload?.warnings) ? payload.warnings.map(String) : [],
  };
}

function formatHttpError(
  status: number,
  payload: ParseClientsResponse | null,
  projectRef: string | null,
): string {
  const edgeMessage = payload?.error ?? payload?.message;
  const code = payload?.code;

  if (status === 404 || code === 'NOT_FOUND') {
    return `Fonction « parse-clients » introuvable sur le projet ${projectRef ?? 'Supabase'}. Déployez-la : npx supabase functions deploy parse-clients --project-ref ${projectRef ?? '<ref>'}`;
  }
  if (status === 401) {
    return 'Session expirée. Reconnectez-vous puis réessayez.';
  }
  if (status === 503) {
    return 'OPENAI_API_KEY manquant dans les secrets Supabase (Edge Functions).';
  }
  if (status === 504) {
    return "L'assistant IA met trop de temps à répondre. Réessayez.";
  }
  if (typeof edgeMessage === 'string' && edgeMessage.trim()) {
    return edgeMessage.trim();
  }
  return `Analyse IA indisponible (HTTP ${status}). Réessayez dans quelques instants.`;
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

function readProjectRef(url: string): string | null {
  try {
    return new URL(url).hostname.split('.')[0] ?? null;
  } catch {
    return null;
  }
}
