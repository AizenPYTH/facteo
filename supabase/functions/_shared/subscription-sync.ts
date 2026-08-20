import Stripe from 'https://esm.sh/stripe@17.7.0?target=deno';
import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

export type SubscriptionPlanId = 'free' | 'premium';

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

export function resolvePlanId(metadataPlanId: string | undefined): SubscriptionPlanId {
  return metadataPlanId === 'free' ? 'free' : 'premium';
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
  const now = new Date().toISOString();
  const planId = input.planId ?? 'premium';

  // Ne pas écraser les champs absents (ex. stripe_customer_id lors d’un achat Apple).
  const patch: Record<string, unknown> = {
    plan: planId,
    status: input.status ?? 'active',
    updated_at: now,
  };

  if (input.stripeCustomerId !== undefined) {
    patch.stripe_customer_id = input.stripeCustomerId;
  }
  if (input.stripeSubscriptionId !== undefined) {
    patch.stripe_subscription_id = input.stripeSubscriptionId;
  }
  if (input.currentPeriodStart !== undefined) {
    patch.current_period_start = input.currentPeriodStart;
  }
  if (input.currentPeriodEnd !== undefined) {
    patch.current_period_end = input.currentPeriodEnd;
  }
  if (input.cancelAtPeriodEnd !== undefined) {
    patch.cancel_at_period_end = input.cancelAtPeriodEnd;
  }

  const { error } = await serviceClient
    .from('subscriptions')
    .update(patch)
    .eq('user_id', input.userId);

  if (error) {
    throw error;
  }
}

/** Lie un originalTransactionId Apple à un user (restore / notifications). */
export async function findUserIdForAppleSubscription(
  serviceClient: SupabaseClient,
  originalTransactionId: string,
): Promise<string | null> {
  const storageId = `apple:${originalTransactionId}`;
  const { data } = await serviceClient
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_subscription_id', storageId)
    .maybeSingle();

  return data?.user_id ?? null;
}

export async function applyStandardSubscription(
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

  await applyPremiumSubscription(serviceClient, {
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
  const isPremium = subscription.status === 'active' || subscription.status === 'trialing';
  const planId = isPremium ? resolvePlanId(subscription.metadata?.plan_id) : 'free';

  if (isPremium) {
    await applyPremiumSubscription(serviceClient, {
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

  await applyStandardSubscription(serviceClient, {
    userId,
    status: mappedStatus,
    stripeSubscriptionId: subscription.id,
    currentPeriodStart: toIso(subscription.current_period_start),
    currentPeriodEnd: toIso(subscription.current_period_end),
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
  });
}
