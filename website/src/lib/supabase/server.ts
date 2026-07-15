import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

import type { Database } from '@facteo/types/database';

import { getSupabaseAnonKey, getSupabaseUrl } from '@/lib/supabase/env';

export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Ignoré dans les Server Components en lecture seule
        }
      },
    },
  });
}
