import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

import { planIdFromAppleProductId } from '../_shared/apple-products.ts';
import { applyPremiumSubscription } from '../_shared/subscription-sync.ts';
import {
  appleSubscriptionStorageId,
  toIsoFromAppleMs,
  verifyAppleSubscriptionTransaction,
} from '../_shared/apple-verify.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

type ConfirmBody = {
  productId?: string;
  transactionId?: string;
  purchaseToken?: string | null;
};

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Méthode non autorisée.' }, 405);
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const supabaseServiceRoleKey = Deno.env.get(
      'SUPABASE_SERVICE_ROLE_KEY',
    );

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

    if (
      body.productId?.trim() &&
      body.productId.trim() !== verified.productId
    ) {
      return jsonResponse(
        { error: 'productId incohérent avec la transaction Apple.' },
        400,
      );
    }

    const planId = planIdFromAppleProductId(verified.productId);

    if (planId !== 'premium') {
      return jsonResponse(
        { error: `Produit Apple non mappé : ${verified.productId}` },
        400,
      );
    }

    const serviceClient = createClient(
      supabaseUrl,
      supabaseServiceRoleKey,
    );
    const storageId = appleSubscriptionStorageId(
      verified.originalTransactionId,
    );
    const { data: existingOwner, error: ownerError } = await serviceClient
      .from('subscriptions')
      .select('user_id')
      .eq('stripe_subscription_id', storageId)
      .maybeSingle();

    if (ownerError) {
      throw ownerError;
    }

    if (existingOwner?.user_id && existingOwner.user_id !== user.id) {
      return jsonResponse(
        {
          error:
            'Cet abonnement Apple est déjà lié à un autre compte INVEQ.',
        },
        409,
      );
    }

    await applyPremiumSubscription(serviceClient, {
      userId: user.id,
      planId: 'premium',
      status: 'active',
      stripeSubscriptionId: storageId,
      currentPeriodStart: toIsoFromAppleMs(verified.purchaseDate),
      currentPeriodEnd: toIsoFromAppleMs(verified.expiresDate),
      cancelAtPeriodEnd: false,
    });

    return jsonResponse(
      {
        planId: 'premium',
        status: 'active',
        isPremium: true,
        transactionId: verified.transactionId,
        originalTransactionId: verified.originalTransactionId,
        productId: verified.productId,
        environment: verified.environment,
        currentPeriodEnd: toIsoFromAppleMs(verified.expiresDate),
      },
      200,
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Erreur inattendue.';
    const status = message.startsWith('Secret Apple manquant') ? 500 : 400;
    return jsonResponse({ error: message }, status);
  }
});

function jsonResponse(payload: unknown, status: number): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}
