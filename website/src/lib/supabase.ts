import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@inveq/types/database';

import { isSupabaseConfigured } from '@/lib/supabase/env';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';

/** Singleton pour la couche domain et les providers client. */
export const supabase = new Proxy({} as SupabaseClient<Database>, {
  get(_target, property, receiver) {
    if (!isSupabaseConfigured()) {
      throw new Error(
        'Configuration Supabase manquante. Ajoutez NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY dans website/.env.local',
      );
    }
    const client = getSupabaseBrowserClient();
    const value = Reflect.get(client, property, receiver);
    return typeof value === 'function' ? value.bind(client) : value;
  },
});

export function assertSupabaseConfigured(): void {
  if (!isSupabaseConfigured()) {
    throw new Error('Configuration Supabase manquante.');
  }
}
