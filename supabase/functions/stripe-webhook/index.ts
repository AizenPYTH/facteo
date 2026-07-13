import Stripe from 'https://esm.sh/stripe@17.7.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
};

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!stripeSecret || !webhookSecret || !supabaseUrl || !supabaseServiceRoleKey) {
    return new Response('Stripe webhook configuration missing.', { status: 500 });
  }

  const stripe = new Stripe(stripeSecret, { apiVersion: '2024-12-18.acacia' });
  const signature = request.headers.get('stripe-signature');
  const body = await request.text();

  if (!signature) {
    return new Response('Missing stripe-signature header.', { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid signature.';
    return new Response(message, { status: 400 });
  }

  const serviceClient = createClient(supabaseUrl, supabaseServiceRoleKey);

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(serviceClient, event.data.object as Stripe.Checkout.Session);
        break;
      case 'checkout.session.expired':
        await updateSessionStatus(
          serviceClient,
          (event.data.object as Stripe.Checkout.Session).id,
          'canceled',
        );
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(serviceClient, event.data.object as Stripe.PaymentIntent);
        break;
      default:
        break;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Webhook handler failed.';
    return new Response(message, { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});

async function handleCheckoutCompleted(
  serviceClient: ReturnType<typeof createClient>,
  session: Stripe.Checkout.Session,
) {
  if (session.mode === 'subscription') {
    return;
  }

  const invoiceId = session.metadata?.invoice_id;
  const userId = session.metadata?.user_id;

  if (!invoiceId || !userId) {
    throw new Error('Missing invoice metadata on checkout session.');
  }

  const amountPaid = (session.amount_total ?? 0) / 100;
  const paymentIntentId =
    typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id ?? null;
  const now = new Date().toISOString();

  const { data: invoice, error: invoiceError } = await serviceClient
    .from('invoices')
    .select('id, user_id, status, total_ttc, due_at')
    .eq('id', invoiceId)
    .eq('user_id', userId)
    .maybeSingle();

  if (invoiceError || !invoice) {
    throw new Error('Invoice not found for Stripe session.');
  }

  const { data: existingPayment } = await serviceClient
    .from('invoice_payments')
    .select('id')
    .eq('invoice_id', invoiceId)
    .eq('payment_reference', session.id)
    .maybeSingle();

  if (!existingPayment && amountPaid > 0) {
    const { error: paymentError } = await serviceClient.from('invoice_payments').insert({
      invoice_id: invoiceId,
      user_id: userId,
      amount: amountPaid,
      paid_at: now,
      payment_method: 'stripe',
      payment_reference: session.id,
      notes: 'Paiement Stripe Checkout',
    });

    if (paymentError) {
      throw paymentError;
    }
  }

  const { data: payments, error: paymentsError } = await serviceClient
    .from('invoice_payments')
    .select('amount')
    .eq('invoice_id', invoiceId)
    .eq('user_id', userId);

  if (paymentsError) {
    throw paymentsError;
  }

  const amountPaidTotal = (payments ?? []).reduce((sum, payment) => sum + Number(payment.amount), 0);
  const totalTtc = Number(invoice.total_ttc);
  const nextStatus =
    amountPaidTotal >= totalTtc - 0.01
      ? 'paid'
      : amountPaidTotal > 0
        ? 'partially_paid'
        : invoice.status;

  const { error: invoiceUpdateError } = await serviceClient
    .from('invoices')
    .update({
      status: nextStatus,
      paid_at: nextStatus === 'paid' ? now : null,
      payment_method: 'stripe',
      payment_reference: session.id,
      updated_at: now,
    })
    .eq('id', invoiceId)
    .eq('user_id', userId);

  if (invoiceUpdateError) {
    throw invoiceUpdateError;
  }

  await serviceClient
    .from('stripe_payment_sessions')
    .update({
      status: 'succeeded',
      stripe_payment_intent_id: paymentIntentId,
      updated_at: now,
    })
    .eq('stripe_checkout_session_id', session.id);
}

async function handlePaymentFailed(
  serviceClient: ReturnType<typeof createClient>,
  paymentIntent: Stripe.PaymentIntent,
) {
  const sessionId = paymentIntent.metadata?.checkout_session_id;

  if (!sessionId) {
    return;
  }

  await updateSessionStatus(serviceClient, sessionId, 'failed');
}

async function updateSessionStatus(
  serviceClient: ReturnType<typeof createClient>,
  sessionId: string,
  status: 'pending' | 'processing' | 'succeeded' | 'canceled' | 'failed',
) {
  await serviceClient
    .from('stripe_payment_sessions')
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_checkout_session_id', sessionId);
}
