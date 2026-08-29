import type { AuthError, Session, User } from '@supabase/supabase-js';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import { makeRedirectUri } from 'expo-auth-session';
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

import { supabase } from '@/lib/supabase';

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
    scheme: 'inveq',
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

    restoreSession();

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
      options: {
        redirectTo,
        skipBrowserRedirect: true,
        queryParams: {
          access_type: 'offline',
          prompt: 'select_account',
        },
      },
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
        const credential = await AppleAuthentication.signInAsync({
          requestedScopes: [
            AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
            AppleAuthentication.AppleAuthenticationScope.EMAIL,
          ],
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
        });

        return { error, session: data.session };
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
                ? String((error as { message: string }).message)
                : 'Connexion Apple impossible.',
            name: 'AuthError',
          } as AuthError,
          session: null,
        };
      }
    }

    // Web / Android : OAuth Apple via navigateur
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
      Platform.OS === 'web'
        ? `${typeof window !== 'undefined' ? window.location.origin : ''}/reinitialiser-mot-de-passe`
        : getRedirectTo();

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
