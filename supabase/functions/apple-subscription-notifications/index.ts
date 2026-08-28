/**
 * App Store Server Notifications V2 — renew / upgrade / downgrade / expire / refund.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

import { planIdFromAppleProductId } from '../_shared/apple-products.ts';
import {
  applyPlanSubscription,
  applyStandardSubscription,
  findUserIdForAppleSubscription,
} from '../_shared/subscription-sync.ts';
import {
  appleSubscriptionStorageId,
  toIsoFromAppleMs,
  verifyAndDecodeAppleJws,
  verifyAndDecodeAppleNotification,
} from '../_shared/apple-verify.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return jsonResponse({ error: 'Configuration serveur incomplète.' }, 500);
    }

    const body = (await request.json()) as { signedPayload?: string };
    if (!body.signedPayload) {
      return jsonResponse({ error: 'signedPayload manquant.' }, 400);
    }

    const notification = await verifyAndDecodeAppleNotification(body.signedPayload);
    const signedTx = notification.data?.signedTransactionInfo;

    if (!signedTx) {
      return jsonResponse({ received: true, ignored: true, type: notification.notificationType }, 200);
    }

    const txPayload = await verifyAndDecodeAppleJws(signedTx);
    const originalTransactionId = String(
      txPayload.originalTransactionId ?? txPayload.transactionId ?? '',
    );
    const productId = String(txPayload.productId ?? '');
    const expiresDate =
      typeof txPayload.expiresDate === 'number' ? txPayload.expiresDate : null;
    const purchaseDate =
      typeof txPayload.purchaseDate === 'number' ? txPayload.purchaseDate : null;
    const revocationDate =
      typeof txPayload.revocationDate === 'number' ? txPayload.revocationDate : null;

    if (!originalTransactionId) {
      return jsonResponse({ error: 'originalTransactionId manquant.' }, 400);
    }

    const planId = planIdFromAppleProductId(productId);
    const serviceClient = createClient(supabaseUrl, supabaseServiceRoleKey);
    const userId = await findUserIdForAppleSubscription(serviceClient, originalTransactionId);

    if (!userId) {
      return jsonResponse(
        {
          received: true,
          pendingLink: true,
          originalTransactionId,
          type: notification.notificationType,
        },
        200,
      );
    }

    const type = notification.notificationType;
    const storageId = appleSubscriptionStorageId(originalTransactionId);
    const isExpired =
      PREMIUM_REVOKE_TYPES.has(type) ||
      Boolean(revocationDate) ||
      (expiresDate !== null && expiresDate < Date.now() && type === 'EXPIRED');

    if (isExpired || !planId) {
      await applyStandardSubscription(serviceClient, {
        userId,
        status: 'canceled',
        stripeSubscriptionId: storageId,
        currentPeriodStart: toIsoFromAppleMs(purchaseDate),
        currentPeriodEnd: toIsoFromAppleMs(expiresDate),
        cancelAtPeriodEnd: false,
      });
    } else if (PREMIUM_KEEP_TYPES.has(type)) {
      const stillActive =
        !revocationDate && (expiresDate === null || expiresDate >= Date.now());

      if (stillActive || type === 'DID_CHANGE_RENEWAL_PREF') {
        await applyPlanSubscription(serviceClient, {
          userId,
          planId,
          status: type === 'DID_FAIL_TO_RENEW' ? 'past_due' : 'active',
          stripeSubscriptionId: storageId,
          currentPeriodStart: toIsoFromAppleMs(purchaseDate),
          currentPeriodEnd: toIsoFromAppleMs(expiresDate),
          cancelAtPeriodEnd: notification.subtype === 'AUTO_RENEW_DISABLED',
        });
      }
    }

    return jsonResponse(
      {
        received: true,
        type,
        subtype: notification.subtype ?? null,
        productId,
        planId,
        originalTransactionId,
        userId,
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
