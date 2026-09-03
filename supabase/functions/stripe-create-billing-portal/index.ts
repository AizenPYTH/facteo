import Stripe from 'https://esm.sh/stripe@17.7.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type Body = {
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

    const body = (await request.json().catch(() => ({}))) as Body;
    const returnUrl =
      body.returnUrl?.trim() ||
      Deno.env.get('INVEQ_SUBSCRIPTION_RETURN_URL')?.trim() ||
      'https://www.inveq.fr/app/settings/subscription';

    const serviceClient = createClient(supabaseUrl, supabaseServiceRoleKey);
    const { data: subscriptionRow } = await serviceClient
      .from('subscriptions')
      .select('stripe_customer_id, stripe_subscription_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (String(subscriptionRow?.stripe_subscription_id ?? '').startsWith('apple:')) {
      return jsonResponse(
        { error: 'Cet abonnement est géré via l’App Store. Ouvrez Réglages → Abonnements sur iPhone.' },
        400,
      );
    }

    const customerId = subscriptionRow?.stripe_customer_id;
    if (!customerId) {
      return jsonResponse({ error: 'Aucun client Stripe associé à ce compte.' }, 404);
    }

    const stripe = new Stripe(stripeSecret, { apiVersion: '2024-12-18.acacia' });
    const portal = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    if (!portal.url) {
      return jsonResponse({ error: 'Impossible d’ouvrir le portail Stripe.' }, 500);
    }

    return jsonResponse({ portalUrl: portal.url }, 200);
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
