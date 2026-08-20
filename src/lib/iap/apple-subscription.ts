/**
 * Mapping Product ID Apple ↔ plan métier.
 * Source de vérité client — alignée sur supabase/functions/_shared/apple-products.ts
 */
import { Platform } from 'react-native';
import {
  fetchProducts,
  finishTransaction,
  getAvailablePurchases,
  initConnection,
  purchaseErrorListener,
  purchaseUpdatedListener,
  requestPurchase,
  restorePurchases as restoreStorePurchases,
  type ProductSubscription,
  type Purchase,
  type PurchaseIOS,
} from 'expo-iap';

import {
  APPLE_PAID_PLAN_IDS,
  APPLE_PLAN_PRODUCT_IDS,
  APPLE_PRODUCT_IDS,
  isApplePaidProductId,
  planIdFromAppleProductId,
  type ApplePaidPlanId,
} from '@/constants/iap';
import { isOfflineDemoData } from '@/lib/demo-data-mode';
import { supabase } from '@/lib/supabase';
import type { EffectivePlanId } from '@/types/subscription';

export class ApplePurchaseCanceledError extends Error {
  constructor() {
    super('APPLE_PURCHASE_CANCELED');
    this.name = 'ApplePurchaseCanceledError';
  }
}

export type ApplePlanConfirmResult = {
  planId: EffectivePlanId;
  status: string;
  isPremium: boolean;
};

export type AppleStoreProductInfo = {
  planId: ApplePaidPlanId;
  productId: string;
  displayPrice: string;
  currency: string;
  title: string;
  description: string;
};

function getConfirmUrl(): string | null {
  const explicit = process.env.EXPO_PUBLIC_APPLE_SUBSCRIPTION_CONFIRM_URL?.trim();
  if (explicit) {
    return explicit;
  }

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
  return supabaseUrl
    ? `${supabaseUrl.replace(/\/$/, '')}/functions/v1/apple-confirm-subscription`
    : null;
}

export function isAppleSubscriptionConfirmConfigured(): boolean {
  return Boolean(getConfirmUrl());
}

async function getAccessToken(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) {
    throw new Error('Session expirée. Reconnectez-vous.');
  }
  return token;
}

function asPurchaseIos(purchase: Purchase): PurchaseIOS | null {
  if (purchase && typeof purchase === 'object' && 'transactionId' in purchase) {
    return purchase as PurchaseIOS;
  }
  return null;
}

function readPurchaseIds(purchase: Purchase): {
  productId: string;
  transactionId: string;
  originalTransactionId: string;
  purchaseToken: string | null;
  planId: ApplePaidPlanId;
} {
  const ios = asPurchaseIos(purchase);
  const productId = ios?.productId || '';
  const transactionId = ios?.transactionId || '';
  const originalTransactionId =
    ios?.originalTransactionIdentifierIOS || ios?.transactionId || transactionId;
  const purchaseToken = ios?.purchaseToken ?? null;
  const planId = planIdFromAppleProductId(productId);

  if (!transactionId) {
    throw new Error('Transaction Apple introuvable.');
  }
  if (!purchaseToken) {
    throw new Error('JWS Apple (purchaseToken) introuvable — validation serveur impossible.');
  }
  if (!planId) {
    throw new Error(`Produit Apple non reconnu: ${productId}`);
  }

  return { productId, transactionId, originalTransactionId, purchaseToken, planId };
}

export async function fetchAppleStoreProducts(): Promise<AppleStoreProductInfo[]> {
  if (Platform.OS !== 'ios') {
    return [];
  }

  await initConnection();
  const products = await fetchProducts({
    skus: [...APPLE_PRODUCT_IDS],
    type: 'subs',
  });

  const byId = new Map((products ?? []).map((entry) => [entry.id, entry as ProductSubscription]));

  return APPLE_PAID_PLAN_IDS.flatMap((planId) => {
    const productId = APPLE_PLAN_PRODUCT_IDS[planId];
    const product = byId.get(productId);
    if (!product) {
      return [];
    }
    return [
      {
        planId,
        productId: product.id,
        displayPrice: product.displayPrice,
        currency: product.currency,
        title: product.title ?? planId,
        description: product.description ?? '',
      },
    ];
  });
}

export async function confirmAppleSubscriptionPurchase(
  purchase: Purchase,
): Promise<ApplePlanConfirmResult> {
  if (isOfflineDemoData()) {
    const ios = asPurchaseIos(purchase);
    const planId = planIdFromAppleProductId(ios?.productId ?? '') ?? 'pro';
    return { planId, status: 'active', isPremium: true };
  }

  const endpoint = getConfirmUrl();
  if (!endpoint) {
    throw new Error('Confirmation Apple non configurée.');
  }

  const { productId, transactionId, originalTransactionId, purchaseToken, planId } =
    readPurchaseIds(purchase);
  const accessToken = await getAccessToken();

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      productId,
      transactionId,
      originalTransactionId,
      purchaseToken,
      platform: Platform.OS,
    }),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error ?? 'Impossible de confirmer l’abonnement Apple.');
  }

  const json = (await response.json()) as ApplePlanConfirmResult & { planId?: string };
  return {
    planId: (json.planId as EffectivePlanId) ?? planId,
    status: json.status ?? 'active',
    isPremium: Boolean(json.isPremium ?? true),
  };
}

async function finalizePurchase(purchase: Purchase): Promise<ApplePlanConfirmResult> {
  const result = await confirmAppleSubscriptionPurchase(purchase);
  await finishTransaction({ purchase, isConsumable: false });
  return result;
}

function isKnownPaidPurchase(purchase: Purchase): boolean {
  const ios = asPurchaseIos(purchase);
  return Boolean(ios?.productId && isApplePaidProductId(ios.productId));
}

export async function startApplePlanPurchase(
  planId: ApplePaidPlanId,
): Promise<ApplePlanConfirmResult> {
  if (Platform.OS !== 'ios') {
    throw new Error('In-App Purchase disponible uniquement sur iOS.');
  }

  const sku = APPLE_PLAN_PRODUCT_IDS[planId];

  if (isOfflineDemoData()) {
    return { planId, status: 'active', isPremium: true };
  }

  await initConnection();

  const products = await fetchProducts({
    skus: [sku],
    type: 'subs',
  });

  if (!products || products.length === 0) {
    throw new Error(
      `Offre ${planId} introuvable sur l’App Store. Vérifiez le produit ${sku} dans App Store Connect.`,
    );
  }

  return await new Promise<ApplePlanConfirmResult>((resolve, reject) => {
    let settled = false;

    const finish = (error?: unknown, result?: ApplePlanConfirmResult) => {
      if (settled) return;
      settled = true;
      updated.remove();
      errored.remove();
      if (error) {
        reject(error);
        return;
      }
      resolve(result!);
    };

    const updated = purchaseUpdatedListener((purchase) => {
      if (!isKnownPaidPurchase(purchase)) {
        return;
      }
      void finalizePurchase(purchase)
        .then((result) => finish(undefined, result))
        .catch((error) => finish(error));
    });

    const errored = purchaseErrorListener((error) => {
      const code = String(error?.code ?? '');
      const message = String(error?.message ?? '');
      if (
        code.toLowerCase().includes('cancel') ||
        message.toLowerCase().includes('cancel') ||
        message.toLowerCase().includes('annul')
      ) {
        finish(new ApplePurchaseCanceledError());
        return;
      }
      finish(error instanceof Error ? error : new Error(message || 'Achat Apple impossible.'));
    });

    void requestPurchase({
      type: 'subs',
      request: {
        apple: { sku },
      },
    }).catch((error) => finish(error));
  });
}

/** @deprecated Utiliser startApplePlanPurchase */
export async function startApplePremiumPurchase(): Promise<ApplePlanConfirmResult> {
  return startApplePlanPurchase('pro');
}

export async function restoreApplePlanPurchases(): Promise<ApplePlanConfirmResult | null> {
  if (Platform.OS !== 'ios') {
    return null;
  }

  if (isOfflineDemoData()) {
    return { planId: 'pro', status: 'active', isPremium: true };
  }

  await initConnection();
  await restoreStorePurchases();
  const purchases = await getAvailablePurchases({
    alsoPublishToEventListenerIOS: false,
    onlyIncludeActiveItemsIOS: true,
  });

  const paid = (purchases ?? []).filter((purchase) => isKnownPaidPurchase(purchase));
  if (paid.length === 0) {
    return null;
  }

  // Prendre le plan le plus élevé parmi les achats actifs
  const rank: Record<ApplePaidPlanId, number> = {
    basique: 1,
    standard: 2,
    pro: 3,
    max: 4,
  };

  let best: Purchase = paid[0]!;
  let bestRank = 0;
  for (const purchase of paid) {
    const ios = asPurchaseIos(purchase);
    const planId = planIdFromAppleProductId(ios?.productId ?? '');
    const current = planId ? rank[planId] : 0;
    if (current >= bestRank) {
      best = purchase;
      bestRank = current;
    }
  }

  return finalizePurchase(best);
}

/** @deprecated */
export async function restoreApplePremiumPurchases(): Promise<ApplePlanConfirmResult | null> {
  return restoreApplePlanPurchases();
}

export function isApplePurchaseCanceledError(error: unknown): error is ApplePurchaseCanceledError {
  return error instanceof ApplePurchaseCanceledError;
}
