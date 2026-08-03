import type { AuthError, Session } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

import { supabase } from '@/lib/supabase';

WebBrowser.maybeCompleteAuthSession();

export const GOOGLE_AUTH_CALLBACK_PATH = 'auth/callback';

export type GoogleOAuthResult = {
  error: AuthError | null;
  session: Session | null;
  canceled?: boolean;
};

export function getGoogleAuthRedirectUrl(): string {
  return Linking.createURL(GOOGLE_AUTH_CALLBACK_PATH);
}

type OAuthUrlParams = {
  access_token?: string;
  refresh_token?: string;
  code?: string;
  error?: string;
  error_description?: string;
};

function readParam(value: string | string[] | null | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function asAuthError(message: string): AuthError {
  return { name: 'AuthError', message } as AuthError;
}

export function parseOAuthRedirectParams(url: string): OAuthUrlParams {
  const parsed = Linking.parse(url);
  const query = parsed.queryParams ?? {};

  const hash = url.includes('#') ? url.slice(url.indexOf('#') + 1) : '';
  const hashParams = new URLSearchParams(hash);

  return {
    access_token:
      readParam(query.access_token) ?? readParam(hashParams.get('access_token')),
    refresh_token:
      readParam(query.refresh_token) ?? readParam(hashParams.get('refresh_token')),
    code: readParam(query.code) ?? readParam(hashParams.get('code')),
    error: readParam(query.error) ?? readParam(hashParams.get('error')),
    error_description:
      readParam(query.error_description) ??
      readParam(hashParams.get('error_description')),
  };
}

export async function createSessionFromOAuthUrl(url: string): Promise<Session | null> {
  const params = parseOAuthRedirectParams(url);

  if (params.error) {
    throw asAuthError(params.error_description ?? params.error);
  }

  if (params.code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(params.code);
    if (error) {
      throw error;
    }
    return data.session;
  }

  if (params.access_token && params.refresh_token) {
    const { data, error } = await supabase.auth.setSession({
      access_token: params.access_token,
      refresh_token: params.refresh_token,
    });
    if (error) {
      throw error;
    }
    return data.session;
  }

  throw asAuthError('Réponse Google invalide.');
}

export async function startGoogleOAuth(): Promise<GoogleOAuthResult> {
  const redirectTo = getGoogleAuthRedirectUrl();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      skipBrowserRedirect: true,
      queryParams: {
        access_type: 'offline',
        prompt: 'select_account',
      },
    },
  });

  if (error) {
    return { error, session: null };
  }

  if (!data.url) {
    return { error: asAuthError('Impossible de démarrer la connexion Google.'), session: null };
  }

  const browserResult = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

  if (browserResult.type === 'cancel' || browserResult.type === 'dismiss') {
    return { error: null, session: null, canceled: true };
  }

  if (browserResult.type !== 'success' || !browserResult.url) {
    return { error: asAuthError('La connexion Google a échoué.'), session: null };
  }

  try {
    const session = await createSessionFromOAuthUrl(browserResult.url);
    return { error: null, session };
  } catch (err) {
    if (err && typeof err === 'object' && 'message' in err) {
      return { error: err as AuthError, session: null };
    }
    return { error: asAuthError('La connexion Google a échoué.'), session: null };
  }
}
