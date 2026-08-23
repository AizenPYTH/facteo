/**
 * Pure helpers — no react-native import (safe for Node tests).
 */

const ACCOUNT_CREATION_PATH_RE =
  /(?:^|\/)(?:register|inscription|signup|sign-up|create-account)(?:\/|$|\?|#)/i;

/** Detects in-app routes or external URLs that lead to account creation. */
export function isAccountCreationPathOrUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;

  const lower = trimmed.toLowerCase();
  if (
    lower.includes('inveq.fr/register') ||
    lower.includes('inveq.fr/inscription') ||
    lower.includes('/register') ||
    lower.includes('/inscription') ||
    lower.includes('/signup') ||
    lower.includes('/sign-up')
  ) {
    return true;
  }

  try {
    const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(trimmed)
      ? trimmed
      : `https://placeholder.local${trimmed.startsWith('/') ? trimmed : `/${trimmed}`}`;
    const url = new URL(withScheme);
    return ACCOUNT_CREATION_PATH_RE.test(url.pathname);
  } catch {
    return ACCOUNT_CREATION_PATH_RE.test(trimmed);
  }
}
