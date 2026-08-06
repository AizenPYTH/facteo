import Stripe from 'https://esm.sh/stripe@17.7.0?target=deno';
import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

/** Catalog + legacy ids persisted on `subscriptions.plan`. */
export type SubscriptionPlanId =
  | 'free'
  | 'micro'
  | 'basique'
  | 'standard'
  | 'pro'
  | 'max'
  | 'premium'
  | 'starter'
  | 'enterprise';

export const PAID_CHECKOUT_PLAN_IDS = ['basique', 'standard', 'pro', 'max'] as const;
export type PaidCheckoutPlanId = (typeof PAID_CHECKOUT_PLAN_IDS)[number];

const FREE_PLAN_IDS = new Set(['free', 'micro']);

export function isPaidCheckoutPlanId(planId: string): planId is PaidCheckoutPlanId {
  return (PAID_CHECKOUT_PLAN_IDS as readonly string[]).includes(planId);
}

export function isPaidPlanId(planId: string | null | undefined): boolean {
  if (!planId) {
    return false;
  }

  return !FREE_PLAN_IDS.has(planId);
}

export function resolveStripePriceId(
  planStripePriceId: string | null | undefined,
  fallbackEnvKey = 'STRIPE_PREMIUM_PRICE_ID',
): string | null {
  const fromPlan = planStripePriceId?.trim();

  if (fromPlan) {
    return fromPlan;
  }

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

/**
 * Maps Stripe metadata / legacy ids onto the catalog enum.
 * Legacy `premium` → `pro` so entitlements match the four-plan matrix.
 */
export function resolvePlanId(metadataPlanId: string | undefined): SubscriptionPlanId {
  const raw = metadataPlanId?.trim().toLowerCase();

  if (!raw || raw === 'free' || raw === 'micro') {
    return 'micro';
  }

  if (raw === 'basique') {
    return 'basique';
  }

  if (raw === 'standard') {
    return 'standard';
  }

  if (raw === 'max') {
    return 'max';
  }

  if (raw === 'pro' || raw === 'premium' || raw === 'starter' || raw === 'enterprise') {
    return 'pro';
  }

  return 'pro';
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
    planId?: SubscriptionPlanId;
    status?: 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid' | 'incomplete';
    stripeCustomerId?: string | null;
    stripeSubscriptionId?: string | null;
    currentPeriodStart?: string | null;
    currentPeriodEnd?: string | null;
    cancelAtPeriodEnd?: boolean;
  },
): Promise<void> {
  const now = new Date().toISOString();
  const planId = input.planId ?? 'pro';

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

/** @deprecated Use applyPaidSubscription */
export const applyPremiumSubscription = applyPaidSubscription;

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
      plan: 'micro',
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

/** @deprecated Use applyFreeSubscription */
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

  await applyPaidSubscription(serviceClient, {
    userId,
    planId,
    status,
    stripeCustomerId: customerId,
    stripeSubscriptionId,
    currentPeriodStart,
    currentPeriodEnd,
    cancelAtPeriodEnd,
  });

  return { userId, planId };
}

export async function syncStripeSubscriptionObject(
  serviceClient: SupabaseClient,
  subscription: Stripe.Subscription,
): Promise<void> {
  const userId = await findUserIdForSubscription(serviceClient, subscription);

  if (!userId) {
    return;
  }

  const mappedStatus = mapStripeSubscriptionStatus(subscription.status);
  const isActivePaid = subscription.status === 'active' || subscription.status === 'trialing';
  const planId = isActivePaid ? resolvePlanId(subscription.metadata?.plan_id) : 'micro';

  if (isActivePaid) {
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
