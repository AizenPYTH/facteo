import type { AuthError, Session, User } from '@supabase/supabase-js';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import { makeRedirectUri } from 'expo-auth-session';
import * as Crypto from 'expo-crypto';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';

import { MARKETING_SITE_URL } from '@/constants/marketing/site';
import { supabase } from '@/lib/supabase';

async function createAppleNonce(): Promise<{ rawNonce: string; hashedNonce: string }> {
  const rawNonce = Crypto.randomUUID().replace(/-/g, '') + Crypto.randomUUID().replace(/-/g, '');
  const hashedNonce = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    rawNonce,
    { encoding: Crypto.CryptoEncoding.HEX },
  );
  return { rawNonce, hashedNonce };
}

WebBrowser.maybeCompleteAuthSession();

export type SignInParams = {
  email: string;
  password: string;
};

export type SignUpParams = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  companyName: string;
};

export type AuthResult = {
  error: AuthError | null;
  session: Session | null;
};

export type AuthContextValue = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (params: SignInParams) => Promise<AuthResult>;
  signUp: (params: SignUpParams) => Promise<AuthResult>;
  signInWithGoogle: () => Promise<AuthResult>;
  signInWithApple: () => Promise<AuthResult>;
  resetPasswordForEmail: (email: string) => Promise<AuthResult>;
  signOut: () => Promise<AuthResult>;
};

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function getRedirectTo(): string {
  return makeRedirectUri({
    path: 'auth/callback',
  });
}

async function createSessionFromUrl(url: string): Promise<AuthResult> {
  const { params, errorCode } = QueryParams.getQueryParams(url);

  if (errorCode) {
    return {
      error: { message: String(errorCode), name: 'AuthError' } as AuthError,
      session: null,
    };
  }

  const access_token = params.access_token;
  const refresh_token = params.refresh_token;
  const code = params.code;

  if (code && !access_token) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    return { error, session: data.session };
  }

  if (!access_token || !refresh_token) {
    return { error: null, session: null };
  }

  const { data, error } = await supabase.auth.setSession({ access_token, refresh_token });
  return { error, session: data.session };
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function handleIncomingUrl(url: string | null) {
      if (!url || !url.includes('auth/callback')) {
        return;
      }
      const result = await createSessionFromUrl(url);
      if (!mounted || result.error || !result.session) {
        return;
      }
      setSession(result.session);
      setUser(result.session.user);
    }

    void Linking.getInitialURL().then((url) => {
      void handleIncomingUrl(url);
    });
    const linkingSub = Linking.addEventListener('url', ({ url }) => {
      void handleIncomingUrl(url);
    });

    async function restoreSession() {
      const { data, error } = await supabase.auth.getSession();

      if (!mounted) {
        return;
      }

      if (error) {
        setSession(null);
        setUser(null);
        setLoading(false);
        return;
      }

      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    }

    void restoreSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted) {
        return;
      }

      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      linkingSub.remove();
      subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async ({ email, password }: SignInParams): Promise<AuthResult> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    return { error, session: data.session };
  }, []);

  const signUp = useCallback(
    async ({
      email,
      password,
      firstName,
      lastName,
      companyName,
    }: SignUpParams): Promise<AuthResult> => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            company_name: companyName,
          },
        },
      });

      return { error, session: data.session };
    },
    [],
  );

  const signInWithGoogle = useCallback(async (): Promise<AuthResult> => {
    const redirectTo = getRedirectTo();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo, skipBrowserRedirect: true },
    });

    if (error || !data.url) {
      return { error, session: null };
    }

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.location.assign(data.url);
      return { error: null, session: null };
    }

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (result.type !== 'success' || !('url' in result) || !result.url) {
      return { error: null, session: null };
    }

    return createSessionFromUrl(result.url);
  }, []);

  const signInWithApple = useCallback(async (): Promise<AuthResult> => {
    if (Platform.OS === 'ios') {
      const available = await AppleAuthentication.isAvailableAsync();
      if (!available) {
        return {
          error: {
            message: 'Sign in with Apple n’est pas disponible sur cet appareil.',
            name: 'AuthError',
          } as AuthError,
          session: null,
        };
      }

      try {
        const { rawNonce, hashedNonce } = await createAppleNonce();
        const credential = await AppleAuthentication.signInAsync({
          requestedScopes: [
            AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
            AppleAuthentication.AppleAuthenticationScope.EMAIL,
          ],
          nonce: hashedNonce,
        });

        if (!credential.identityToken) {
          return {
            error: {
              message: 'Impossible d’obtenir le jeton Apple.',
              name: 'AuthError',
            } as AuthError,
            session: null,
          };
        }

        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: 'apple',
          token: credential.identityToken,
          nonce: rawNonce,
        });

        if (error) {
          return {
            error: {
              message: mapAppleAuthError(error.message),
              name: 'AuthError',
            } as AuthError,
            session: null,
          };
        }

        if (credential.fullName && data.user) {
          const given = credential.fullName.givenName?.trim() ?? '';
          const family = credential.fullName.familyName?.trim() ?? '';
          if (given || family) {
            void supabase.auth.updateUser({
              data: {
                first_name: given || undefined,
                last_name: family || undefined,
                full_name: [given, family].filter(Boolean).join(' ') || undefined,
              },
            });
          }
        }

        return { error: null, session: data.session };
      } catch (error) {
        if (
          error &&
          typeof error === 'object' &&
          'code' in error &&
          (error as { code: string }).code === 'ERR_REQUEST_CANCELED'
        ) {
          return { error: null, session: null };
        }

        return {
          error: {
            message:
              error && typeof error === 'object' && 'message' in error
                ? mapAppleAuthError(String((error as { message: string }).message))
                : 'Connexion Apple impossible.',
            name: 'AuthError',
          } as AuthError,
          session: null,
        };
      }
    }

    const redirectTo = getRedirectTo();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: { redirectTo, skipBrowserRedirect: true },
    });

    if (error || !data.url) {
      return { error, session: null };
    }

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.location.assign(data.url);
      return { error: null, session: null };
    }

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (result.type !== 'success' || !('url' in result) || !result.url) {
      return { error: null, session: null };
    }

    return createSessionFromUrl(result.url);
  }, []);

  const resetPasswordForEmail = useCallback(async (email: string): Promise<AuthResult> => {
    const redirectTo =
      Platform.OS === 'web' && typeof window !== 'undefined'
        ? `${window.location.origin}/reinitialiser-mot-de-passe`
        : `${MARKETING_SITE_URL}/reinitialiser-mot-de-passe`;

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });
    return { error, session: null };
  }, []);

  const signOut = useCallback(async (): Promise<AuthResult> => {
    const { error } = await supabase.auth.signOut();
    return { error, session: null };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      loading,
      signIn,
      signUp,
      signInWithGoogle,
      signInWithApple,
      resetPasswordForEmail,
      signOut,
    }),
    [
      user,
      session,
      loading,
      signIn,
      signUp,
      signInWithGoogle,
      signInWithApple,
      resetPasswordForEmail,
      signOut,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function mapAppleAuthError(message: string): string {
  const lower = message.toLowerCase();

  if (
    lower.includes('already registered') ||
    lower.includes('already been registered') ||
    lower.includes('identity is already linked') ||
    lower.includes('user already exists') ||
    lower.includes('email address is already')
  ) {
    return 'Un compte INVEQ existe déjà avec cet e-mail. Connectez-vous avec le même compte (e-mail ou Google) pour retrouver votre abonnement.';
  }

  if (lower.includes('nonce') || lower.includes('audience') || lower.includes('id token')) {
    return 'Connexion Apple refusée. Vérifiez la configuration Sign in with Apple, puis réessayez.';
  }

  if (lower.includes('network') || lower.includes('fetch')) {
    return 'Connexion impossible. Vérifiez votre réseau et réessayez.';
  }

  return message || 'Connexion Apple impossible.';
}
