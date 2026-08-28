import { supabase } from '@/lib/supabase';

export async function callAiEdgeFunction<TResponse>(
  functionName: string,
  payload: Record<string, unknown>,
  fallbackError: string,
): Promise<TResponse> {
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;

  if (!accessToken) {
    throw new Error('Session expirée. Reconnectez-vous pour utiliser l’assistant IA.');
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error('[AI] Auth validation failed before edge call', {
      functionName,
      userError: userError?.message ?? null,
    });
    throw new Error('Session expirée. Reconnectez-vous pour utiliser l’assistant IA.');
  }

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();

  if (!supabaseUrl) {
    throw new Error('Supabase non configuré pour l’assistant IA.');
  }

  const endpoint = `${supabaseUrl.replace(/\/$/, '')}/functions/v1/${functionName}`;
  const projectRef = readSupabaseProjectRef(supabaseUrl);

  const response = await fetchWithTimeout(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      apikey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() || accessToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as
      | { error?: string; code?: string; message?: string }
      | null;
    const rawText = body ? null : await response.text().catch(() => null);
    const edgeErrorMessage = body?.error ?? body?.message ?? rawText ?? fallbackError;

    console.error('[AI] Edge function call failed', {
      functionName,
      endpoint,
      projectRef,
      status: response.status,
      statusText: response.statusText,
      edgeErrorMessage,
      edgeErrorCode: body?.code ?? null,
    });

    throw new Error(formatEdgeHttpError(response.status, functionName, projectRef, edgeErrorMessage));
  }

  const result = (await response.json()) as TResponse;
  return result;
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs = 45_000): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('timeout');
    }
    // Network / DNS / CORS — often wraps a missing Edge Function (404 gateway).
    throw new Error(
      `Impossible de joindre la fonction « ${functionName} ». Vérifiez le déploiement sur le projet Supabase ${projectRef ?? 'inconnu'} (npx supabase functions deploy ${functionName}).`,
    );
  } finally {
    clearTimeout(timeout);
  }
}

export function readAiErrorMessage(error: unknown, defaultMessage: string): string {
  if (!(error instanceof Error)) {
    return defaultMessage;
  }

  const message = error.message || defaultMessage;

  if (
    message.includes("n'est pas encore configuré") ||
    message.includes('n’est pas encore configuré') ||
    message.includes('OPENAI_API_KEY')
  ) {
    return "L'assistant IA n'est pas encore configuré.";
  }

  if (message.includes('Permission refusée')) {
    return message;
  }

  if (message.includes('Network') || message.includes('Failed to fetch')) {
    return 'Connexion réseau indisponible. Vérifiez votre accès Internet.';
  }

  if (message.includes('Session') || message.includes('Unauthorized') || message.includes('Non autorisé')) {
    return 'Session expirée. Reconnectez-vous puis réessayez.';
  }

  if (message.includes('Function introuvable')) {
    return message;
  }

  if (message.includes('Accès refusé')) {
    return "Vous n'avez pas l'autorisation d'utiliser cette fonctionnalité IA.";
  }

  if (message.includes('Erreur serveur')) {
    return message;
  }

  if (message.toLowerCase().includes('timeout')) {
    return 'L’analyse prend trop de temps. Réessayez dans quelques instants.';
  }

  return message;
}

function formatEdgeHttpError(
  status: number,
  functionName: string,
  projectRef: string | null,
  edgeMessage: string,
): string {
  if (status === 401) {
    return 'Session expirée. Reconnectez-vous puis réessayez.';
  }

  if (status === 403) {
    return "Accès refusé à l'assistant IA.";
  }

  if (status === 404) {
    return `Function introuvable (${functionName}). Vérifiez le déploiement sur le projet Supabase ${projectRef ?? 'inconnu'}.`;
  }

  if (status >= 500) {
    return `Erreur serveur IA (${status}): ${edgeMessage}`;
  }

  return edgeMessage;
}

function readSupabaseProjectRef(url: string): string | null {
  try {
    const host = new URL(url).hostname;
    const segments = host.split('.');
    return segments.length > 0 ? segments[0] ?? null : null;
  } catch {
    return null;
  }
}
