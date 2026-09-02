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
export const APP_SUBSCRIPTION_PATH = '/app/settings/subscription';

export function isSafeAppRedirect(value: string | null | undefined): value is string {
  return Boolean(
    value &&
      value.startsWith('/app') &&
      !value.startsWith('//') &&
      !value.includes('\\') &&
      !value.includes('://'),
  );
}

export function getSubscribeLoginUrl(): string {
  return `${APP_LOGIN_URL}?redirect=${encodeURIComponent(APP_SUBSCRIPTION_PATH)}`;
}

export function getSubscribeRegisterUrl(): string {
  return `${APP_REGISTER_URL}?redirect=${encodeURIComponent(APP_SUBSCRIPTION_PATH)}`;
}

export const CONTACT_EMAIL =
  process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || 'farouqdib@gmail.com';
export const SUPPORT_EMAIL =
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() || 'farouqdib@gmail.com';

export const SITE_NAME = 'INVEQ';

/** Fiche App Store de l’application iOS (publiée) */
export const IOS_APP_STORE_URL = 'https://apps.apple.com/fr/app/inveq-factures-devis/id6794705229';
export const IOS_APP_NAME = 'INVEQ – Factures & Devis';
export const IOS_MIN_VERSION = '16.4';

export const DEFAULT_OG_IMAGE = `${SITE_URL}/opengraph-image`;
