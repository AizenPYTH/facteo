import type { User } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

import { extractAuthIdentity } from '@/lib/domain/auth/identity';
import { logSupabaseError } from '@/lib/supabase/errors';
import type { Database } from '@inveq/types/database';

type AppSupabase = SupabaseClient<Database>;

/**
 * Garantit profil (+ identité Google/e-mail) et renvoie le flag onboarding.
 * Ne crée pas d’entreprise (géré par handle_new_user / create_company_for_user).
 */
export async function syncUserProfileAfterAuth(
  supabase: AppSupabase,
  user: User,
): Promise<{ onboardingCompleted: boolean }> {
  const identity = extractAuthIdentity(user);

  try {
    const { error: ensureError } = await supabase.rpc('ensure_profile_exists');
    if (ensureError) {
      logSupabaseError('syncUserProfileAfterAuth.ensure', ensureError);
    }
  } catch (error) {
    logSupabaseError(
      'syncUserProfileAfterAuth.ensure',
      error instanceof Error ? error : { message: String(error) },
    );
  }

  const { data: existing, error: fetchError } = await supabase
    .from('profiles')
    .select('first_name, last_name, email, avatar_url, onboarding_completed')
    .eq('id', user.id)
    .maybeSingle();

  if (fetchError) {
    logSupabaseError('syncUserProfileAfterAuth.fetch', fetchError);
  }

  const payload: {
    id: string;
    updated_at: string;
    email?: string | null;
    first_name?: string | null;
    last_name?: string | null;
    avatar_url?: string | null;
    onboarding_completed?: boolean;
  } = {
    id: user.id,
    updated_at: new Date().toISOString(),
  };

  payload.email = existing?.email || identity.email;
  payload.first_name = existing?.first_name || identity.firstName;
  payload.last_name = existing?.last_name || identity.lastName;
  payload.avatar_url = existing?.avatar_url || identity.avatarUrl;

  if (existing?.onboarding_completed == null) {
    payload.onboarding_completed = false;
  }

  const { error: upsertError } = await supabase
    .from('profiles')
    .upsert(payload, { onConflict: 'id' });

  if (upsertError) {
    logSupabaseError('syncUserProfileAfterAuth.upsert', upsertError);
  }

  // Si aucune entreprise (edge case Google), en créer une
  const { data: memberships } = await supabase
    .from('company_members')
    .select('company_id')
    .eq('user_id', user.id)
    .limit(1);

  if (!memberships?.length) {
    const { error: companyError } = await supabase.rpc('create_company_for_user', {
      p_name: '',
    });
    if (companyError) {
      logSupabaseError('syncUserProfileAfterAuth.company', companyError);
    }
  }

  return {
    onboardingCompleted: Boolean(existing?.onboarding_completed),
  };
}

export async function resolvePostAuthDestination(
  supabase: AppSupabase,
  user: User,
  preferredNext?: string | null,
): Promise<string> {
  const { onboardingCompleted } = await syncUserProfileAfterAuth(supabase, user);

  if (preferredNext?.startsWith('/reinitialiser-mot-de-passe')) {
    return preferredNext;
  }

  if (onboardingCompleted) {
    if (preferredNext && preferredNext.startsWith('/app') && !preferredNext.startsWith('//')) {
      return preferredNext;
    }
    return '/app';
  }

  return '/onboarding';
}
