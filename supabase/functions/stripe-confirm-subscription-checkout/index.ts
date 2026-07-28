import Stripe from 'https://esm.sh/stripe@17.7.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

import {
  isPaidPlanId,
  normalizePlanId,
  syncSubscriptionCheckoutSession,
} from '../_shared/subscription-sync.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type ConfirmSubscriptionCheckoutBody = {
  sessionId: string;
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

    const body = (await request.json()) as ConfirmSubscriptionCheckoutBody;

    if (!body.sessionId?.trim()) {
      return jsonResponse({ error: 'Session Stripe manquante.' }, 400);
    }

    const stripe = new Stripe(stripeSecret, { apiVersion: '2024-12-18.acacia' });
    const serviceClient = createClient(supabaseUrl, supabaseServiceRoleKey);
    const session = await stripe.checkout.sessions.retrieve(body.sessionId.trim());

    const sessionUserId = session.metadata?.user_id ?? session.client_reference_id ?? null;

    if (sessionUserId !== user.id) {
      return jsonResponse({ error: 'Cette session de paiement ne vous appartient pas.' }, 403);
    }

    const result = await syncSubscriptionCheckoutSession(stripe, serviceClient, session);
    const planId = normalizePlanId(result.planId);

    return jsonResponse(
      {
        planId,
        status: 'active',
        isPremium: isPaidPlanId(planId),
        isPaid: isPaidPlanId(planId),
      },
      200,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inattendue.';
    return jsonResponse({ error: message }, 400);
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
