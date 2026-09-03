import 'react-native-url-polyfill/auto';

import { createClient } from '@supabase/supabase-js';

import { createSupabaseAuthStorage } from '@/lib/supabase/auth-storage';
import type { Database } from '@/types/database';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

/**
 * Ne jamais `throw` au chargement du module : en release iOS une exception
 * synchrone à l’import tue le process (sortie immédiate TestFlight).
 * Un client placeholder laisse l’UI s’afficher si les env EAS manquent.
 */
const resolvedUrl = supabaseUrl || 'https://invalid.supabase.co';
const resolvedAnonKey = supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.invalid';

export const supabase = createClient<Database>(resolvedUrl, resolvedAnonKey, {
  auth: {
    storage: createSupabaseAuthStorage(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: typeof window !== 'undefined',
  },
});
