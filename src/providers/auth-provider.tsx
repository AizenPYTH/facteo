import type { AuthError, Session, User } from '@supabase/supabase-js';
import { createContext, useCallback, useEffect, useMemo, useState, type PropsWithChildren } from 'react';

import {
  createDemoSession,
  getScreenshotDemoCredentials,
  isScreenshotDemo,
} from '@/lib/screenshot-demo';
import { supabase } from '@/lib/supabase';

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
  signOut: () => Promise<AuthResult>;
};

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function invalidCredentialsError(): AuthError {
  return {
    name: 'AuthApiError',
    message: 'Invalid login credentials',
    status: 400,
  } as AuthError;
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    if (isScreenshotDemo()) {
      setLoading(false);
      return () => {
        mounted = false;
      };
    }

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
    if (isScreenshotDemo()) {
      const demo = getScreenshotDemoCredentials();
      const normalizedEmail = email.trim().toLowerCase();
      if (
        normalizedEmail === demo.email.toLowerCase() &&
        password === demo.password
      ) {
        const nextSession = createDemoSession(demo.email) as Session;
        setSession(nextSession);
        setUser(nextSession.user);
        setLoading(false);
        return { error: null, session: nextSession };
      }

      return { error: invalidCredentialsError(), session: null };
    }

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
      if (isScreenshotDemo()) {
        return { error: invalidCredentialsError(), session: null };
      }

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

  const signOut = useCallback(async (): Promise<AuthResult> => {
    if (isScreenshotDemo()) {
      setSession(null);
      setUser(null);
      return { error: null, session: null };
    }

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
      signOut,
    }),
    [user, session, loading, signIn, signUp, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
