import { SITE_URL } from '@/lib/constants';
import { supabase } from '@/lib/supabase';

export type CreateSubscriptionCheckoutResult = {
  checkoutUrl: string;
  sessionId: string;
};

export type ConfirmSubscriptionCheckoutResult = {
  planId: 'free' | 'premium';
  status: string;
  isPremium: boolean;
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

/** URL de retour web après Stripe Checkout. */
export function getPremiumWebReturnUrl(): string {
  return `${SITE_URL}/app/settings/subscription`;
}

export function isSubscriptionCheckoutConfigured(): boolean {
  return Boolean(getSubscriptionCheckoutUrl() && getSubscriptionConfirmUrl());
}

async function getAccessToken(): Promise<string> {
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;

  if (!accessToken) {
    throw new Error('Connectez-vous pour souscrire à Premium.');
  }

  return accessToken;
}

export async function createSubscriptionCheckout(
  planId: 'premium' = 'premium',
  options?: { promotionCode?: string; returnUrl?: string },
): Promise<CreateSubscriptionCheckoutResult> {
  const endpoint = getSubscriptionCheckoutUrl();

  if (!endpoint) {
    throw new Error('Stripe abonnement non configuré.');
  }

  const accessToken = await getAccessToken();
  const promotionCode = options?.promotionCode?.trim() || undefined;
  const returnUrl = options?.returnUrl?.trim() || getPremiumWebReturnUrl();

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      planId,
      returnUrl,
      ...(promotionCode ? { promotionCode } : {}),
    }),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error ?? 'Impossible de démarrer l’abonnement Premium.');
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
    throw new Error(payload?.error ?? 'Impossible de confirmer l’abonnement Premium.');
  }

  return (await response.json()) as ConfirmSubscriptionCheckoutResult;
}

/** Crée la session et redirige le navigateur vers Stripe Checkout. */
export async function startPremiumCheckoutRedirect(
  options?: { promotionCode?: string; returnUrl?: string },
): Promise<void> {
  const checkout = await createSubscriptionCheckout('premium', options);
  window.location.assign(checkout.checkoutUrl);
}
