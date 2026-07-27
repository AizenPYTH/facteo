/**
 * Production : https://www.inveq.fr (domaine canonique unique)
 * Override local : NEXT_PUBLIC_SITE_URL=http://localhost:3000
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'https://www.inveq.fr';

export const APP_URL = SITE_URL;
export const APP_DASHBOARD_URL = '/app';
export const APP_LOGIN_URL = '/login';
export const APP_REGISTER_URL = '/register';

/**
 * Intended public mailbox once DNS/MX for inveq.fr is live.
 * Never used as a display fallback — set NEXT_PUBLIC_* only when ready.
 */
export const INTENDED_SUPPORT_EMAIL = 'support@inveq.fr';

/** Public contact e-mail — empty until NEXT_PUBLIC_CONTACT_EMAIL is set. */
export const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || '';

/** Public support e-mail — empty until NEXT_PUBLIC_SUPPORT_EMAIL is set. */
export const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() || '';

export const hasPublicContactEmail = CONTACT_EMAIL.length > 0;
export const hasPublicSupportEmail = SUPPORT_EMAIL.length > 0;

export const SITE_NAME = 'INVEQ';

export const DEFAULT_OG_IMAGE = `${SITE_URL}/opengraph-image`;
