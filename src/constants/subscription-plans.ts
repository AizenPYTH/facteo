/**
 * Offres INVEQ affichées dans l’app (alignées sur le site /tarifs).
 * Les price IDs Stripe restent en base (`subscription_plans.stripe_price_id`).
 */

export type CatalogPlanId = 'micro' | 'basique' | 'standard' | 'pro';

export type PaidCatalogPlanId = Exclude<CatalogPlanId, 'micro'>;

export type CatalogPlanFeature = {
  id: string;
  label: string;
};

export type CatalogPlan = {
  id: CatalogPlanId;
  name: string;
  description: string;
  /** Prix mensuel HT (€) */
  priceMonthlyHt: number;
  cta: string;
  highlighted?: boolean;
  badge?: string;
  inheritsFrom?: CatalogPlanId;
  features: CatalogPlanFeature[];
};

export const SUBSCRIPTION_PRICING_COPY = {
  title: 'Des offres adaptées à votre activité',
  subtitle:
    'Commencez gratuitement, évoluez quand vous en avez besoin. Tous les prix sont indiqués HT, sans engagement.',
  perMonthLabel: '/ mois',
  vatNote: 'Prix HT — TVA en sus selon votre situation',
  popularBadge: 'Le plus populaire',
  inheritsPrefix: 'Tout',
  manageCta: 'Gérer l’abonnement',
  currentBadge: 'Offre actuelle',
} as const;

export const SUBSCRIPTION_PLANS: CatalogPlan[] = [
  {
    id: 'micro',
    name: 'Micro',
    description: 'Pour découvrir INVEQ et facturer vos premiers clients.',
    priceMonthlyHt: 0,
    cta: 'Offre gratuite',
    features: [
      { id: 'docs-3', label: '3 documents / mois' },
      { id: 'catalog', label: 'Catalogue de prestations illimité' },
      { id: 'contacts', label: 'Contacts illimités' },
      { id: 'quotes-invoices', label: 'Gestion des devis et factures' },
      { id: 'tracking', label: 'Suivi des documents' },
      { id: 'email', label: 'Envoi par e-mail' },
      { id: 'pdf', label: 'Export PDF' },
    ],
  },
  {
    id: 'basique',
    name: 'Basique',
    description: 'Pour les indépendants qui facturent sans limite.',
    priceMonthlyHt: 6.82,
    cta: 'Choisir Basique',
    inheritsFrom: 'micro',
    features: [
      { id: 'docs-unlimited', label: 'Documents illimités' },
      { id: 'templates', label: 'Modèles de factures et devis' },
      { id: 'company-branding', label: 'Personnalisation de l’entreprise' },
      { id: 'siren-50', label: 'Recherche SIREN / SIRET — 50 / mois' },
    ],
  },
  {
    id: 'standard',
    name: 'Standard',
    description: 'Pour signer vos documents et gérer plusieurs activités.',
    priceMonthlyHt: 16.21,
    cta: 'Choisir Standard',
    inheritsFrom: 'basique',
    features: [
      { id: 'signature', label: 'Signature électronique' },
      { id: 'companies-3', label: 'Jusqu’à 3 entreprises' },
      { id: 'siren-200', label: 'Recherche SIREN / SIRET — 200 / mois' },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'Pour les pros multi-activités sans plafond de recherche.',
    priceMonthlyHt: 27.3,
    cta: 'Choisir Pro',
    highlighted: true,
    badge: 'Le plus populaire',
    inheritsFrom: 'standard',
    features: [
      { id: 'siren-unlimited', label: 'Recherche SIREN / SIRET illimitée' },
      { id: 'companies-unlimited', label: 'Entreprises illimitées' },
    ],
  },
];

export function getCatalogPlanById(id: CatalogPlanId): CatalogPlan | undefined {
  return SUBSCRIPTION_PLANS.find((plan) => plan.id === id);
}

export function getInheritLabel(plan: CatalogPlan): string | null {
  if (!plan.inheritsFrom) {
    return null;
  }

  const parent = getCatalogPlanById(plan.inheritsFrom);
  if (!parent) {
    return null;
  }

  return `${SUBSCRIPTION_PRICING_COPY.inheritsPrefix} ${parent.name}`;
}

export function formatPriceHt(amount: number): string {
  if (amount === 0) {
    return '0 €';
  }

  return (
    new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount) + ' HT'
  );
}

export function isPaidCatalogPlanId(id: string): id is PaidCatalogPlanId {
  return id === 'basique' || id === 'standard' || id === 'pro';
}
