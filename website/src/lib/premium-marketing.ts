/** Contenu marketing Premium (aligné sur l’app mobile). */

export const PREMIUM_PRICE_LABEL = '6,99 €';
export const PREMIUM_PRICE_PERIOD_LABEL = '/ mois';
export const PREMIUM_PRICE_DISPLAY = `${PREMIUM_PRICE_LABEL} ${PREMIUM_PRICE_PERIOD_LABEL.trim()}`;

/** Deep link ouvrant l’écran Premium dans l’app native. */
export const PREMIUM_APP_DEEP_LINK = 'inveq://settings/premium';

export const PREMIUM_BENEFITS = [
  'Documents illimités (devis & factures)',
  'Recherche SIREN / SIRET',
  'Statistiques avancées',
  'Paiements Stripe sur factures',
  'Logo et signature personnalisés',
  'Signature électronique client',
  'Modèles PDF premium',
  'Multi-entreprises',
] as const;

export const PREMIUM_COMPARISON_ROWS = [
  { label: 'Clients', free: 'Illimités', premium: 'Illimités' },
  { label: 'Devis & factures', free: 'Limité', premium: 'Illimités' },
  { label: 'Export PDF', free: 'Oui', premium: 'Oui' },
  { label: 'Recherche SIREN', free: '—', premium: 'Oui' },
  { label: 'Statistiques avancées', free: '—', premium: 'Oui' },
  { label: 'Paiements en ligne', free: '—', premium: 'Oui' },
  { label: 'Signature client', free: '—', premium: 'Oui' },
  { label: 'Logo personnalisé', free: '—', premium: 'Oui' },
] as const;

export const PREMIUM_GUARANTEE =
  'Sans engagement. Résiliable à tout moment depuis votre espace abonnement. Accès Premium immédiat après paiement.';

export const PREMIUM_FAQ = [
  {
    question: 'Puis-je résilier à tout moment ?',
    answer:
      'Oui. Vous restez Premium jusqu’à la fin de la période déjà payée, puis le plan Gratuit reprend automatiquement.',
  },
  {
    question: 'Le paiement est-il sécurisé ?',
    answer:
      'Oui. Le paiement est traité par Stripe. INVEQ ne stocke jamais vos données de carte bancaire.',
  },
  {
    question: 'Puis-je utiliser un code promo ?',
    answer: 'Oui. Saisissez-le sur la page Stripe Checkout, ou dans l’application avant le paiement.',
  },
] as const;

export const PREMIUM_MARKETING = {
  title: 'INVEQ Premium',
  subtitle: 'Toutes les fonctionnalités pour facturer sans limite.',
  priceLabel: PREMIUM_PRICE_LABEL,
  pricePeriod: PREMIUM_PRICE_PERIOD_LABEL,
  priceDisplay: PREMIUM_PRICE_DISPLAY,
  cta: 'Passer à Premium',
  unlockCta: 'Débloquer Premium',
  guarantee: PREMIUM_GUARANTEE,
  benefits: PREMIUM_BENEFITS,
  comparison: PREMIUM_COMPARISON_ROWS,
  faq: PREMIUM_FAQ,
} as const;

export function getPremiumQrImageUrl(size = 220): string {
  const params = new URLSearchParams({
    size: `${size}x${size}`,
    data: PREMIUM_APP_DEEP_LINK,
  });
  return `https://api.qrserver.com/v1/create-qr-code/?${params.toString()}`;
}
