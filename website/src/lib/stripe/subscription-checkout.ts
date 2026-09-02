import { getSupabaseBrowserClient } from '@/lib/supabase/browser';
import { APP_SUBSCRIPTION_PATH } from '@/lib/constants';
import type { SubscriptionPlanId } from '@/lib/subscription-plans';

export type PaidCheckoutPlanId = Exclude<SubscriptionPlanId, 'micro'>;

export type CreateSubscriptionCheckoutResult = {
  checkoutUrl?: string | null;
  sessionId?: string | null;
  portalUrl?: string | null;
  changed?: boolean;
  planId?: string;
};

export type ConfirmSubscriptionCheckoutResult = {
  planId: string;
  status: string;
  isPremium: boolean;
};

function getFunctionsBaseUrl(): string | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  return supabaseUrl ? `${supabaseUrl.replace(/\/$/, '')}/functions/v1` : null;
}

export function getSubscriptionReturnUrl(): string {
  if (typeof window === 'undefined') {
    return APP_SUBSCRIPTION_PATH;
  }
  return `${window.location.origin}${APP_SUBSCRIPTION_PATH}`;
}

export function isSubscriptionCheckoutConfigured(): boolean {
  return Boolean(getFunctionsBaseUrl());
}

async function getAccessToken(): Promise<string> {
  const supabase = getSupabaseBrowserClient();
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;

  if (!accessToken) {
    throw new Error('Session expirée. Reconnectez-vous.');
  }

  return accessToken;
}

async function callSubscriptionFunction<T>(
  functionName: string,
  payload: Record<string, unknown>,
  fallbackError: string,
): Promise<T> {
  const baseUrl = getFunctionsBaseUrl();
  if (!baseUrl) {
    throw new Error('Stripe abonnement non configuré.');
  }

  const accessToken = await getAccessToken();
  const response = await fetch(`${baseUrl}/${functionName}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const body = (await response.json().catch(() => null)) as
    | (T & { error?: string; message?: string })
    | { error?: string; message?: string }
    | null;

  if (!response.ok) {
    throw new Error(body?.error || body?.message || fallbackError);
  }

  return body as T;
}

export async function createSubscriptionCheckout(
  planId: PaidCheckoutPlanId,
): Promise<CreateSubscriptionCheckoutResult> {
  const result = await callSubscriptionFunction<CreateSubscriptionCheckoutResult>(
    'stripe-create-subscription-checkout',
    {
      planId,
      returnUrl: getSubscriptionReturnUrl(),
      action: 'checkout',
    },
    'Impossible de démarrer le paiement Stripe.',
  );

  if (!result.changed && !result.checkoutUrl) {
    throw new Error('Réponse Stripe invalide.');
  }

  return result;
}

export async function createBillingPortalSession(): Promise<{ portalUrl: string }> {
  const result = await callSubscriptionFunction<{ portalUrl?: string }>(
    'stripe-create-subscription-checkout',
    {
      returnUrl: getSubscriptionReturnUrl(),
      action: 'portal',
    },
    'Impossible d’ouvrir le portail de facturation.',
  );

  if (!result.portalUrl) {
    throw new Error('Portail de facturation indisponible.');
  }

  return { portalUrl: result.portalUrl };
}

export async function confirmSubscriptionCheckout(
  sessionId: string,
): Promise<ConfirmSubscriptionCheckoutResult> {
  return callSubscriptionFunction<ConfirmSubscriptionCheckoutResult>(
    'stripe-confirm-subscription-checkout',
    { sessionId },
    'Impossible de confirmer l’abonnement.',
  );
}

export async function startWebSubscriptionCheckout(
  planId: PaidCheckoutPlanId,
): Promise<'redirect' | 'updated'> {
  const checkout = await createSubscriptionCheckout(planId);

  if (checkout.changed) {
    return 'updated';
  }

  if (!checkout.checkoutUrl) {
    throw new Error('Impossible de démarrer le paiement Stripe.');
  }

  window.location.assign(checkout.checkoutUrl);
  return 'redirect';
}
