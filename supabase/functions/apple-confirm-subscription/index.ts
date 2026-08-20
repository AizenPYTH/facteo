import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

import { planIdFromAppleProductId } from '../_shared/apple-products.ts';
import { applyPlanSubscription } from '../_shared/subscription-sync.ts';
import {
  appleSubscriptionStorageId,
  toIsoFromAppleMs,
  verifyAppleSubscriptionTransaction,
} from '../_shared/apple-verify.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
    const transactionId = body.transactionId?.trim() ?? '';
    const purchaseToken = body.purchaseToken?.trim() || null;

    if (!transactionId) {
      return jsonResponse({ error: 'Transaction Apple incomplète.' }, 400);
    }

    const verified = await verifyAppleSubscriptionTransaction({
      transactionId,
      purchaseToken,
    });

    if (body.productId?.trim() && body.productId.trim() !== verified.productId) {
      return jsonResponse({ error: 'productId incohérent avec Apple.' }, 400);
    }

    const planId = planIdFromAppleProductId(verified.productId);
    if (!planId) {
      return jsonResponse({ error: `Produit Apple non mappé: ${verified.productId}` }, 400);
    }

    const serviceClient = createClient(supabaseUrl, supabaseServiceRoleKey);
    const storageId = appleSubscriptionStorageId(verified.originalTransactionId);

    const { data: existingOwner } = await serviceClient
      .from('subscriptions')
      .select('user_id')
      .eq('stripe_subscription_id', storageId)
      .maybeSingle();

    if (existingOwner?.user_id && existingOwner.user_id !== user.id) {
      return jsonResponse(
        { error: 'Cet abonnement Apple est déjà lié à un autre compte INVEQ.' },
        409,
      );
    }

    await applyPlanSubscription(serviceClient, {
      userId: user.id,
      planId,
      status: 'active',
      stripeSubscriptionId: storageId,
      currentPeriodStart: toIsoFromAppleMs(verified.purchaseDate),
      currentPeriodEnd: toIsoFromAppleMs(verified.expiresDate),
      cancelAtPeriodEnd: false,
    });

    return jsonResponse(
      {
        planId,
        status: 'active',
        isPremium: planId !== 'micro',
        transactionId: verified.transactionId,
        originalTransactionId: verified.originalTransactionId,
        productId: verified.productId,
        environment: verified.environment,
        currentPeriodEnd: toIsoFromAppleMs(verified.expiresDate),
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
