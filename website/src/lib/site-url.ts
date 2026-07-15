/** URL du site (client ou serveur). */
export function getSiteUrl(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://facteo.app';
}

export function getAuthCallbackUrl(next = '/app'): string {
  const base = `${getSiteUrl()}/auth/callback`;
  const params = new URLSearchParams({ next });
  return `${base}?${params.toString()}`;
}
