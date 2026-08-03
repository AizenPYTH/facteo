import Stripe from 'https://esm.sh/stripe@17.7.0?target=deno';
import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

/** Plans payants stockés sur subscriptions.plan (enum Postgres). */
export type PaidSubscriptionPlanId = 'basique' | 'standard' | 'pro' | 'max';

export type SubscriptionPlanId = 'free' | 'micro' | PaidSubscriptionPlanId | 'premium';

export type BillingInterval = 'monthly' | 'yearly';

export const PAID_PLAN_IDS: PaidSubscriptionPlanId[] = ['basique', 'standard', 'pro', 'max'];

/** Lookup keys DÉFINITIFS — ne jamais renommer (alignés sur provision script). */
export const LOOKUP_KEYS: Record<PaidSubscriptionPlanId, Record<BillingInterval, string>> = {
  basique: { monthly: 'monthly_basic', yearly: 'yearly_basic' },
  standard: { monthly: 'monthly_standard', yearly: 'yearly_standard' },
  pro: { monthly: 'monthly_pro', yearly: 'yearly_pro' },
  max: { monthly: 'monthly_max', yearly: 'yearly_max' },
};

/** Ordre d’affichage canonique : Micro → Basique → Standard → Pro → Max */
export const PLAN_SORT_ORDER = ['micro', 'basique', 'standard', 'pro', 'max'] as const;

const LOOKUP_KEY_TO_PLAN: Record<string, PaidSubscriptionPlanId> = {
  monthly_basic: 'basique',
  yearly_basic: 'basique',
  monthly_standard: 'standard',
  yearly_standard: 'standard',
  monthly_pro: 'pro',
  yearly_pro: 'pro',
  monthly_max: 'max',
  yearly_max: 'max',
};

export function resolvePlanIdFromLookupKey(
  lookupKey: string | null | undefined,
): PaidSubscriptionPlanId | null {
  if (!lookupKey) return null;
  return LOOKUP_KEY_TO_PLAN[lookupKey] ?? null;
}

export function resolvePlanIdFromStripePrice(
  price: Stripe.Price | string | null | undefined,
): PaidSubscriptionPlanId | null {
  if (!price || typeof price === 'string') return null;
  if (price.lookup_key) {
    return resolvePlanIdFromLookupKey(price.lookup_key);
  }
  const fromMeta = price.metadata?.plan_id?.trim();
  return isPaidPlanId(fromMeta) ? fromMeta : null;
}

export function isPaidPlanId(value: string | null | undefined): value is PaidSubscriptionPlanId {
  return PAID_PLAN_IDS.includes(value as PaidSubscriptionPlanId);
}

export function normalizePlanId(value: string | null | undefined): SubscriptionPlanId {
  if (!value) return 'free';
  if (value === 'premium') return 'max';
  if (value === 'starter') return 'basique';
  if (value === 'enterprise') return 'max';
  if (value === 'micro' || value === 'free') return value === 'micro' ? 'micro' : 'free';
  if (isPaidPlanId(value)) return value;
  return 'free';
}

export function resolveLookupKey(
  planId: PaidSubscriptionPlanId,
  interval: BillingInterval,
): string {
  return LOOKUP_KEYS[planId][interval];
}

/** Résout un Price ID Stripe via lookup_key, puis cache DB, puis env legacy. */
export async function resolveStripePriceIdForPlan(
  stripe: Stripe,
  plan: {
    id: string;
    stripe_price_id?: string | null;
    stripe_price_id_yearly?: string | null;
    stripe_lookup_key_monthly?: string | null;
    stripe_lookup_key_yearly?: string | null;
  },
  interval: BillingInterval,
): Promise<string | null> {
  if (!isPaidPlanId(plan.id)) {
    return null;
  }

  const lookupKey =
    (interval === 'yearly'
      ? plan.stripe_lookup_key_yearly?.trim()
      : plan.stripe_lookup_key_monthly?.trim()) || resolveLookupKey(plan.id, interval);

  const byLookup = await stripe.prices.list({
    lookup_keys: [lookupKey],
    active: true,
    limit: 1,
  });

  const fromStripe = byLookup.data[0]?.id?.trim();
  if (fromStripe) {
    return fromStripe;
  }

  const fromPlan =
    interval === 'yearly'
      ? plan.stripe_price_id_yearly?.trim()
      : plan.stripe_price_id?.trim();

  if (fromPlan) {
    return fromPlan;
  }

  // Legacy single-price fallback (ancien Premium)
  const fromEnv = Deno.env.get('STRIPE_PREMIUM_PRICE_ID')?.trim();
  return fromEnv || null;
}

/** @deprecated Prefer resolveStripePriceIdForPlan */
export function resolveStripePriceId(
  planStripePriceId: string | null | undefined,
  fallbackEnvKey = 'STRIPE_PREMIUM_PRICE_ID',
): string | null {
  const fromPlan = planStripePriceId?.trim();
  if (fromPlan) return fromPlan;
  const fromEnv = Deno.env.get(fallbackEnvKey)?.trim();
  return fromEnv || null;
}

export function mapStripeSubscriptionStatus(
  status: Stripe.Subscription.Status,
): 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid' | 'incomplete' {
  switch (status) {
    case 'trialing':
      return 'trialing';
    case 'past_due':
      return 'past_due';
    case 'canceled':
      return 'canceled';
    case 'unpaid':
      return 'unpaid';
    case 'incomplete':
    case 'incomplete_expired':
      return 'incomplete';
    default:
      return 'active';
  }
}

export function toIso(unixSeconds: number | null | undefined): string | null {
  if (!unixSeconds) {
    return null;
  }

  return new Date(unixSeconds * 1000).toISOString();
}

export function resolvePlanId(metadataPlanId: string | undefined): SubscriptionPlanId {
  return normalizePlanId(metadataPlanId);
}

/** Mappe un plan catalogue vers une valeur enum subscriptions.plan. */
export function toSubscriptionsEnumPlan(planId: SubscriptionPlanId): string {
  const normalized = normalizePlanId(planId);
  if (normalized === 'free' || normalized === 'micro') return 'free';
  if (normalized === 'premium') return 'max';
  return normalized;
}

export function isPaidCheckoutSession(session: Stripe.Checkout.Session): boolean {
  return session.status === 'complete' && session.payment_status === 'paid';
}

export async function findUserIdForSubscription(
  serviceClient: SupabaseClient,
  subscription: Stripe.Subscription,
): Promise<string | null> {
  const metadataUserId = subscription.metadata?.user_id?.trim();

  if (metadataUserId) {
    return metadataUserId;
  }

  const customerId =
    typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id;

  if (!customerId) {
    return null;
  }

  const { data } = await serviceClient
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_customer_id', customerId)
    .maybeSingle();

  return data?.user_id ?? null;
}

export async function applyPaidSubscription(
  serviceClient: SupabaseClient,
  input: {
    userId: string;
    planId: SubscriptionPlanId;
    status?: 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid' | 'incomplete';
    stripeCustomerId?: string | null;
    stripeSubscriptionId?: string | null;
    currentPeriodStart?: string | null;
    currentPeriodEnd?: string | null;
    cancelAtPeriodEnd?: boolean;
  },
): Promise<void> {
  const now = new Date().toISOString();
  const planId = toSubscriptionsEnumPlan(input.planId);

  const { error } = await serviceClient
    .from('subscriptions')
    .update({
      plan: planId,
      status: input.status ?? 'active',
      stripe_customer_id: input.stripeCustomerId ?? null,
      stripe_subscription_id: input.stripeSubscriptionId ?? null,
      current_period_start: input.currentPeriodStart ?? null,
      current_period_end: input.currentPeriodEnd ?? null,
      cancel_at_period_end: input.cancelAtPeriodEnd ?? false,
      updated_at: now,
    })
    .eq('user_id', input.userId);

  if (error) {
    throw error;
  }
}

/** @deprecated Prefer applyPaidSubscription */
export async function applyPremiumSubscription(
  serviceClient: SupabaseClient,
  input: {
    userId: string;
    planId?: SubscriptionPlanId;
    status?: 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid' | 'incomplete';
    stripeCustomerId?: string | null;
    stripeSubscriptionId?: string | null;
    currentPeriodStart?: string | null;
    currentPeriodEnd?: string | null;
    cancelAtPeriodEnd?: boolean;
  },
): Promise<void> {
  await applyPaidSubscription(serviceClient, {
    ...input,
    planId: input.planId ?? 'max',
  });
}

export async function applyFreeSubscription(
  serviceClient: SupabaseClient,
  input: {
    userId: string;
    status?: 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid' | 'incomplete';
    stripeSubscriptionId?: string | null;
    currentPeriodStart?: string | null;
    currentPeriodEnd?: string | null;
    cancelAtPeriodEnd?: boolean;
  },
): Promise<void> {
  const now = new Date().toISOString();

  const { error } = await serviceClient
    .from('subscriptions')
    .update({
      plan: 'free',
      status: input.status ?? 'canceled',
      stripe_subscription_id: input.stripeSubscriptionId ?? null,
      current_period_start: input.currentPeriodStart ?? null,
      current_period_end: input.currentPeriodEnd ?? null,
      cancel_at_period_end: input.cancelAtPeriodEnd ?? false,
      updated_at: now,
    })
    .eq('user_id', input.userId);

  if (error) {
    throw error;
  }
}

/** @deprecated Prefer applyFreeSubscription */
export const applyStandardSubscription = applyFreeSubscription;

export async function syncSubscriptionCheckoutSession(
  stripe: Stripe,
  serviceClient: SupabaseClient,
  session: Stripe.Checkout.Session,
): Promise<{ userId: string; planId: SubscriptionPlanId }> {
  if (session.mode !== 'subscription') {
    throw new Error('Not a subscription checkout session.');
  }

  if (!isPaidCheckoutSession(session)) {
    throw new Error('Checkout session is not paid yet.');
  }

  const userId = session.metadata?.user_id ?? session.client_reference_id ?? null;
  const planId = resolvePlanId(session.metadata?.plan_id);

  if (!userId) {
    throw new Error('Missing user reference on checkout session.');
  }

  if (!isPaidPlanId(planId) && planId !== 'premium') {
    throw new Error(`Formule introuvable pour le plan « ${session.metadata?.plan_id ?? ''} ».`);
  }

  const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id ?? null;
  let stripeSubscriptionId =
    typeof session.subscription === 'string' ? session.subscription : session.subscription?.id ?? null;

  let currentPeriodStart: string | null = null;
  let currentPeriodEnd: string | null = null;
  let cancelAtPeriodEnd = false;
  let status: 'active' | 'trialing' = 'active';

  if (stripeSubscriptionId) {
    const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);
    stripeSubscriptionId = subscription.id;
    currentPeriodStart = toIso(subscription.current_period_start);
    currentPeriodEnd = toIso(subscription.current_period_end);
    cancelAtPeriodEnd = subscription.cancel_at_period_end;
    status = subscription.status === 'trialing' ? 'trialing' : 'active';
  }

  const effectivePlan = normalizePlanId(planId);

  await applyPaidSubscription(serviceClient, {
    userId,
    planId: effectivePlan,
    status,
    stripeCustomerId: customerId,
    stripeSubscriptionId,
    currentPeriodStart,
    currentPeriodEnd,
    cancelAtPeriodEnd,
  });

  return { userId, planId: effectivePlan };
}

/**
 * Résout le plan depuis l’item Stripe (lookup_key / metadata price),
 * puis fallback metadata subscription. Crucial pour le Customer Portal
 * (changement d’offre) où metadata.plan_id peut être obsolète.
 */
export function resolvePlanIdFromSubscription(
  subscription: Stripe.Subscription,
): SubscriptionPlanId {
  const item = subscription.items?.data?.[0];
  const price = item?.price;
  const fromPrice = resolvePlanIdFromStripePrice(price);
  if (fromPrice) {
    return fromPrice;
  }

  return resolvePlanId(subscription.metadata?.plan_id);
}

export async function syncStripeSubscriptionObject(
  serviceClient: SupabaseClient,
  subscription: Stripe.Subscription,
  stripe?: Stripe,
): Promise<void> {
  const userId = await findUserIdForSubscription(serviceClient, subscription);

  if (!userId) {
    return;
  }

  const mappedStatus = mapStripeSubscriptionStatus(subscription.status);
  const isActivePaid = subscription.status === 'active' || subscription.status === 'trialing';

  let planId: SubscriptionPlanId = 'free';
  if (isActivePaid) {
    planId = resolvePlanIdFromSubscription(subscription);

    // Si le webhook n’embarque que l’id du price, récupérer lookup_key / metadata.
    if (!isPaidPlanId(planId) && stripe) {
      const priceRef = subscription.items?.data?.[0]?.price;
      const priceId = typeof priceRef === 'string' ? priceRef : priceRef?.id;
      if (priceId) {
        const price = await stripe.prices.retrieve(priceId);
        planId = resolvePlanIdFromStripePrice(price) ?? resolvePlanId(subscription.metadata?.plan_id);
      }
    }
  }

  if (isActivePaid && (isPaidPlanId(planId) || planId === 'premium')) {
    await applyPaidSubscription(serviceClient, {
      userId,
      planId,
      status: mappedStatus,
      stripeCustomerId:
        typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id ?? null,
      stripeSubscriptionId: subscription.id,
      currentPeriodStart: toIso(subscription.current_period_start),
      currentPeriodEnd: toIso(subscription.current_period_end),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    });
    return;
  }

  await applyFreeSubscription(serviceClient, {
    userId,
    status: mappedStatus,
    stripeSubscriptionId: subscription.id,
    currentPeriodStart: toIso(subscription.current_period_start),
    currentPeriodEnd: toIso(subscription.current_period_end),
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
  });
}

export function createServiceClient(): SupabaseClient {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Supabase service configuration missing.');
  }
  return createClient(supabaseUrl, supabaseServiceRoleKey);
}
