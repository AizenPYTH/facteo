import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

import type { CatalogPlanId } from '@/constants/subscription-catalog';
import { supabase } from '@/lib/supabase';
import type { EffectivePlanId } from '@/types/subscription';

export type CreateSubscriptionCheckoutResult = {
  checkoutUrl: string;
  sessionId: string;
};

export type ConfirmSubscriptionCheckoutResult = {
  planId: EffectivePlanId;
  status: string;
  isPremium: boolean;
};

export class SubscriptionCheckoutCanceledError extends Error {
  constructor() {
    super('SUBSCRIPTION_CHECKOUT_CANCELED');
    this.name = 'SubscriptionCheckoutCanceledError';
  }
}

export const PLAN_RETURN_PATH = 'settings/premium';
/** @deprecated */
export const PREMIUM_RETURN_PATH = PLAN_RETURN_PATH;

function getSupabaseFunctionsBaseUrl(): string | null {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
  return supabaseUrl ? `${supabaseUrl.replace(/\/$/, '')}/functions/v1` : null;
}

function getSubscriptionCheckoutUrl(): string | null {
  const explicit = process.env.EXPO_PUBLIC_STRIPE_SUBSCRIPTION_CHECKOUT_URL?.trim();
  if (explicit) return explicit;
  const baseUrl = getSupabaseFunctionsBaseUrl();
  return baseUrl ? `${baseUrl}/stripe-create-subscription-checkout` : null;
}

function getSubscriptionConfirmUrl(): string | null {
  const explicit = process.env.EXPO_PUBLIC_STRIPE_SUBSCRIPTION_CONFIRM_URL?.trim();
  if (explicit) return explicit;
  const baseUrl = getSupabaseFunctionsBaseUrl();
  return baseUrl ? `${baseUrl}/stripe-confirm-subscription-checkout` : null;
}

export function getPlanReturnUrl(): string {
  return Linking.createURL(PLAN_RETURN_PATH);
}

/** @deprecated */
export function getPremiumReturnUrl(): string {
  return getPlanReturnUrl();
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
  if (Array.isArray(value)) return value[0];
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
  planId: Exclude<CatalogPlanId, 'micro'>,
): Promise<CreateSubscriptionCheckoutResult> {
  const endpoint = getSubscriptionCheckoutUrl();
  if (!endpoint) {
    throw new Error('Stripe abonnement non configuré.');
  }

  const accessToken = await getAccessToken();
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      planId,
      returnUrl: getPlanReturnUrl(),
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

export async function startPlanCheckoutFlow(
  planId: Exclude<CatalogPlanId, 'micro'>,
): Promise<ConfirmSubscriptionCheckoutResult | null> {
  if (Platform.OS === 'ios') {
    throw new Error(
      'Sur iOS, les abonnements s’achètent uniquement via In-App Purchase Apple.',
    );
  }

  const returnUrl = getPlanReturnUrl();
  const checkout = await createSubscriptionCheckout(planId);
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

/** @deprecated Utiliser startPlanCheckoutFlow */
export async function startPremiumCheckoutFlow(
  planId: Exclude<CatalogPlanId, 'micro'> = 'pro',
): Promise<ConfirmSubscriptionCheckoutResult | null> {
  return startPlanCheckoutFlow(planId === ('premium' as string) ? 'pro' : planId);
}

export function isSubscriptionCheckoutCanceledError(
  error: unknown,
): error is SubscriptionCheckoutCanceledError {
  return error instanceof SubscriptionCheckoutCanceledError;
}
