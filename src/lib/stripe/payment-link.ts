import { isOfflineDemoData } from '@/lib/demo-data-mode';
import { supabase } from '@/lib/supabase';
import { logSupabaseError } from '@/lib/supabase/errors';

import type { CreatePaymentLinkInput, CreatePaymentLinkResult } from './types';

function getStripeEdgeFunctionUrl(): string | null {
  const explicit = process.env.EXPO_PUBLIC_STRIPE_CHECKOUT_URL?.trim();

  if (explicit) {
    return explicit;
  }

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();

  if (!supabaseUrl) {
    return null;
  }

  return `${supabaseUrl.replace(/\/$/, '')}/functions/v1/stripe-create-checkout`;
}

export function isStripeConfigured(): boolean {
  return Boolean(getStripeEdgeFunctionUrl());
}

export async function createInvoicePaymentLink(
  userId: string,
  input: CreatePaymentLinkInput,
): Promise<CreatePaymentLinkResult> {
  if (isOfflineDemoData()) {
    void userId;
    void input;
    throw new Error('Le paiement en ligne n’est pas encore configuré.');
  }

  const endpoint = getStripeEdgeFunctionUrl();

  if (!endpoint) {
    throw new Error('Stripe non configuré.');
  }

  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;

  if (!accessToken) {
    throw new Error('Session expirée.');
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      invoiceId: input.invoiceId,
      amount: input.amount,
      currency: input.currency ?? 'EUR',
      allowPartialPayment: input.allowPartialPayment ?? true,
    }),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error ?? 'Impossible de créer le lien de paiement.');
  }

  const payload = (await response.json()) as {
    paymentLinkUrl: string;
    sessionId: string;
  };

  const { error: updateError } = await supabase
    .from('invoices')
    .update({
      stripe_payment_link: payload.paymentLinkUrl,
      stripe_checkout_session_id: payload.sessionId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.invoiceId)
    .eq('user_id', userId);

  if (updateError) {
    logSupabaseError('createInvoicePaymentLink.updateInvoice', updateError);
  }

  const { error: insertError } = await supabase.from('stripe_payment_sessions').insert({
    user_id: userId,
    invoice_id: input.invoiceId,
    stripe_checkout_session_id: payload.sessionId,
    payment_link_url: payload.paymentLinkUrl,
    amount: input.amount,
    currency: input.currency ?? 'EUR',
    status: 'pending',
  });

  if (insertError) {
    logSupabaseError('createInvoicePaymentLink.insertSession', insertError);
  }

  return {
    paymentLinkUrl: payload.paymentLinkUrl,
    sessionId: payload.sessionId,
  };
}

export async function openPaymentLink(url: string): Promise<void> {
  const { openURL } = await import('expo-linking');
  await openURL(url);
}
