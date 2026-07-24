/**
 * Configuration centralisée des offres INVEQ (prix HT, limites, fonctionnalités).
 * Modifier ce fichier pour mettre à jour la page tarifs sans toucher à l’UI.
 */

export type BillingInterval = 'monthly' | 'yearly';

export type PlanFeatureIcon =
  | 'file'
  | 'catalog'
  | 'users'
  | 'tracking'
  | 'mail'
  | 'chart'
  | 'pdf'
  | 'templates'
  | 'company'
  | 'signature'
  | 'stats'
  | 'building'
  | 'recurring'
  | 'archive'
  | 'ai'
  | 'search'
  | 'check';

export type PlanFeature = {
  id: string;
  label: string;
  icon: PlanFeatureIcon;
  /** Affiché comme pastille « À venir » — non disponible aujourd’hui */
  comingSoon?: boolean;
};

export type SubscriptionPlanId = 'micro' | 'basique' | 'standard' | 'pro';

export type SubscriptionPlan = {
  id: SubscriptionPlanId;
  name: string;
  description: string;
  /** Prix mensuel HT facturé au mois (€) */
  priceMonthlyHt: number;
  /**
   * Équivalent mensuel HT en cas de paiement annuel (€ / mois).
   * `null` = gratuit (pas d’offre annuelle distincte).
   */
  priceYearlyMonthlyHt: number | null;
  cta: string;
  highlighted?: boolean;
  badge?: string;
  /** Inclus depuis l’offre précédente (ex. « Tout Micro ») */
  inheritsFrom?: SubscriptionPlanId;
  features: PlanFeature[];
  limits: {
    documentsPerMonth: number | null;
    /** `null` = illimité */
    sirenSearchesPerMonth: number | null;
    users: number | null;
    departments: number | null;
    /** `null` = illimité */
    companies: number | null;
  };
};

/** Économie annuelle maximale affichée sur le sélecteur (basée sur l’offre Pro). */
export function getYearlySavingsPercent(plan: SubscriptionPlan): number | null {
  if (plan.priceMonthlyHt <= 0 || plan.priceYearlyMonthlyHt == null) return null;
  const monthlyYear = plan.priceMonthlyHt * 12;
  const yearlyTotal = plan.priceYearlyMonthlyHt * 12;
  return Math.round(((monthlyYear - yearlyTotal) / monthlyYear) * 100);
}

export function getPlanPrice(plan: SubscriptionPlan, interval: BillingInterval): number {
  if (interval === 'yearly' && plan.priceYearlyMonthlyHt != null) {
    return plan.priceYearlyMonthlyHt;
  }
  return plan.priceMonthlyHt;
}

export function formatPriceHt(amount: number): string {
  if (amount === 0) return '0 €';
  return (
    new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount) + ' HT'
  );
}

export function getMaxYearlySavingsPercent(plans: SubscriptionPlan[] = SUBSCRIPTION_PLANS): number {
  const percents = plans
    .map(getYearlySavingsPercent)
    .filter((p): p is number => p != null && p > 0);
  return percents.length ? Math.max(...percents) : 0;
}

export const SUBSCRIPTION_PRICING_COPY = {
  title: 'Des offres adaptées à votre activité',
  subtitle:
    'Commencez gratuitement, évoluez quand vous en avez besoin. Tous les prix sont indiqués HT, sans engagement.',
  monthlyLabel: 'Mensuel',
  yearlyLabel: 'Annuel',
  perMonthLabel: '/ mois',
  yearlyBilledHint: 'Facturé annuellement',
  vatNote: 'Prix HT — TVA en sus selon votre situation',
  popularBadge: 'Le plus populaire',
  comingSoonBadge: 'À venir',
  inheritsPrefix: 'Tout',
} as const;

/**
 * Matrice produits réelle INVEQ (uniquement ce qui est disponible aujourd’hui).
 * Différenciation : volume documents, SIREN/SIRET, signature, nombre d’entreprises.
 */
export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'micro',
    name: 'Micro',
    description: 'Pour découvrir INVEQ et facturer vos premiers clients.',
    priceMonthlyHt: 0,
    priceYearlyMonthlyHt: null,
    cta: 'Commencer gratuitement',
    limits: {
      documentsPerMonth: 3,
      sirenSearchesPerMonth: 0,
      users: 1,
      departments: null,
      companies: 1,
    },
    features: [
      { id: 'docs-3', label: '3 documents / mois', icon: 'file' },
      { id: 'catalog', label: 'Catalogue de prestations illimité', icon: 'catalog' },
      { id: 'contacts', label: 'Contacts illimités', icon: 'users' },
      { id: 'quotes-invoices', label: 'Gestion des devis et factures', icon: 'file' },
      { id: 'tracking', label: 'Suivi des documents', icon: 'tracking' },
      { id: 'email', label: 'Envoi par e-mail', icon: 'mail' },
      { id: 'pdf', label: 'Export PDF', icon: 'pdf' },
    ],
  },
  {
    id: 'basique',
    name: 'Basique',
    description: 'Pour les indépendants qui facturent sans limite.',
    priceMonthlyHt: 6.82,
    priceYearlyMonthlyHt: 4.27,
    cta: 'Choisir Basique',
    inheritsFrom: 'micro',
    limits: {
      documentsPerMonth: null,
      sirenSearchesPerMonth: 50,
      users: 1,
      departments: null,
      companies: 1,
    },
    features: [
      { id: 'docs-unlimited', label: 'Documents illimités', icon: 'file' },
      { id: 'templates', label: 'Modèles de factures et devis', icon: 'templates' },
      { id: 'company-branding', label: 'Personnalisation de l’entreprise', icon: 'company' },
      { id: 'siren-50', label: 'Recherche SIREN / SIRET — 50 / mois', icon: 'search' },
    ],
  },
  {
    id: 'standard',
    name: 'Standard',
    description: 'Pour signer vos documents et gérer plusieurs activités.',
    priceMonthlyHt: 16.21,
    priceYearlyMonthlyHt: 12.8,
    cta: 'Choisir Standard',
    inheritsFrom: 'basique',
    limits: {
      documentsPerMonth: null,
      sirenSearchesPerMonth: 200,
      users: 1,
      departments: null,
      companies: 3,
    },
    features: [
      { id: 'signature', label: 'Signature électronique', icon: 'signature' },
      { id: 'companies-3', label: 'Jusqu’à 3 entreprises', icon: 'building' },
      { id: 'siren-200', label: 'Recherche SIREN / SIRET — 200 / mois', icon: 'search' },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'Pour les pros multi-activités sans plafond de recherche.',
    priceMonthlyHt: 27.3,
    priceYearlyMonthlyHt: 21.33,
    cta: 'Choisir Pro',
    highlighted: true,
    badge: 'Le plus populaire',
    inheritsFrom: 'standard',
    limits: {
      documentsPerMonth: null,
      sirenSearchesPerMonth: null,
      users: 1,
      departments: null,
      companies: null,
    },
    features: [
      { id: 'siren-unlimited', label: 'Recherche SIREN / SIRET illimitée', icon: 'search' },
      { id: 'companies-unlimited', label: 'Entreprises illimitées', icon: 'building' },
    ],
  },
];

export function getPlanById(id: SubscriptionPlanId): SubscriptionPlan | undefined {
  return SUBSCRIPTION_PLANS.find((p) => p.id === id);
}

export function getInheritLabel(plan: SubscriptionPlan): string | null {
  if (!plan.inheritsFrom) return null;
  const parent = getPlanById(plan.inheritsFrom);
  if (!parent) return null;
  return `${SUBSCRIPTION_PRICING_COPY.inheritsPrefix} ${parent.name}`;
}
