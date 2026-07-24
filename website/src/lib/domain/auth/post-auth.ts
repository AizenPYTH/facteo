import type { User } from '@supabase/supabase-js';

import { extractAuthIdentity } from '@/lib/domain/auth/identity';
import { supabase } from '@/lib/supabase';
import { logSupabaseError } from '@/lib/supabase/errors';

/** Sync Google (ou metadata Auth) → profiles si champs vides. */
export async function syncAuthIdentityToProfile(user: User): Promise<void> {
  const identity = extractAuthIdentity(user);

  const { data: existing, error: fetchError } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, email, avatar_url')
    .eq('id', user.id)
    .maybeSingle();

  if (fetchError) {
    logSupabaseError('syncAuthIdentityToProfile.fetch', fetchError);
    return;
  }

  const payload: {
    updated_at: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    avatar_url?: string;
  } = {
    updated_at: new Date().toISOString(),
  };

  if (!existing?.first_name && identity.firstName) payload.first_name = identity.firstName;
  if (!existing?.last_name && identity.lastName) payload.last_name = identity.lastName;
  if (!existing?.email && identity.email) payload.email = identity.email;
  if (!existing?.avatar_url && identity.avatarUrl) payload.avatar_url = identity.avatarUrl;

  if (Object.keys(payload).length <= 1) return;

  const { error } = await supabase.from('profiles').update(payload).eq('id', user.id);
  if (error) {
    logSupabaseError('syncAuthIdentityToProfile.update', error);
  }
}

export async function isOnboardingCompleted(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('profiles')
    .select('onboarding_completed')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    logSupabaseError('isOnboardingCompleted', error);
    return false;
  }

  return Boolean(data?.onboarding_completed);
}

export async function getPostAuthPath(userId: string): Promise<'/app' | '/onboarding'> {
  const done = await isOnboardingCompleted(userId);
  return done ? '/app' : '/onboarding';
}
