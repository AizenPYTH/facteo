import type { User } from '@supabase/supabase-js';

export type AuthIdentity = {
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  avatarUrl: string | null;
};

function readMeta(metadata: Record<string, unknown>, ...keys: string[]): string | null {
  for (const key of keys) {
    const value = metadata[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return null;
}

/** Extrait prénom / nom / e-mail / avatar depuis un user Auth (Google ou e-mail). */
export function extractAuthIdentity(user: User): AuthIdentity {
  const metadata = (user.user_metadata ?? {}) as Record<string, unknown>;

  let firstName = readMeta(metadata, 'first_name', 'given_name');
  let lastName = readMeta(metadata, 'last_name', 'family_name');
  const fullName = readMeta(metadata, 'full_name', 'name');
  const avatarUrl = readMeta(metadata, 'avatar_url', 'picture');

  if (!firstName && fullName) {
    const parts = fullName.split(/\s+/).filter(Boolean);
    firstName = parts[0] ?? null;
    if (!lastName && parts.length > 1) {
      lastName = parts.slice(1).join(' ');
    }
  }

  return {
    firstName,
    lastName,
    email: user.email?.trim() || readMeta(metadata, 'email'),
    avatarUrl,
  };
}
