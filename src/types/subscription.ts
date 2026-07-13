export type SubscriptionPlanId = 'free' | 'premium' | 'starter' | 'pro' | 'enterprise';

export type SubscriptionStatus =
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'unpaid'
  | 'incomplete';

export type PlanResource = 'clients' | 'quotes' | 'invoices';

export type PlanFeatureKey =
  | 'custom_logo'
  | 'company_signature'
  | 'client_signature'
  | 'stripe_payments'
  | 'ai_assistant'
  | 'advanced_stats'
  | 'siren_search';

export type PlanFeatures = Record<PlanFeatureKey, boolean>;

export type SubscriptionPlan = {
  id: SubscriptionPlanId;
  displayName: string;
  description: string | null;
  sortOrder: number;
  maxClients: number | null;
  maxQuotes: number | null;
  maxInvoices: number | null;
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
  effectivePlanId: 'free' | 'premium';
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
};

export type PlanLimitCheck = {
  allowed: boolean;
  resource: PlanResource;
  current: number;
  limit: number | null;
  planId: 'free' | 'premium';
  planName: string;
  status: SubscriptionStatus;
  isPremium: boolean;
};

export type SubscriptionSnapshot = {
  subscription: UserSubscription;
  plan: SubscriptionPlan;
  usage: SubscriptionUsage;
};

export const PLAN_FEATURE_LABELS: Record<PlanFeatureKey, string> = {
  custom_logo: 'Logo personnalisé',
  company_signature: 'Signature entreprise',
  client_signature: 'Signature client',
  stripe_payments: 'Paiement Stripe',
  ai_assistant: 'Assistant IA',
  advanced_stats: 'Statistiques avancées',
  siren_search: 'Recherche SIREN / SIRET',
};

export const FREE_PLAN_LIMITS = {
  maxClients: 5,
  maxQuotes: 10,
  maxInvoices: 10,
} as const;

export class PlanLimitError extends Error {
  constructor(
    readonly resource: PlanResource,
    readonly check: PlanLimitCheck,
  ) {
    super('PLAN_LIMIT_REACHED');
    this.name = 'PlanLimitError';
  }
}

export class PremiumFeatureError extends Error {
  constructor(readonly feature: PlanFeatureKey) {
    super('PREMIUM_FEATURE_REQUIRED');
    this.name = 'PremiumFeatureError';
  }
}
