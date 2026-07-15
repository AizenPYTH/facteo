import { createBrowserClient } from '@supabase/ssr';

import type { Database } from '@facteo/types/database';

import { getSupabaseAnonKey, getSupabaseUrl } from '@/lib/supabase/env';

let browserClient: ReturnType<typeof createBrowserClient<Database>> | null = null;

/**
 * Client navigateur Supabase SSR — persiste la session dans les cookies
 * pour que le middleware Next.js puisse la lire après connexion.
 */
export function getSupabaseBrowserClient() {
  if (!browserClient) {
    browserClient = createBrowserClient<Database>(getSupabaseUrl(), getSupabaseAnonKey());
  }
  return browserClient;
}
