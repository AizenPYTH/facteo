import Stripe from 'https://esm.sh/stripe@17.7.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

import {
  isPaidPlanId,
  normalizePlanId,
  resolveStripePriceIdForPlan,
  type BillingInterval,
  type PaidSubscriptionPlanId,
} from '../_shared/subscription-sync.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type CreateSubscriptionCheckoutBody = {
  planId?: string;
  interval?: BillingInterval | string;
  returnUrl?: string;
  /** Optional Stripe promotion code (e.g. WELCOME20). Applied if valid & active. */
  promotionCode?: string;
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
    const rawPlanId = body.planId?.trim() || '';
    const normalizedPlan = normalizePlanId(rawPlanId);

    // Cause historique du bug « Formule / Offre Premium introuvable » :
    // le client envoyait planId=premium alors que premium est is_active=false.
    if (!isPaidPlanId(normalizedPlan)) {
      return jsonResponse(
        {
          error:
            'Formule introuvable. Choisissez Basique, Standard, Pro ou Max (mensuel ou annuel).',
          code: 'PLAN_NOT_FOUND',
          receivedPlanId: rawPlanId || null,
        },
        404,
      );
    }

    const planId = normalizedPlan as PaidSubscriptionPlanId;
    const interval: BillingInterval = body.interval === 'yearly' ? 'yearly' : 'monthly';
    const promotionCodeInput = body.promotionCode?.trim() || '';
    const appReturnUrl =
      body.returnUrl?.trim() ||
      Deno.env.get('INVEQ_SUBSCRIPTION_RETURN_URL')?.trim() ||
      'inveq://settings/subscription';

    const serviceClient = createClient(supabaseUrl, supabaseServiceRoleKey);

    const { data: plan, error: planError } = await serviceClient
      .from('subscription_plans')
      .select(
        'id, display_name, stripe_price_id, stripe_price_id_yearly, stripe_lookup_key_monthly, stripe_lookup_key_yearly, stripe_product_id, is_active',
      )
      .eq('id', planId)
      .eq('is_active', true)
      .maybeSingle();

    // Ligne exacte qui provoquait l’erreur : plan premium désactivé → maybeSingle() = null
    if (planError || !plan) {
      return jsonResponse(
        {
          error: `Formule introuvable pour l’offre « ${planId} ».`,
          code: 'PLAN_ROW_MISSING',
          planId,
        },
        404,
      );
    }

    const stripe = new Stripe(stripeSecret, { apiVersion: '2024-12-18.acacia' });
    const stripePriceId = await resolveStripePriceIdForPlan(stripe, plan, interval);

    if (!stripePriceId) {
      return jsonResponse(
        {
          error:
            'Prix Stripe introuvable. Créez les Prices avec les lookup_keys (monthly_basic, yearly_basic, …) ou renseignez stripe_price_id / stripe_price_id_yearly.',
          code: 'PRICE_NOT_CONFIGURED',
          planId,
          interval,
        },
        503,
      );
    }

    // Cache le price id résolu pour accélérer les prochains checkouts
    const priceCachePatch =
      interval === 'yearly'
        ? { stripe_price_id_yearly: stripePriceId, updated_at: new Date().toISOString() }
        : { stripe_price_id: stripePriceId, updated_at: new Date().toISOString() };
    await serviceClient.from('subscription_plans').update(priceCachePatch).eq('id', planId);

    const { data: subscriptionRow } = await serviceClient
      .from('subscriptions')
      .select('stripe_customer_id, stripe_subscription_id, plan, status')
      .eq('user_id', user.id)
      .maybeSingle();

    const alreadyPaid =
      Boolean(subscriptionRow?.stripe_subscription_id) &&
      (subscriptionRow?.status === 'active' || subscriptionRow?.status === 'trialing') &&
      subscriptionRow?.plan !== 'free' &&
      subscriptionRow?.plan !== 'micro';

    if (alreadyPaid && subscriptionRow?.plan === planId) {
      return jsonResponse(
        { error: `Vous êtes déjà abonné à l’offre ${plan.display_name}.`, code: 'ALREADY_SUBSCRIBED' },
        400,
      );
    }

    let customerId = subscriptionRow?.stripe_customer_id ?? null;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        metadata: {
          user_id: user.id,
          source: 'INVEQ_app',
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

    let resolvedPromotionCodeId: string | null = null;

    if (promotionCodeInput) {
      const promotionCodes = await stripe.promotionCodes.list({
        code: promotionCodeInput,
        active: true,
        limit: 1,
      });

      const match = promotionCodes.data[0];

      if (!match) {
        return jsonResponse({ error: 'Code promotionnel invalide ou expiré.', code: 'PROMO_INVALID' }, 400);
      }

      resolvedPromotionCodeId = match.id;
    }

    // TVA : les Prices sont tax_behavior=exclusive (HT).
    // Stripe Tax ne collecte la TVA que si une registration est active
    // (Dashboard → Tax). Activer via secret STRIPE_AUTOMATIC_TAX=true.
    const automaticTaxEnabled = Deno.env.get('STRIPE_AUTOMATIC_TAX')?.trim() === 'true';

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [
        {
          price: stripePriceId,
          quantity: 1,
        },
      ],
      // Toujours permettre la saisie d’un code promo sur Stripe Checkout
      // sauf si un code est déjà appliqué via discounts.
      ...(resolvedPromotionCodeId
        ? { discounts: [{ promotion_code: resolvedPromotionCodeId }] }
        : { allow_promotion_codes: true }),
      ...(automaticTaxEnabled
        ? {
            automatic_tax: { enabled: true },
            customer_update: { address: 'auto', name: 'auto' },
            tax_id_collection: { enabled: true },
          }
        : {}),
      billing_address_collection: automaticTaxEnabled ? 'required' : 'auto',
      metadata: {
        user_id: user.id,
        plan_id: plan.id,
        billing_interval: interval,
        source: 'INVEQ_subscription_checkout',
        ...(promotionCodeInput ? { promotion_code: promotionCodeInput } : {}),
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
          plan_id: plan.id,
          billing_interval: interval,
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
        planId: plan.id,
        interval,
        priceId: stripePriceId,
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
