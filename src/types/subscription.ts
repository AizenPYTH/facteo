export type SubscriptionPlanId =
  | 'micro'
  | 'basique'
  | 'standard'
  | 'pro'
  | 'max'
  // Legacy (lecture seule — ne plus écrire)
  | 'free'
  | 'premium'
  | 'starter'
  | 'enterprise';

export type EffectivePlanId = 'micro' | 'basique' | 'standard' | 'pro' | 'max';

export type SubscriptionStatus =
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'unpaid'
  | 'incomplete';

export type PlanResource =
  | 'clients'
  | 'quotes'
  | 'invoices'
  | 'documents'
  | 'companies'
  | 'siren_searches';

export type PlanFeatureKey =
  | 'custom_logo'
  | 'company_signature'
  | 'client_signature'
  | 'pdf_templates'
  | 'stripe_payments'
  | 'ai_assistant'
  | 'advanced_stats'
  | 'siren_search';

export type PlanFeatures = Record<PlanFeatureKey, boolean>;

export type SubscriptionPlan = {
  id: SubscriptionPlanId | EffectivePlanId | string;
  displayName: string;
  description: string | null;
  sortOrder: number;
  maxClients: number | null;
  maxQuotes: number | null;
  maxInvoices: number | null;
  maxDocumentsPerMonth: number | null;
  maxSirenSearchesPerMonth: number | null;
  maxCompanies: number | null;
  features: PlanFeatures;
  stripePriceId: string | null;
  stripeProductId: string | null;
  appStoreProductId: string | null;
  playStoreProductId: string | null;
  isActive: boolean;
};

export type UserSubscription = {
  userId: string;
  plan: SubscriptionPlanId;
  effectivePlanId: EffectivePlanId;
  status: SubscriptionStatus;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  trialEndsAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SubscriptionUsage = {
  clients: number;
  quotes: number;
  invoices: number;
  documents: number;
  companies: number;
  sirenSearches: number;
};

export type PlanLimitCheck = {
  allowed: boolean;
  resource: PlanResource;
  current: number;
  limit: number | null;
  planId: EffectivePlanId | string;
  planName: string;
  status: SubscriptionStatus;
  isPremium: boolean;
};

export type SubscriptionSnapshot = {
  subscription: UserSubscription;
  plan: SubscriptionPlan;
  usage: SubscriptionUsage;
};

export class PlanLimitError extends Error {
  readonly check: PlanLimitCheck;

  constructor(check: PlanLimitCheck) {
    super(`Limite atteinte pour ${check.resource} (${check.planName}).`);
    this.name = 'PlanLimitError';
    this.check = check;
  }
}

export const PLAN_FEATURE_LABELS: Record<PlanFeatureKey, string> = {
  custom_logo: 'Logo personnalisé',
  company_signature: 'Signature entreprise',
  client_signature: 'Signature client',
  pdf_templates: 'Modèles PDF',
  stripe_payments: 'Paiement Stripe',
  ai_assistant: 'Assistant IA',
  advanced_stats: 'Statistiques avancées',
  siren_search: 'Recherche SIREN',
};
