/** URL du site (client ou serveur). */
export function getSiteUrl(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, '') || 'https://www.inveq.fr';
}

/**
 * URL de callback Auth.
 * Sans `next` : le serveur décide /onboarding vs /app (recommandé pour Google OAuth).
 * Avec `next` : ex. reset password → `/reinitialiser-mot-de-passe`.
 */
export function getAuthCallbackUrl(next?: string): string {
  const base = `${getSiteUrl()}/auth/callback`;
  if (!next) return base;
  const params = new URLSearchParams({ next });
  return `${base}?${params.toString()}`;
}
