import Stripe from 'https://esm.sh/stripe@17.7.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type Body = {
  returnUrl?: string;
};

/**
 * Ouvre le Stripe Customer Portal (changement d’offre, résiliation, moyens de paiement).
 */
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
      return jsonResponse({ error: 'Configuration Stripe incomplète.' }, 500);
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
      Deno.env.get('INVEQ_PORTAL_RETURN_URL')?.trim() ||
      'https://inveq.app/app/settings/subscription';

    const serviceClient = createClient(supabaseUrl, supabaseServiceRoleKey);
    const { data: subscriptionRow } = await serviceClient
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .maybeSingle();

    const customerId = subscriptionRow?.stripe_customer_id;
    if (!customerId) {
      return jsonResponse(
        {
          error:
            'Aucun client Stripe associé. Souscrivez d’abord à une offre, puis gérez-la depuis le portail.',
          code: 'NO_STRIPE_CUSTOMER',
        },
        400,
      );
    }

    const stripe = new Stripe(stripeSecret, { apiVersion: '2024-12-18.acacia' });

    // Utilise la config provisionnée (metadata.source=INVEQ_provision) si disponible.
    const configs = await stripe.billingPortal.configurations.list({ active: true, limit: 10 });
    const inveqConfig = configs.data.find((c) => c.metadata?.source === 'INVEQ_provision');

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
      ...(inveqConfig ? { configuration: inveqConfig.id } : {}),
    });

    if (!session.url) {
      return jsonResponse({ error: 'Impossible d’ouvrir le portail client Stripe.' }, 500);
    }

    return jsonResponse({ portalUrl: session.url }, 200);
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
