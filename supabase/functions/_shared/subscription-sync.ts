import Stripe from 'https://esm.sh/stripe@17.7.0?target=deno';
import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

/** Plans métier stockés dans subscriptions.plan */
export type CanonicalPlanId = 'micro' | 'basique' | 'standard' | 'pro' | 'max';

const CANONICAL_PLANS = new Set<string>(['micro', 'basique', 'standard', 'pro', 'max']);
const PAID_PLANS = new Set<string>(['basique', 'standard', 'pro', 'max']);

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
 * Résout le plan métier depuis metadata Stripe / ids catalogue.
 * N’accepte plus « premium » comme plan cible — remap one-shot legacy uniquement.
 */
export function resolveCanonicalPlanId(raw: string | undefined | null): CanonicalPlanId {
  const value = (raw ?? '').trim().toLowerCase();

  if (CANONICAL_PLANS.has(value)) {
    return value as CanonicalPlanId;
  }

  // Legacy résiduel (anciennes sessions / metadata)
  if (value === 'free') return 'micro';
  if (value === 'starter') return 'basique';
  if (value === 'premium' || value === 'enterprise') {
    return value === 'enterprise' ? 'max' : 'pro';
  }

  return 'micro';
}

export function isPaidCanonicalPlan(planId: CanonicalPlanId): boolean {
  return PAID_PLANS.has(planId);
}

export function isAppleStorageId(id: string | null | undefined): boolean {
  return String(id ?? '').startsWith('apple:');
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

export async function applyPlanSubscription(
  serviceClient: SupabaseClient,
  input: {
    userId: string;
    planId: CanonicalPlanId;
    status?: 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid' | 'incomplete';
    stripeCustomerId?: string | null;
    stripeSubscriptionId?: string | null;
    currentPeriodStart?: string | null;
    currentPeriodEnd?: string | null;
    cancelAtPeriodEnd?: boolean;
  },
): Promise<void> {
  const now = new Date().toISOString();

  const patch: Record<string, unknown> = {
    plan: input.planId,
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

/** @deprecated Utiliser applyPlanSubscription */
export async function applyPremiumSubscription(
  serviceClient: SupabaseClient,
  input: {
    userId: string;
    planId?: CanonicalPlanId | 'premium' | 'free';
    status?: 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid' | 'incomplete';
    stripeCustomerId?: string | null;
    stripeSubscriptionId?: string | null;
    currentPeriodStart?: string | null;
    currentPeriodEnd?: string | null;
    cancelAtPeriodEnd?: boolean;
  },
): Promise<void> {
  const planId = resolveCanonicalPlanId(input.planId ?? 'pro');
  await applyPlanSubscription(serviceClient, {
    ...input,
    planId: planId === 'micro' ? 'pro' : planId,
  });
}

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
  await applyPlanSubscription(serviceClient, {
    userId: input.userId,
    planId: 'micro',
    status: input.status ?? 'canceled',
    stripeSubscriptionId: input.stripeSubscriptionId,
    currentPeriodStart: input.currentPeriodStart,
    currentPeriodEnd: input.currentPeriodEnd,
    cancelAtPeriodEnd: input.cancelAtPeriodEnd,
  });
}

export async function syncSubscriptionCheckoutSession(
  stripe: Stripe,
  serviceClient: SupabaseClient,
  session: Stripe.Checkout.Session,
): Promise<{ userId: string; planId: CanonicalPlanId }> {
  if (session.mode !== 'subscription') {
    throw new Error('Not a subscription checkout session.');
  }

  if (!isPaidCheckoutSession(session)) {
    throw new Error('Checkout session is not paid yet.');
  }

  const userId = session.metadata?.user_id ?? session.client_reference_id ?? null;
  const planId = resolveCanonicalPlanId(session.metadata?.plan_id);

  if (!userId) {
    throw new Error('Missing user reference on checkout session.');
  }

  if (!isPaidCanonicalPlan(planId)) {
    throw new Error(`Plan Stripe non payant invalide: ${planId}`);
  }

  const { data: currentRow } = await serviceClient
    .from('subscriptions')
    .select('stripe_subscription_id')
    .eq('user_id', userId)
    .maybeSingle();

  if (isAppleStorageId(currentRow?.stripe_subscription_id)) {
    throw new Error(
      'Cet abonnement est géré via l’App Store. Le paiement Stripe n’a pas modifié le compte INVEQ.',
    );
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

  await applyPlanSubscription(serviceClient, {
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
  const planId = resolveCanonicalPlanId(subscription.metadata?.plan_id);

  const { data: currentRow } = await serviceClient
    .from('subscriptions')
    .select('stripe_subscription_id')
    .eq('user_id', userId)
    .maybeSingle();
  const currentStorageId = String(currentRow?.stripe_subscription_id ?? '');
  const isAppleEntitlement = isAppleStorageId(currentStorageId);

  // Un événement Stripe (actif ou non) ne doit jamais remplacer un entitlement Apple.
  if (isAppleEntitlement && currentStorageId !== subscription.id) {
    return;
  }

  if (isActivePaid && isPaidCanonicalPlan(planId)) {
    await applyPlanSubscription(serviceClient, {
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
