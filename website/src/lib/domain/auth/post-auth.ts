import type { User } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';
import { logSupabaseError } from '@/lib/supabase/errors';

function readMeta(user: User, ...keys: string[]): string | null {
  const metadata = user.user_metadata ?? {};
  for (const key of keys) {
    const value = metadata[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return null;
}

/** Sync Google (ou metadata Auth) → profiles si champs vides. */
export async function syncAuthIdentityToProfile(user: User): Promise<void> {
  const firstName = readMeta(user, 'first_name', 'given_name');
  const lastName = readMeta(user, 'last_name', 'family_name');
  const fullName = readMeta(user, 'full_name', 'name');
  const avatarUrl = readMeta(user, 'avatar_url', 'picture');

  let resolvedFirst = firstName;
  let resolvedLast = lastName;
  if (!resolvedFirst && fullName) {
    const parts = fullName.split(/\s+/);
    resolvedFirst = parts[0] ?? null;
    resolvedLast = resolvedLast ?? (parts.length > 1 ? parts.slice(1).join(' ') : null);
  }

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

  if (!existing?.first_name && resolvedFirst) payload.first_name = resolvedFirst;
  if (!existing?.last_name && resolvedLast) payload.last_name = resolvedLast;
  if (!existing?.email && user.email) payload.email = user.email;
  if (!existing?.avatar_url && avatarUrl) payload.avatar_url = avatarUrl;

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
    // Fail closed for new users: send to onboarding if unknown
    return false;
  }

  return Boolean(data?.onboarding_completed);
}

export async function getPostAuthPath(userId: string): Promise<'/app' | '/onboarding'> {
  const done = await isOnboardingCompleted(userId);
  return done ? '/app' : '/onboarding';
}
