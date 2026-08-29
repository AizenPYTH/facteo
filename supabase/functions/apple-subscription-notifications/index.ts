import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

import { planIdFromAppleProductId } from '../_shared/apple-products.ts';
import {
  applyPremiumSubscription,
  applyStandardSubscription,
} from '../_shared/subscription-sync.ts';
import {
  appleSubscriptionStorageId,
  decodeAppleTransactionJws,
  toIsoFromAppleMs,
  verifyAndDecodeAppleNotification,
} from '../_shared/apple-verify.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

const PREMIUM_KEEP_TYPES = new Set([
  'DID_RENEW',
  'SUBSCRIBED',
  'OFFER_REDEEMED',
  'DID_CHANGE_RENEWAL_STATUS',
  'DID_CHANGE_RENEWAL_PREF',
  'DID_FAIL_TO_RENEW',
]);

const PREMIUM_REVOKE_TYPES = new Set([
  'EXPIRED',
  'GRACE_PERIOD_EXPIRED',
  'REVOKE',
  'REFUND',
]);

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Méthode non autorisée.' }, 405);
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get(
      'SUPABASE_SERVICE_ROLE_KEY',
    );

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return jsonResponse({ error: 'Configuration serveur incomplète.' }, 500);
    }

    const body = (await request.json()) as { signedPayload?: string };

    if (!body.signedPayload?.trim()) {
      return jsonResponse({ error: 'signedPayload manquant.' }, 400);
    }

    const notification = await verifyAndDecodeAppleNotification(
      body.signedPayload.trim(),
    );
    const signedTransaction = notification.data?.signedTransactionInfo;

    if (!signedTransaction) {
      return jsonResponse(
        {
          received: true,
          ignored: true,
          type: notification.notificationType,
        },
        200,
      );
    }

    const transaction = await decodeAppleTransactionJws(signedTransaction);
    const planId = planIdFromAppleProductId(transaction.productId);

    if (planId !== 'premium') {
      return jsonResponse(
        { error: `Produit Apple non mappé : ${transaction.productId}` },
        400,
      );
    }

    const serviceClient = createClient(
      supabaseUrl,
      supabaseServiceRoleKey,
    );
    const storageId = appleSubscriptionStorageId(
      transaction.originalTransactionId,
    );
    const { data: owner, error: ownerError } = await serviceClient
      .from('subscriptions')
      .select('user_id')
      .eq('stripe_subscription_id', storageId)
      .maybeSingle();

    if (ownerError) {
      throw ownerError;
    }

    if (!owner?.user_id) {
      return jsonResponse(
        {
          received: true,
          pendingLink: true,
          originalTransactionId: transaction.originalTransactionId,
          type: notification.notificationType,
        },
        200,
      );
    }

    const type = notification.notificationType;
    const isExpired =
      PREMIUM_REVOKE_TYPES.has(type) ||
      Boolean(transaction.revocationDate) ||
      (transaction.expiresDate !== null &&
        transaction.expiresDate < Date.now() &&
        type === 'EXPIRED');

    if (isExpired) {
      await applyStandardSubscription(serviceClient, {
        userId: owner.user_id,
        status: 'canceled',
        stripeSubscriptionId: storageId,
        currentPeriodStart: toIsoFromAppleMs(transaction.purchaseDate),
        currentPeriodEnd: toIsoFromAppleMs(transaction.expiresDate),
        cancelAtPeriodEnd: false,
      });
    } else if (PREMIUM_KEEP_TYPES.has(type)) {
      const stillActive =
        !transaction.revocationDate &&
        (transaction.expiresDate === null ||
          transaction.expiresDate >= Date.now());

      if (stillActive || type === 'DID_CHANGE_RENEWAL_PREF') {
        await applyPremiumSubscription(serviceClient, {
          userId: owner.user_id,
          planId: 'premium',
          status: type === 'DID_FAIL_TO_RENEW' ? 'past_due' : 'active',
          stripeSubscriptionId: storageId,
          currentPeriodStart: toIsoFromAppleMs(transaction.purchaseDate),
          currentPeriodEnd: toIsoFromAppleMs(transaction.expiresDate),
          cancelAtPeriodEnd:
            notification.subtype === 'AUTO_RENEW_DISABLED',
        });
      }
    }

    return jsonResponse(
      {
        received: true,
        type,
        subtype: notification.subtype ?? null,
        productId: transaction.productId,
        planId,
        originalTransactionId: transaction.originalTransactionId,
        userId: owner.user_id,
      },
      200,
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Erreur inattendue.';
    return jsonResponse({ error: message }, 400);
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
