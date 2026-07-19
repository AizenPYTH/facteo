import Stripe from 'https://esm.sh/stripe@17.7.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type CreateCheckoutBody = {
  invoiceId: string;
  amount: number;
  currency?: string;
};

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!stripeSecret || !supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
      return jsonResponse({ error: 'Stripe configuration missing.' }, 500);
    }

    const authHeader = request.headers.get('Authorization');

    if (!authHeader) {
      return jsonResponse({ error: 'Unauthorized.' }, 401);
    }

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();

    if (userError || !user) {
      return jsonResponse({ error: 'Unauthorized.' }, 401);
    }

    const body = (await request.json()) as CreateCheckoutBody;

    if (!body.invoiceId || !body.amount || body.amount <= 0) {
      return jsonResponse({ error: 'Invalid request.' }, 400);
    }

    const serviceClient = createClient(supabaseUrl, supabaseServiceRoleKey);

    const { data: invoice, error: invoiceError } = await serviceClient
      .from('invoices')
      .select('id, user_id, number, status, total_ttc, client_id')
      .eq('id', body.invoiceId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (invoiceError || !invoice) {
      return jsonResponse({ error: 'Invoice not found.' }, 404);
    }

    if (invoice.status === 'paid' || invoice.status === 'canceled' || invoice.status === 'draft') {
      return jsonResponse({ error: 'Invoice cannot be paid online.' }, 400);
    }

    const stripe = new Stripe(stripeSecret, { apiVersion: '2024-12-18.acacia' });
    const currency = (body.currency ?? 'EUR').toLowerCase();
    const amountInCents = Math.round(body.amount * 100);
    const clientName = 'Client Factume';

    const successUrl = `factume://invoices/${invoice.id}?payment=success&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `factume://invoices/${invoice.id}?payment=canceled`;

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency,
            unit_amount: amountInCents,
            product_data: {
              name: `Facture ${invoice.number}`,
              description: `Paiement pour ${clientName}`,
            },
          },
        },
      ],
      metadata: {
        invoice_id: invoice.id,
        user_id: user.id,
        invoice_number: invoice.number,
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: invoice.id,
    });

    if (!session.url || !session.id) {
      return jsonResponse({ error: 'Unable to create checkout session.' }, 500);
    }

    const now = new Date().toISOString();

    await serviceClient
      .from('invoices')
      .update({
        stripe_payment_link: session.url,
        stripe_checkout_session_id: session.id,
        updated_at: now,
      })
      .eq('id', invoice.id)
      .eq('user_id', user.id);

    await serviceClient.from('stripe_payment_sessions').insert({
      user_id: user.id,
      invoice_id: invoice.id,
      stripe_checkout_session_id: session.id,
      payment_link_url: session.url,
      amount: body.amount,
      currency: currency.toUpperCase(),
      status: 'pending',
      metadata: {
        source: 'factume_app',
      },
      updated_at: now,
    });

    return jsonResponse({
      paymentLinkUrl: session.url,
      sessionId: session.id,
    }, 200);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error.';
    return jsonResponse({ error: message }, 500);
  }
});

function jsonResponse(payload: Record<string, unknown>, status: number): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}
