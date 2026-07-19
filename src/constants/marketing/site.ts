/**
 * URL publique du site.
 * Sans domaine custom : mets ton URL Vercel, ex. https://factume.vercel.app
 * Avec domaine : https://factume.app
 */
function resolveSiteUrl(): string {
  const fromEnv =
    process.env.EXPO_PUBLIC_SITE_URL?.trim() ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    '';
  return fromEnv.replace(/\/$/, '') || 'https://factume.vercel.app';
}

export const MARKETING_SITE_URL = resolveSiteUrl();

/** Sur Vercel, le dashboard est sur le même domaine (/app). */
export const MARKETING_APP_URL = MARKETING_SITE_URL;

/** URLs publiques canoniques — utilisées par l’app iOS via Linking.openURL. */
export const MARKETING_LEGAL_URLS = {
  privacy: `${MARKETING_SITE_URL}/confidentialite`,
  terms: `${MARKETING_SITE_URL}/conditions-utilisation`,
  legal: `${MARKETING_SITE_URL}/mentions-legales`,
  cookies: `${MARKETING_SITE_URL}/cookies`,
} as const;

export const MARKETING_HELP_URLS = {
  support: `${MARKETING_SITE_URL}/support`,
  guide: `${MARKETING_SITE_URL}/support#guide`,
  contact: `${MARKETING_SITE_URL}/contact`,
} as const;

/**
 * Contacts — sans domaine mail custom, utilise ton Gmail (ou autre)
 * via EXPO_PUBLIC_CONTACT_EMAIL / EXPO_PUBLIC_SUPPORT_EMAIL.
 */
export const MARKETING_CONTACT = {
  email:
    process.env.EXPO_PUBLIC_CONTACT_EMAIL?.trim() ||
    process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() ||
    'farouqdib@gmail.com',
  support:
    process.env.EXPO_PUBLIC_SUPPORT_EMAIL?.trim() ||
    process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() ||
    'farouqdib@gmail.com',
} as const;

/** Liste plate pour audits App Store / tests de non-régression. */
export const ALL_PUBLIC_EXTERNAL_URLS = [
  MARKETING_SITE_URL,
  ...Object.values(MARKETING_LEGAL_URLS),
  MARKETING_HELP_URLS.support,
  MARKETING_HELP_URLS.contact,
  `${MARKETING_SITE_URL}/privacy`,
  `${MARKETING_SITE_URL}/terms`,
  `${MARKETING_SITE_URL}/legal`,
  `${MARKETING_SITE_URL}/conditions`,
] as const;

export const MARKETING_SEO = {
  defaultTitle: 'Factume — Facturation, devis et gestion pour artisans et PME',
  defaultDescription:
    'Factume simplifie la facturation, les devis, les signatures et les paiements. Application mobile et web pour artisans, freelances et petites entreprises.',
  ogImage: `${MARKETING_SITE_URL}/og-image.png`,
  twitterHandle: '@factume',
  locale: 'fr_FR',
} as const;
