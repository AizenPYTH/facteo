import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

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

export class SubscriptionCheckoutCanceledError extends Error {
  constructor() {
    super('SUBSCRIPTION_CHECKOUT_CANCELED');
    this.name = 'SubscriptionCheckoutCanceledError';
  }
}

export const SUBSCRIPTION_RETURN_PATH = 'settings/subscription';

/** @deprecated Prefer SUBSCRIPTION_RETURN_PATH */
export const PREMIUM_RETURN_PATH = SUBSCRIPTION_RETURN_PATH;

function getSupabaseFunctionsBaseUrl(): string | null {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
  return supabaseUrl ? `${supabaseUrl.replace(/\/$/, '')}/functions/v1` : null;
}

function getSubscriptionCheckoutUrl(): string | null {
  const explicit = process.env.EXPO_PUBLIC_STRIPE_SUBSCRIPTION_CHECKOUT_URL?.trim();

  if (explicit) {
    return explicit;
  }

  const baseUrl = getSupabaseFunctionsBaseUrl();
  return baseUrl ? `${baseUrl}/stripe-create-subscription-checkout` : null;
}

function getSubscriptionConfirmUrl(): string | null {
  const explicit = process.env.EXPO_PUBLIC_STRIPE_SUBSCRIPTION_CONFIRM_URL?.trim();

  if (explicit) {
    return explicit;
  }

  const baseUrl = getSupabaseFunctionsBaseUrl();
  return baseUrl ? `${baseUrl}/stripe-confirm-subscription-checkout` : null;
}

export function getSubscriptionReturnUrl(): string {
  return Linking.createURL(SUBSCRIPTION_RETURN_PATH);
}

/** @deprecated Prefer getSubscriptionReturnUrl */
export function getPremiumReturnUrl(): string {
  return getSubscriptionReturnUrl();
}

export function isSubscriptionCheckoutConfigured(): boolean {
  return Boolean(getSubscriptionCheckoutUrl() && getSubscriptionConfirmUrl());
}

export function parseSubscriptionReturnUrl(url: string): {
  subscription?: string;
  sessionId?: string;
} {
  const parsed = Linking.parse(url);
  const query = parsed.queryParams ?? {};

  const subscription = readQueryParam(query.subscription);
  const sessionId = readQueryParam(query.session_id) ?? readQueryParam(query.sessionId);

  return { subscription, sessionId };
}

function readQueryParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return typeof value === 'string' ? value : undefined;
}

async function getAccessToken(): Promise<string> {
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;

  if (!accessToken) {
    throw new Error('Session expirée. Reconnectez-vous.');
  }

  return accessToken;
}

export async function createSubscriptionCheckout(
  planId: PaidPlanId,
  options?: { promotionCode?: string; interval?: BillingInterval },
): Promise<CreateSubscriptionCheckoutResult> {
  const endpoint = getSubscriptionCheckoutUrl();

  if (!endpoint) {
    throw new Error('Stripe abonnement non configuré.');
  }

  const accessToken = await getAccessToken();
  const promotionCode = options?.promotionCode?.trim() || undefined;
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
      returnUrl: getSubscriptionReturnUrl(),
      ...(promotionCode ? { promotionCode } : {}),
    }),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as {
      error?: string;
      code?: string;
      useBillingPortal?: boolean;
    } | null;
    if (payload?.useBillingPortal || payload?.code === 'USE_BILLING_PORTAL') {
      const err = new Error(
        payload.error ??
          'Abonnement déjà actif — utilisez « Gérer mon abonnement » pour changer d’offre.',
      ) as Error & { useBillingPortal?: boolean; code?: string };
      err.useBillingPortal = true;
      err.code = payload.code ?? 'USE_BILLING_PORTAL';
      throw err;
    }
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

export async function startSubscriptionCheckoutFlow(
  planId: PaidPlanId,
  options?: { promotionCode?: string; interval?: BillingInterval },
): Promise<ConfirmSubscriptionCheckoutResult | null> {
  const returnUrl = getSubscriptionReturnUrl();

  let checkout: CreateSubscriptionCheckoutResult;
  try {
    checkout = await createSubscriptionCheckout(planId, options);
  } catch (error) {
    const portalError = error as Error & { useBillingPortal?: boolean };
    if (portalError.useBillingPortal) {
      const portalUrl = await openBillingPortal({ returnUrl });
      WebBrowser.maybeCompleteAuthSession();
      await WebBrowser.openAuthSessionAsync(portalUrl, returnUrl, {
        preferEphemeralSession: true,
      });
      return null;
    }
    throw error;
  }

  WebBrowser.maybeCompleteAuthSession();

  const browserResult = await WebBrowser.openAuthSessionAsync(checkout.checkoutUrl, returnUrl, {
    preferEphemeralSession: true,
  });

  if (browserResult.type === 'cancel' || browserResult.type === 'dismiss') {
    throw new SubscriptionCheckoutCanceledError();
  }

  if (browserResult.type !== 'success' || !browserResult.url) {
    throw new Error('Le paiement Stripe n’a pas pu être finalisé.');
  }

  const { subscription, sessionId } = parseSubscriptionReturnUrl(browserResult.url);

  if (subscription === 'canceled') {
    throw new SubscriptionCheckoutCanceledError();
  }

  if (subscription !== 'success') {
    return null;
  }

  const resolvedSessionId = sessionId ?? checkout.sessionId;

  if (!resolvedSessionId) {
    throw new Error('Session Stripe introuvable après paiement.');
  }

  return confirmSubscriptionCheckout(resolvedSessionId);
}

/** @deprecated Prefer startSubscriptionCheckoutFlow with an explicit planId */
export async function startPremiumCheckoutFlow(
  _planId: 'premium' | PaidPlanId = 'pro',
  options?: { promotionCode?: string; interval?: BillingInterval },
): Promise<ConfirmSubscriptionCheckoutResult | null> {
  const planId: PaidPlanId =
    _planId === 'premium' ? 'pro' : (_planId as PaidPlanId);
  return startSubscriptionCheckoutFlow(planId, options);
}

export function isSubscriptionCheckoutCanceledError(
  error: unknown,
): error is SubscriptionCheckoutCanceledError {
  return error instanceof SubscriptionCheckoutCanceledError;
}

function getBillingPortalUrl(): string | null {
  const explicit = process.env.EXPO_PUBLIC_STRIPE_BILLING_PORTAL_URL?.trim();
  if (explicit) return explicit;
  const baseUrl = getSupabaseFunctionsBaseUrl();
  return baseUrl ? `${baseUrl}/stripe-create-billing-portal` : null;
}

/** Ouvre le Customer Portal Stripe (changer d’offre, résilier, CB). */
export async function openBillingPortal(options?: {
  returnUrl?: string;
}): Promise<string> {
  const endpoint = getBillingPortalUrl();
  if (!endpoint) {
    throw new Error('Portail Stripe non configuré.');
  }

  const accessToken = await getAccessToken();
  const returnUrl = options?.returnUrl?.trim() || getSubscriptionReturnUrl();

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

  return payload.portalUrl;
}
