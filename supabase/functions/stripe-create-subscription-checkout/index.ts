import Stripe from 'https://esm.sh/stripe@17.7.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

import {
  isPaidSubscriptionStatus,
  normalizeRequestedPlanId,
  resolvePlanId,
  resolveStripePriceId,
  syncStripeSubscriptionObject,
} from '../_shared/subscription-sync.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type CreateSubscriptionCheckoutBody = {
  planId?: string;
  returnUrl?: string;
  action?: 'checkout' | 'portal';
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
    const appReturnUrl = normalizeReturnUrl(
      body.returnUrl?.trim() ||
        Deno.env.get('INVEQ_SUBSCRIPTION_RETURN_URL')?.trim() ||
        'INVEQ://settings/premium',
    );

    const stripe = new Stripe(stripeSecret, { apiVersion: '2024-12-18.acacia' });
    const serviceClient = createClient(supabaseUrl, supabaseServiceRoleKey);

    const { data: existingRow } = await serviceClient
      .from('subscriptions')
      .select('stripe_customer_id, stripe_subscription_id, plan, status')
      .eq('user_id', user.id)
      .maybeSingle();

    let subscriptionRow = existingRow;

    if (!subscriptionRow) {
      await serviceClient.from('subscriptions').upsert(
        {
          user_id: user.id,
          plan: 'free',
          status: 'active',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' },
      );

      const { data: createdRow } = await serviceClient
        .from('subscriptions')
        .select('stripe_customer_id, stripe_subscription_id, plan, status')
        .eq('user_id', user.id)
        .maybeSingle();

      subscriptionRow = createdRow;
    }

    if (body.action === 'portal') {
      const customerId = subscriptionRow?.stripe_customer_id;
      if (!customerId) {
        return jsonResponse(
          { error: 'Aucun client Stripe associé. Souscrivez d’abord à une offre payante.' },
          400,
        );
      }

      const portal = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: appReturnUrl,
      });

      if (!portal.url) {
        return jsonResponse({ error: 'Impossible d’ouvrir le portail de facturation Stripe.' }, 500);
      }

      return jsonResponse({ portalUrl: portal.url }, 200);
    }

    const planId = normalizeRequestedPlanId(body.planId);

    if (!planId) {
      return jsonResponse(
        { error: 'Choisissez une offre Basique, Standard ou Pro pour payer en ligne.' },
        400,
      );
    }

    const { data: plan, error: planError } = await serviceClient
      .from('subscription_plans')
      .select('id, display_name, stripe_price_id, stripe_product_id')
      .eq('id', planId)
      .eq('is_active', true)
      .maybeSingle();

    if (planError || !plan) {
      return jsonResponse({ error: 'Offre introuvable ou inactive.' }, 404);
    }

    const stripePriceId = resolveStripePriceId(plan.stripe_price_id, plan.id);

    if (!stripePriceId) {
      return jsonResponse(
        {
          error:
            `Prix Stripe non configuré pour l’offre ${plan.display_name}. ` +
            'Renseignez stripe_price_id sur subscription_plans ou le secret STRIPE_' +
            `${plan.id.toUpperCase()}_PRICE_ID.`,
        },
        503,
      );
    }

    const currentPlanId = resolvePlanId(subscriptionRow?.plan, subscriptionRow?.status);
    const hasActiveStripeSubscription =
      Boolean(subscriptionRow?.stripe_subscription_id) &&
      isPaidSubscriptionStatus(subscriptionRow?.status);

    if (hasActiveStripeSubscription && currentPlanId === planId) {
      return jsonResponse({ error: `Vous êtes déjà abonné à l’offre ${plan.display_name}.` }, 400);
    }

    let customerId = subscriptionRow?.stripe_customer_id ?? null;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        metadata: {
          user_id: user.id,
          source: 'INVEQ_web',
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

    if (hasActiveStripeSubscription && subscriptionRow?.stripe_subscription_id) {
      const existing = await stripe.subscriptions.retrieve(subscriptionRow.stripe_subscription_id);
      const item = existing.items.data[0];

      if (!item?.id) {
        return jsonResponse({ error: 'Abonnement Stripe incomplet. Contactez le support.' }, 500);
      }

      const updated = await stripe.subscriptions.update(existing.id, {
        items: [{ id: item.id, price: stripePriceId }],
        metadata: {
          user_id: user.id,
          plan_id: plan.id,
        },
        proration_behavior: 'create_prorations',
        cancel_at_period_end: false,
      });

      await syncStripeSubscriptionObject(serviceClient, updated);

      return jsonResponse(
        {
          changed: true,
          planId: plan.id,
          checkoutUrl: null,
          sessionId: null,
        },
        200,
      );
    }

    const successUrl = `${appReturnUrl}?subscription=success&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${appReturnUrl}?subscription=canceled`;

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      locale: 'fr',
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
        source: 'INVEQ_subscription_checkout',
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
        changed: false,
        planId: plan.id,
      },
      200,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inattendue.';
    return jsonResponse({ error: message }, 500);
  }
});

function normalizeReturnUrl(raw: string): string {
  try {
    const url = new URL(raw);
    url.search = '';
    url.hash = '';
    return url.toString().replace(/\/$/, '');
  } catch {
    return raw.replace(/[?#].*$/, '');
  }
}

function jsonResponse(payload: Record<string, unknown>, status: number): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}
