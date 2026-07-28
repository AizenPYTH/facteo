import { SITE_URL } from '@/lib/constants';
import { supabase } from '@/lib/supabase';

export type PaidPlanId = 'basique' | 'standard' | 'pro' | 'max';
export type BillingInterval = 'monthly' | 'yearly';

export type CreateSubscriptionCheckoutResult = {
  checkoutUrl: string;
  sessionId: string;
  planId?: PaidPlanId;
  interval?: BillingInterval;
  priceId?: string;
};

export type ConfirmSubscriptionCheckoutResult = {
  planId: string;
  status: string;
  isPremium: boolean;
  isPaid?: boolean;
};

function getSupabaseFunctionsBaseUrl(): string | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  return supabaseUrl ? `${supabaseUrl.replace(/\/$/, '')}/functions/v1` : null;
}

function getSubscriptionCheckoutUrl(): string | null {
  const explicit = process.env.NEXT_PUBLIC_STRIPE_SUBSCRIPTION_CHECKOUT_URL?.trim();
  if (explicit) {
    return explicit;
  }
  const baseUrl = getSupabaseFunctionsBaseUrl();
  return baseUrl ? `${baseUrl}/stripe-create-subscription-checkout` : null;
}

function getSubscriptionConfirmUrl(): string | null {
  const explicit = process.env.NEXT_PUBLIC_STRIPE_SUBSCRIPTION_CONFIRM_URL?.trim();
  if (explicit) {
    return explicit;
  }
  const baseUrl = getSupabaseFunctionsBaseUrl();
  return baseUrl ? `${baseUrl}/stripe-confirm-subscription-checkout` : null;
}

export function getListSubscriptionPricesUrl(): string | null {
  const baseUrl = getSupabaseFunctionsBaseUrl();
  return baseUrl ? `${baseUrl}/list-subscription-prices` : null;
}

/** URL de retour web après Stripe Checkout. */
export function getSubscriptionWebReturnUrl(): string {
  return `${SITE_URL}/app/settings/subscription`;
}

/** @deprecated Prefer getSubscriptionWebReturnUrl */
export function getPremiumWebReturnUrl(): string {
  return getSubscriptionWebReturnUrl();
}

export function isSubscriptionCheckoutConfigured(): boolean {
  return Boolean(getSubscriptionCheckoutUrl() && getSubscriptionConfirmUrl());
}

async function getAccessToken(): Promise<string> {
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;

  if (!accessToken) {
    throw new Error('Connectez-vous pour souscrire.');
  }

  return accessToken;
}

export async function createSubscriptionCheckout(
  planId: PaidPlanId,
  options?: { promotionCode?: string; returnUrl?: string; interval?: BillingInterval },
): Promise<CreateSubscriptionCheckoutResult> {
  const endpoint = getSubscriptionCheckoutUrl();

  if (!endpoint) {
    throw new Error('Stripe abonnement non configuré.');
  }

  const accessToken = await getAccessToken();
  const promotionCode = options?.promotionCode?.trim() || undefined;
  const returnUrl = options?.returnUrl?.trim() || getSubscriptionWebReturnUrl();
  const interval = options?.interval ?? 'monthly';

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      planId,
      interval,
      returnUrl,
      ...(promotionCode ? { promotionCode } : {}),
    }),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error ?? 'Impossible de démarrer l’abonnement.');
  }

  const payload = (await response.json()) as CreateSubscriptionCheckoutResult;

  if (!payload.checkoutUrl) {
    throw new Error('Réponse Stripe invalide.');
  }

  return payload;
}

export async function confirmSubscriptionCheckout(
  sessionId: string,
): Promise<ConfirmSubscriptionCheckoutResult> {
  const endpoint = getSubscriptionConfirmUrl();

  if (!endpoint) {
    throw new Error('Confirmation Stripe non configurée.');
  }

  const accessToken = await getAccessToken();

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sessionId }),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error ?? 'Impossible de confirmer l’abonnement.');
  }

  return (await response.json()) as ConfirmSubscriptionCheckoutResult;
}

/** Crée la session et redirige le navigateur vers Stripe Checkout. */
export async function startSubscriptionCheckoutRedirect(
  planId: PaidPlanId,
  options?: { promotionCode?: string; returnUrl?: string; interval?: BillingInterval },
): Promise<void> {
  const checkout = await createSubscriptionCheckout(planId, options);
  window.location.assign(checkout.checkoutUrl);
}

/** @deprecated Prefer startSubscriptionCheckoutRedirect with explicit planId */
export async function startPremiumCheckoutRedirect(
  options?: { promotionCode?: string; returnUrl?: string; interval?: BillingInterval },
): Promise<void> {
  await startSubscriptionCheckoutRedirect('pro', options);
}

function getBillingPortalUrl(): string | null {
  const baseUrl = getSupabaseFunctionsBaseUrl();
  return baseUrl ? `${baseUrl}/stripe-create-billing-portal` : null;
}

/** Ouvre le Customer Portal Stripe (changer d’offre, résilier, CB). */
export async function startBillingPortalRedirect(options?: {
  returnUrl?: string;
}): Promise<void> {
  const endpoint = getBillingPortalUrl();
  if (!endpoint) {
    throw new Error('Portail Stripe non configuré.');
  }

  const accessToken = await getAccessToken();
  const returnUrl = options?.returnUrl?.trim() || getSubscriptionWebReturnUrl();

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ returnUrl }),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error ?? 'Impossible d’ouvrir le portail d’abonnement.');
  }

  const payload = (await response.json()) as { portalUrl?: string };
  if (!payload.portalUrl) {
    throw new Error('Réponse portail Stripe invalide.');
  }

  window.location.assign(payload.portalUrl);
}

export type StripePlanPrice = {
  priceId: string;
  lookupKey: string | null;
  unitAmount: number;
  currency: string;
  interval: BillingInterval;
  monthlyEquivalentAmount: number | null;
};

export type StripePlansPricesResponse = {
  currency: string;
  plans: Array<{
    planId: PaidPlanId;
    monthly: StripePlanPrice | null;
    yearly: StripePlanPrice | null;
  }>;
};

/** Prix lus depuis Stripe (edge function) — aucun montant hardcodé côté client. */
export async function fetchStripeSubscriptionPrices(): Promise<StripePlansPricesResponse | null> {
  const endpoint = getListSubscriptionPricesUrl();
  if (!endpoint) return null;

  const response = await fetch(endpoint, { method: 'GET' });
  if (!response.ok) return null;
  return (await response.json()) as StripePlansPricesResponse;
}
