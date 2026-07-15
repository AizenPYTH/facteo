'use client';

import type { AuthError, Session, User } from '@supabase/supabase-js';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';

import { supabase } from '@/lib/supabase';
import { getAuthCallbackUrl, getSiteUrl } from '@/lib/site-url';

export type SignInParams = { email: string; password: string };

export type SignUpParams = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  companyName: string;
};

export type AuthResult = { error: AuthError | null; session: Session | null };

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (params: SignInParams) => Promise<AuthResult>;
  signUp: (params: SignUpParams) => Promise<AuthResult>;
  signOut: () => Promise<AuthResult>;
  resetPassword: (email: string) => Promise<AuthResult>;
  updatePassword: (password: string) => Promise<AuthResult>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function restoreSession() {
      const { data, error } = await supabase.auth.getSession();
      if (!mounted) return;
      if (error) {
        setSession(null);
        setUser(null);
      } else {
        setSession(data.session);
        setUser(data.session?.user ?? null);
      }
      setLoading(false);
    }

    void restoreSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted) return;
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async ({ email, password }: SignInParams) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (!error && data.session) {
      // Force la synchronisation cookie ↔ client pour le middleware SSR
      await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      });
    }

    return { error, session: data.session };
  }, []);

  const signUp = useCallback(
    async ({ email, password, firstName, lastName, companyName }: SignUpParams) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: getAuthCallbackUrl('/app'),
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

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    return { error, session: null };
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: getAuthCallbackUrl('/reinitialiser-mot-de-passe'),
    });
    return { error, session: null };
  }, []);

  const updatePassword = useCallback(async (password: string) => {
    const { data, error } = await supabase.auth.updateUser({ password });
    const { data: sessionData } = await supabase.auth.getSession();
    return { error, session: sessionData.session };
  }, []);

  const value = useMemo(
    () => ({
      user,
      session,
      loading,
      signIn,
      signUp,
      signOut,
      resetPassword,
      updatePassword,
    }),
    [user, session, loading, signIn, signUp, signOut, resetPassword, updatePassword],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé dans AuthProvider.');
  }
  return context;
}
