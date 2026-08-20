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
  type Purchase,
} from 'expo-iap';

import { APPLE_PREMIUM_PRODUCT_ID, APPLE_PREMIUM_PRODUCT_IDS } from '@/constants/iap';
import { isOfflineDemoData } from '@/lib/demo-data-mode';
import { supabase } from '@/lib/supabase';

export class ApplePurchaseCanceledError extends Error {
  constructor() {
    super('APPLE_PURCHASE_CANCELED');
    this.name = 'ApplePurchaseCanceledError';
  }
}

export type ApplePremiumConfirmResult = {
  planId: 'free' | 'premium';
  status: string;
  isPremium: boolean;
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

async function getAccessToken(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) {
    throw new Error('Session expirée. Reconnectez-vous.');
  }
  return token;
}

function readPurchaseIds(purchase: Purchase): {
  productId: string;
  transactionId: string;
  purchaseToken: string | null;
} {
  const productId =
    ('productId' in purchase && typeof purchase.productId === 'string' && purchase.productId) ||
    ('id' in purchase && typeof purchase.id === 'string' && purchase.id) ||
    APPLE_PREMIUM_PRODUCT_ID;

  const transactionId =
    ('transactionId' in purchase &&
      typeof purchase.transactionId === 'string' &&
      purchase.transactionId) ||
    ('id' in purchase && typeof purchase.id === 'string' && purchase.id) ||
    '';

  const purchaseToken =
    ('purchaseToken' in purchase && typeof purchase.purchaseToken === 'string'
      ? purchase.purchaseToken
      : null) ||
    ('purchaseTokenAndroid' in purchase && typeof purchase.purchaseTokenAndroid === 'string'
      ? purchase.purchaseTokenAndroid
      : null);

  if (!transactionId) {
    throw new Error('Transaction Apple introuvable.');
  }

  return { productId, transactionId, purchaseToken };
}

export async function confirmAppleSubscriptionPurchase(
  purchase: Purchase,
): Promise<ApplePremiumConfirmResult> {
  if (isOfflineDemoData()) {
    return { planId: 'premium', status: 'active', isPremium: true };
  }

  const endpoint = getConfirmUrl();
  if (!endpoint) {
    throw new Error('Confirmation Apple non configurée.');
  }

  const { productId, transactionId, purchaseToken } = readPurchaseIds(purchase);
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
      purchaseToken,
      platform: Platform.OS,
    }),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error ?? 'Impossible de confirmer l’abonnement Apple.');
  }

  return (await response.json()) as ApplePremiumConfirmResult;
}

async function finalizePurchase(purchase: Purchase): Promise<ApplePremiumConfirmResult> {
  const result = await confirmAppleSubscriptionPurchase(purchase);
  await finishTransaction({ purchase, isConsumable: false });
  return result;
}

function isPremiumProduct(purchase: Purchase): boolean {
  const productId =
    ('productId' in purchase && typeof purchase.productId === 'string' && purchase.productId) ||
    ('id' in purchase && typeof purchase.id === 'string' && purchase.id) ||
    '';

  if (!productId) {
    return false;
  }

  return APPLE_PREMIUM_PRODUCT_IDS.includes(productId as (typeof APPLE_PREMIUM_PRODUCT_IDS)[number]);
}

export async function startApplePremiumPurchase(): Promise<ApplePremiumConfirmResult> {
  if (Platform.OS !== 'ios') {
    throw new Error('In-App Purchase disponible uniquement sur iOS.');
  }

  if (isOfflineDemoData()) {
    return { planId: 'premium', status: 'active', isPremium: true };
  }

  await initConnection();

  const products = await fetchProducts({
    skus: [...APPLE_PREMIUM_PRODUCT_IDS],
    type: 'subs',
  });

  if (!products || products.length === 0) {
    throw new Error(
      'Offre Premium introuvable sur l’App Store. Vérifiez que l’abonnement In-App Purchase est créé et associé à l’app.',
    );
  }

  return await new Promise<ApplePremiumConfirmResult>((resolve, reject) => {
    let settled = false;

    const finish = (error?: unknown, result?: ApplePremiumConfirmResult) => {
      if (settled) {
        return;
      }
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
      if (!isPremiumProduct(purchase)) {
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
        apple: { sku: APPLE_PREMIUM_PRODUCT_ID },
      },
    }).catch((error) => finish(error));
  });
}

export async function restoreApplePremiumPurchases(): Promise<ApplePremiumConfirmResult | null> {
  if (Platform.OS !== 'ios') {
    return null;
  }

  if (isOfflineDemoData()) {
    return { planId: 'premium', status: 'active', isPremium: true };
  }

  await initConnection();
  await restoreStorePurchases();
  const purchases = await getAvailablePurchases();
  const premiumPurchase = (purchases ?? []).find((purchase) => isPremiumProduct(purchase));

  if (!premiumPurchase) {
    return null;
  }

  return finalizePurchase(premiumPurchase);
}

export function isApplePurchaseCanceledError(error: unknown): error is ApplePurchaseCanceledError {
  return error instanceof ApplePurchaseCanceledError;
}
