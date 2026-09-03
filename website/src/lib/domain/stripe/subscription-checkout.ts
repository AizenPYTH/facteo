import type { EffectivePlanId } from '@/types/subscription';

export type PaidCatalogPlanId = 'basique' | 'standard' | 'pro' | 'max';

export type CreateSubscriptionCheckoutResult = {
  checkoutUrl: string;
  sessionId: string;
};

export type ConfirmSubscriptionCheckoutResult = {
  planId: EffectivePlanId;
  status: string;
  isPremium: boolean;
};

function getFunctionsBaseUrl(): string | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  return supabaseUrl ? `${supabaseUrl.replace(/\/$/, '')}/functions/v1` : null;
}

function getAnonKey(): string | null {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || null;
}

async function callFunction<T>(
  path: string,
  accessToken: string,
  body: Record<string, unknown>,
): Promise<T> {
  const base = getFunctionsBaseUrl();
  const anonKey = getAnonKey();
  if (!base) {
    throw new Error('Supabase non configuré.');
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  };
  if (anonKey) {
    headers.apikey = anonKey;
  }

  const response = await fetch(`${base}/${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  const payload = (await response.json().catch(() => null)) as (T & { error?: string }) | { error?: string } | null;
  if (!response.ok) {
    throw new Error(payload?.error ?? 'Impossible de contacter Stripe.');
  }

  return payload as T;
}

export function getWebSubscriptionReturnUrl(): string {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/app/settings/subscription`;
  }
  const site = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, '') || 'https://www.inveq.fr';
  return `${site}/app/settings/subscription`;
}

export function createWebSubscriptionCheckout(
  accessToken: string,
  planId: PaidCatalogPlanId,
  returnUrl: string,
) {
  return callFunction<CreateSubscriptionCheckoutResult>(
    'stripe-create-subscription-checkout',
    accessToken,
    { planId, returnUrl },
  );
}

export function confirmWebSubscriptionCheckout(accessToken: string, sessionId: string) {
  return callFunction<ConfirmSubscriptionCheckoutResult>(
    'stripe-confirm-subscription-checkout',
    accessToken,
    { sessionId },
  );
}

export function createWebBillingPortal(accessToken: string, returnUrl: string) {
  return callFunction<{ portalUrl: string }>('stripe-create-billing-portal', accessToken, {
    returnUrl,
  });
}

export function isAppleManagedSubscription(stripeSubscriptionId: string | null | undefined): boolean {
  return Boolean(stripeSubscriptionId?.startsWith('apple:'));
}
