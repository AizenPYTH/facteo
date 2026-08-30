/**
 * Catalogue offres INVEQ — aligné sur website/src/lib/subscription-plans.ts
 * Plans canoniques : micro / basique / standard / pro / max.
 */

export type CatalogPlanId = 'micro' | 'basique' | 'standard' | 'pro' | 'max';

export type CatalogPlan = {
  id: CatalogPlanId;
  name: string;
  description: string;
  priceMonthlyHt: number;
  priceYearlyMonthlyHt: number | null;
  highlighted?: boolean;
  badge?: string;
  inheritsFrom?: CatalogPlanId;
  features: string[];
  limits: {
    documentsPerMonth: number | null;
    sirenSearchesPerMonth: number | null;
    companies: number | null;
  };
};

export const SUBSCRIPTION_CATALOG: CatalogPlan[] = [
  {
    id: 'micro',
    name: 'Micro',
    description: 'Pour découvrir INVEQ et facturer vos premiers clients.',
    priceMonthlyHt: 0,
    priceYearlyMonthlyHt: null,
    features: [
      '3 documents / mois',
      'Catalogue de prestations illimité',
      'Contacts illimités',
      'Gestion des devis et factures',
      'Suivi des documents',
      'Envoi par e-mail',
      'Export PDF',
    ],
    limits: {
      documentsPerMonth: 3,
      sirenSearchesPerMonth: 0,
      companies: 1,
    },
  },
  {
    id: 'basique',
    name: 'Basique',
    description: 'Pour les indépendants qui facturent sans limite.',
    priceMonthlyHt: 6.82,
    priceYearlyMonthlyHt: 4.27,
    inheritsFrom: 'micro',
    features: [
      'Documents illimités',
      'Modèles de factures et devis',
      'Personnalisation de l’entreprise',
      'Recherche SIREN / SIRET — 50 / mois',
    ],
    limits: {
      documentsPerMonth: null,
      sirenSearchesPerMonth: 50,
      companies: 1,
    },
  },
  {
    id: 'standard',
    name: 'Standard',
    description: 'Pour signer vos documents et gérer plusieurs activités.',
    priceMonthlyHt: 16.21,
    priceYearlyMonthlyHt: 12.8,
    inheritsFrom: 'basique',
    features: [
      'Signature électronique',
      'Jusqu’à 3 entreprises',
      'Recherche SIREN / SIRET — 200 / mois',
    ],
    limits: {
      documentsPerMonth: null,
      sirenSearchesPerMonth: 200,
      companies: 3,
    },
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'Pour les pros multi-activités sans plafond de recherche.',
    priceMonthlyHt: 27.3,
    priceYearlyMonthlyHt: 21.33,
    highlighted: true,
    badge: 'Le plus populaire',
    inheritsFrom: 'standard',
    features: [
      'Recherche SIREN / SIRET illimitée',
      'Entreprises illimitées',
    ],
    limits: {
      documentsPerMonth: null,
      sirenSearchesPerMonth: null,
      companies: null,
    },
  },
  {
    id: 'max',
    name: 'Max',
    description: 'Toutes les fonctionnalités INVEQ pour une activité sans limite.',
    priceMonthlyHt: 63.98,
    priceYearlyMonthlyHt: 49.99,
    inheritsFrom: 'pro',
    features: [
      'Paiements Stripe (encaisser vos clients)',
      'Assistant IA',
      'Statistiques avancées',
    ],
    limits: {
      documentsPerMonth: null,
      sirenSearchesPerMonth: null,
      companies: null,
    },
  },
];

export const PAID_CATALOG_PLAN_IDS: CatalogPlanId[] = ['basique', 'standard', 'pro', 'max'];

export function formatCatalogPriceHt(amount: number): string {
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

export function formatCatalogLimit(value: number | null, unit: string): string {
  if (value === null) return `Illimité`;
  if (value === 0) return 'Non inclus';
  return `${value} ${unit}`;
}

export function getCatalogPlan(id: string | undefined | null): CatalogPlan | undefined {
  if (!id) return undefined;
  return SUBSCRIPTION_CATALOG.find((plan) => plan.id === id);
}
