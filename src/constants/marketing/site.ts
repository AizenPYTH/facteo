export const MARKETING_SITE_URL = 'https://facteo.app';

export const MARKETING_APP_URL = 'https://app.facteo.app';

export const MARKETING_LEGAL_URLS = {
  privacy: `${MARKETING_SITE_URL}/confidentialite`,
  terms: `${MARKETING_SITE_URL}/conditions-utilisation`,
  legal: `${MARKETING_SITE_URL}/mentions-legales`,
  cookies: `${MARKETING_SITE_URL}/cookies`,
} as const;

export const MARKETING_CONTACT = {
  email: 'contact@facteo.app',
  support: 'support@facteo.app',
} as const;

export const MARKETING_SEO = {
  defaultTitle: 'FACTEO — Facturation, devis et gestion pour artisans et PME',
  defaultDescription:
    'FACTEO simplifie la facturation, les devis, les signatures et les paiements. Application mobile et web pour artisans, freelances et petites entreprises.',
  ogImage: `${MARKETING_SITE_URL}/og-image.png`,
  twitterHandle: '@facteo',
  locale: 'fr_FR',
} as const;
