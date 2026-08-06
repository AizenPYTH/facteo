import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AuthError, Session, User } from '@supabase/supabase-js';
import { createContext, useCallback, useEffect, useMemo, useState, type PropsWithChildren } from 'react';

import {
  APP_STORE_REVIEW_EMAIL,
  APP_STORE_REVIEW_SESSION_KEY,
  APP_STORE_REVIEW_USER_ID,
  activateAppStoreReviewMode,
  deactivateAppStoreReviewMode,
  isAppStoreReviewCredentials,
} from '@/lib/app-store-review';
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

const SCREENSHOT_DEMO_SESSION_KEY = 'inveq:screenshot-demo-session';

function invalidCredentialsError(): AuthError {
  return {
    name: 'AuthApiError',
    message: 'Invalid login credentials',
    status: 400,
  } as AuthError;
}

async function persistLocalSession(key: string, session: Session | null) {
  if (!session) {
    await AsyncStorage.removeItem(key);
    return;
  }

  await AsyncStorage.setItem(key, JSON.stringify(session));
}

async function readLocalSession(key: string): Promise<Session | null> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as Session;
  } catch {
    await AsyncStorage.removeItem(key);
    return null;
  }
}

async function tryBootstrapReviewerViaEdge(
  email: string,
  password: string,
): Promise<Session | null> {
  try {
    const { data, error } = await supabase.functions.invoke('bootstrap-app-store-reviewer', {
      body: { email, password },
    });

    if (error || !data?.access_token || !data?.refresh_token) {
      return null;
    }

    const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
    });

    if (sessionError || !sessionData.session) {
      return null;
    }

    return sessionData.session;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function restore() {
      if (isScreenshotDemo()) {
        const stored = await readLocalSession(SCREENSHOT_DEMO_SESSION_KEY);
        if (!mounted) return;
        if (stored?.user) {
          setSession(stored);
          setUser(stored.user);
        }
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.getSession();
      if (!mounted) return;

      if (!error && data.session) {
        deactivateAppStoreReviewMode();
        setSession(data.session);
        setUser(data.session.user);
        setLoading(false);
        return;
      }

      const reviewStored = await readLocalSession(APP_STORE_REVIEW_SESSION_KEY);
      if (reviewStored?.user) {
        activateAppStoreReviewMode();
        if (!mounted) return;
        setSession(reviewStored);
        setUser(reviewStored.user);
        setLoading(false);
        return;
      }

      setSession(null);
      setUser(null);
      setLoading(false);
    }

    void restore();

    if (isScreenshotDemo()) {
      return () => {
        mounted = false;
      };
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted) {
        return;
      }

      // Ne pas écraser une session App Review offline par un event Supabase null.
      if (!nextSession) {
        return;
      }

      deactivateAppStoreReviewMode();
      void persistLocalSession(APP_STORE_REVIEW_SESSION_KEY, null);
      setSession(nextSession);
      setUser(nextSession.user);
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
      if (
        email.trim().toLowerCase() === demo.email.toLowerCase() &&
        password === demo.password
      ) {
        const nextSession = createDemoSession(demo.email) as Session;
        await persistLocalSession(SCREENSHOT_DEMO_SESSION_KEY, nextSession);
        setSession(nextSession);
        setUser(nextSession.user);
        setLoading(false);
        return { error: null, session: nextSession };
      }
      return { error: invalidCredentialsError(), session: null };
    }

    if (isAppStoreReviewCredentials(email, password)) {
      // 1) Compte Supabase réel (si email confirmé + abo Max seedé)
      const remote = await supabase.auth.signInWithPassword({ email, password });
      if (remote.data.session) {
        deactivateAppStoreReviewMode();
        await persistLocalSession(APP_STORE_REVIEW_SESSION_KEY, null);
        setSession(remote.data.session);
        setUser(remote.data.session.user);
        setLoading(false);
        return { error: null, session: remote.data.session };
      }

      // 2) Edge function (service role côté Supabase) : confirme + Max + session
      const bootstrapped = await tryBootstrapReviewerViaEdge(email, password);
      if (bootstrapped) {
        deactivateAppStoreReviewMode();
        await persistLocalSession(APP_STORE_REVIEW_SESSION_KEY, null);
        setSession(bootstrapped);
        setUser(bootstrapped.user);
        setLoading(false);
        return { error: null, session: bootstrapped };
      }

      // 3) Fallback offline Max (UI complète pour App Review)
      activateAppStoreReviewMode();
      const nextSession = createDemoSession(
        APP_STORE_REVIEW_EMAIL,
        APP_STORE_REVIEW_USER_ID,
      ) as Session;
      await persistLocalSession(APP_STORE_REVIEW_SESSION_KEY, nextSession);
      setSession(nextSession);
      setUser(nextSession.user);
      setLoading(false);
      return { error: null, session: nextSession };
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
      await persistLocalSession(SCREENSHOT_DEMO_SESSION_KEY, null);
      setSession(null);
      setUser(null);
      return { error: null, session: null };
    }

    deactivateAppStoreReviewMode();
    await persistLocalSession(APP_STORE_REVIEW_SESSION_KEY, null);
    const { error } = await supabase.auth.signOut();
    setSession(null);
    setUser(null);
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
