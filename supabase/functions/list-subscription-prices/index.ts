import Stripe from 'https://esm.sh/stripe@17.7.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

import {
  PAID_PLAN_IDS,
  resolveLookupKey,
  type BillingInterval,
  type PaidSubscriptionPlanId,
} from '../_shared/subscription-sync.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Liste les prix d’abonnement depuis Stripe (lookup_keys).
 * Aucun montant n’est renvoyé depuis le code — uniquement Stripe.
 */
Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!stripeSecret) {
      return jsonResponse({ error: 'Configuration Stripe incomplète.' }, 500);
    }

    const stripe = new Stripe(stripeSecret, { apiVersion: '2024-12-18.acacia' });

    const lookupKeys = PAID_PLAN_IDS.flatMap((planId) => [
      resolveLookupKey(planId, 'monthly'),
      resolveLookupKey(planId, 'yearly'),
    ]);

    const prices = await stripe.prices.list({
      lookup_keys: lookupKeys,
      active: true,
      expand: ['data.product'],
      limit: 100,
    });

    const byLookup = new Map(prices.data.map((price) => [price.lookup_key ?? '', price]));

    const plans = PAID_PLAN_IDS.map((planId: PaidSubscriptionPlanId) => {
      const monthlyKey = resolveLookupKey(planId, 'monthly');
      const yearlyKey = resolveLookupKey(planId, 'yearly');
      const monthly = byLookup.get(monthlyKey) ?? null;
      const yearly = byLookup.get(yearlyKey) ?? null;

      return {
        planId,
        monthly: serializePrice(monthly, 'monthly'),
        yearly: serializePrice(yearly, 'yearly'),
      };
    });

    // Cache optionnel des price ids en DB
    if (supabaseUrl && supabaseServiceRoleKey) {
      const serviceClient = createClient(supabaseUrl, supabaseServiceRoleKey);
      for (const entry of plans) {
        const patch: Record<string, string> = { updated_at: new Date().toISOString() };
        if (entry.monthly?.priceId) patch.stripe_price_id = entry.monthly.priceId;
        if (entry.yearly?.priceId) patch.stripe_price_id_yearly = entry.yearly.priceId;
        if (Object.keys(patch).length > 1) {
          await serviceClient.from('subscription_plans').update(patch).eq('id', entry.planId);
        }
      }
    }

    return jsonResponse({ currency: 'eur', plans }, 200);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inattendue.';
    return jsonResponse({ error: message }, 500);
  }
});

function serializePrice(
  price: Stripe.Price | null,
  interval: BillingInterval,
): {
  priceId: string;
  lookupKey: string | null;
  unitAmount: number;
  currency: string;
  interval: BillingInterval;
  /** Pour l’annuel : équivalent mensuel (unit_amount / 12) en centimes. */
  monthlyEquivalentAmount: number | null;
} | null {
  if (!price || typeof price.unit_amount !== 'number') {
    return null;
  }

  return {
    priceId: price.id,
    lookupKey: price.lookup_key,
    unitAmount: price.unit_amount,
    currency: price.currency,
    interval,
    monthlyEquivalentAmount: interval === 'yearly' ? Math.round(price.unit_amount / 12) : null,
  };
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
