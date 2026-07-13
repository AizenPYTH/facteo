import Stripe from 'https://esm.sh/stripe@17.7.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

import { resolveStripePriceId } from '../_shared/subscription-sync.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type CreateSubscriptionCheckoutBody = {
  planId?: string;
  returnUrl?: string;
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
      return jsonResponse({ error: 'Configuration Stripe incomplète côté serveur.' }, 500);
    }

    const authHeader = request.headers.get('Authorization');

    if (!authHeader) {
      return jsonResponse({ error: 'Non autorisé.' }, 401);
    }

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();

    if (userError || !user) {
      return jsonResponse({ error: 'Non autorisé.' }, 401);
    }

    const body = (await request.json().catch(() => ({}))) as CreateSubscriptionCheckoutBody;
    const planId = body.planId ?? 'premium';
    const appReturnUrl =
      body.returnUrl?.trim() ||
      Deno.env.get('FACTEO_SUBSCRIPTION_RETURN_URL')?.trim() ||
      'facteo://settings/premium';

    const serviceClient = createClient(supabaseUrl, supabaseServiceRoleKey);

    const { data: plan, error: planError } = await serviceClient
      .from('subscription_plans')
      .select('id, display_name, stripe_price_id, stripe_product_id')
      .eq('id', planId)
      .eq('is_active', true)
      .maybeSingle();

    if (planError || !plan) {
      return jsonResponse({ error: 'Offre Premium introuvable.' }, 404);
    }

    const stripePriceId = resolveStripePriceId(plan.stripe_price_id);

    if (!stripePriceId) {
      return jsonResponse(
        {
          error:
            'Prix Stripe non configuré. Définissez stripe_price_id sur subscription_plans ou STRIPE_PREMIUM_PRICE_ID dans les secrets Supabase.',
        },
        503,
      );
    }

    const stripe = new Stripe(stripeSecret, { apiVersion: '2024-12-18.acacia' });

    const { data: subscriptionRow } = await serviceClient
      .from('subscriptions')
      .select('stripe_customer_id, stripe_subscription_id, plan, status')
      .eq('user_id', user.id)
      .maybeSingle();

    if (
      subscriptionRow?.stripe_subscription_id &&
      (subscriptionRow.plan === 'premium' || subscriptionRow.status === 'active')
    ) {
      return jsonResponse({ error: 'Vous êtes déjà abonné à FACTEO Premium.' }, 400);
    }

    let customerId = subscriptionRow?.stripe_customer_id ?? null;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        metadata: {
          user_id: user.id,
          source: 'facteo_app',
        },
      });

      customerId = customer.id;

      await serviceClient
        .from('subscriptions')
        .update({
          stripe_customer_id: customerId,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);
    }

    const successUrl = `${appReturnUrl}?subscription=success&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${appReturnUrl}?subscription=canceled`;

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [
        {
          price: stripePriceId,
          quantity: 1,
        },
      ],
      allow_promotion_codes: true,
      metadata: {
        user_id: user.id,
        plan_id: plan.id,
        source: 'facteo_subscription_checkout',
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
          plan_id: plan.id,
        },
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: user.id,
    });

    if (!session.url || !session.id) {
      return jsonResponse({ error: 'Impossible de créer la session Stripe Checkout.' }, 500);
    }

    return jsonResponse(
      {
        checkoutUrl: session.url,
        sessionId: session.id,
      },
      200,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inattendue.';
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
