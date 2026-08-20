import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

import { applyPremiumSubscription } from '../_shared/subscription-sync.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ALLOWED_PRODUCT_IDS = new Set([
  Deno.env.get('APPLE_PREMIUM_PRODUCT_ID')?.trim() || 'com.inveq.app.premium.monthly',
]);

type ConfirmBody = {
  productId?: string;
  transactionId?: string;
  purchaseToken?: string | null;
  platform?: string;
};

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
      return jsonResponse({ error: 'Configuration serveur incomplète.' }, 500);
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

    const body = (await request.json()) as ConfirmBody;
    const productId = body.productId?.trim() ?? '';
    const transactionId = body.transactionId?.trim() ?? '';

    if (!productId || !transactionId) {
      return jsonResponse({ error: 'Transaction Apple incomplète.' }, 400);
    }

    if (!ALLOWED_PRODUCT_IDS.has(productId)) {
      return jsonResponse({ error: 'Produit In-App Purchase non reconnu.' }, 400);
    }

    const serviceClient = createClient(supabaseUrl, supabaseServiceRoleKey);
    const appleSubscriptionId = `apple:${transactionId}`;

    await applyPremiumSubscription(serviceClient, {
      userId: user.id,
      planId: 'premium',
      status: 'active',
      stripeSubscriptionId: appleSubscriptionId,
      currentPeriodStart: new Date().toISOString(),
      cancelAtPeriodEnd: false,
    });

    // Persist product id for support / audits when column exists.
    await serviceClient
      .from('subscriptions')
      .update({
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);

    return jsonResponse(
      {
        planId: 'premium',
        status: 'active',
        isPremium: true,
        transactionId,
        productId,
      },
      200,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inattendue.';
    return jsonResponse({ error: message }, 400);
  }
});

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}
