import {
  ErrorCode,
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
import { Platform } from 'react-native';

import {
  APPLE_PRODUCT_IDS,
  isApplePaidProductId,
} from '@/constants/iap';
import { supabase } from '@/lib/supabase';

export class AppleIapNotConfiguredError extends Error {
  constructor(message = 'Achats Apple non configurés pour cette version de l’application.') {
    super(message);
    this.name = 'AppleIapNotConfiguredError';
  }
}

export type ApplePurchaseResult = {
  productId: string;
};

export type AppleStoreProductInfo = {
  productId: string;
  displayPrice: string;
  currency: string;
  title: string;
  description: string;
};

type AppleConfirmResponse = {
  planId: 'premium';
  status: string;
  isPremium: boolean;
  productId: string;
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

async function connectToStore(): Promise<void> {
  try {
    await initConnection();
  } catch (error) {
    const message = readErrorMessage(error);

    if (message.includes('Cannot find native module') || message.includes('unavailable')) {
      throw new AppleIapNotConfiguredError(
        'Achats Apple indisponibles dans cette build. Installez une nouvelle build iOS incluant StoreKit.',
      );
    }

    throw error;
  }
}

async function getAccessToken(): Promise<string> {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw error;
  }

  const token = data.session?.access_token;

  if (!token) {
    throw new Error('Session expirée. Reconnectez-vous.');
  }

  return token;
}

function assertAppleProductId(productId: string | null): asserts productId is string {
  if (!productId) {
    throw new AppleIapNotConfiguredError('Offre Premium absente du catalogue App Store.');
  }

  if (!isApplePaidProductId(productId)) {
    throw new Error(`Produit Apple non reconnu : ${productId}`);
  }
}

function asPurchaseIos(purchase: Purchase): PurchaseIOS {
  if (purchase.store !== 'apple') {
    throw new Error('Transaction reçue depuis une boutique inattendue.');
  }

  return purchase as PurchaseIOS;
}

async function confirmPurchase(purchase: Purchase): Promise<AppleConfirmResponse> {
  const endpoint = getConfirmUrl();

  if (!endpoint) {
    throw new AppleIapNotConfiguredError(
      'Confirmation Apple non configurée. EXPO_PUBLIC_SUPABASE_URL est manquant.',
    );
  }

  const iosPurchase = asPurchaseIos(purchase);
  const transactionId = iosPurchase.transactionId || iosPurchase.id;
  const purchaseToken = iosPurchase.purchaseToken?.trim();

  if (!transactionId) {
    throw new Error('Identifiant de transaction Apple introuvable.');
  }

  if (!purchaseToken) {
    throw new Error('JWS Apple introuvable — validation serveur impossible.');
  }

  assertAppleProductId(iosPurchase.productId);

  const accessToken = await getAccessToken();
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      productId: iosPurchase.productId,
      transactionId,
      purchaseToken,
      platform: Platform.OS,
    }),
  });

  const payload = (await response.json().catch(() => null)) as
    | (Partial<AppleConfirmResponse> & { error?: string })
    | null;

  if (!response.ok) {
    throw new Error(payload?.error ?? 'Impossible de confirmer l’abonnement Apple.');
  }

  if (
    payload?.planId !== 'premium' ||
    payload.isPremium !== true ||
    payload.productId !== iosPurchase.productId
  ) {
    throw new Error('Réponse de confirmation Apple invalide.');
  }

  return {
    planId: payload.planId,
    status: payload.status ?? 'active',
    isPremium: payload.isPremium,
    productId: payload.productId,
  };
}

async function finalizePurchase(purchase: Purchase): Promise<ApplePurchaseResult> {
  const confirmed = await confirmPurchase(purchase);
  await finishTransaction({ purchase, isConsumable: false });
  return { productId: confirmed.productId };
}

function isPurchaseCanceled(error: { code?: unknown; message?: unknown }): boolean {
  const code = String(error.code ?? '').toLowerCase();
  const message = String(error.message ?? '').toLowerCase();

  return (
    code === ErrorCode.UserCancelled ||
    code.includes('cancel') ||
    message.includes('cancel') ||
    message.includes('annul')
  );
}

export async function fetchAppleStoreProducts(): Promise<AppleStoreProductInfo[]> {
  if (Platform.OS !== 'ios') {
    return [];
  }

  await connectToStore();
  const products = await fetchProducts({
    skus: APPLE_PRODUCT_IDS,
    type: 'subs',
  });

  return (products ?? [])
    .filter(
      (product): product is ProductSubscription =>
        product.type === 'subs' && isApplePaidProductId(product.id),
    )
    .map((product) => ({
      productId: product.id,
      displayPrice: product.displayPrice,
      currency: product.currency,
      title: product.title,
      description: product.description,
    }));
}

export async function purchasePremium(
  appStoreProductId: string | null,
): Promise<ApplePurchaseResult> {
  if (Platform.OS !== 'ios') {
    throw new AppleIapNotConfiguredError('Achats Apple disponibles uniquement sur iOS.');
  }

  assertAppleProductId(appStoreProductId);

  if (!getConfirmUrl()) {
    throw new AppleIapNotConfiguredError(
      'Confirmation Apple non configurée. EXPO_PUBLIC_SUPABASE_URL est manquant.',
    );
  }

  await connectToStore();
  const products = await fetchProducts({
    skus: [appStoreProductId],
    type: 'subs',
  });

  if (!products?.some((product) => product.id === appStoreProductId)) {
    throw new Error(
      `Offre Premium introuvable sur l’App Store (${appStoreProductId}).`,
    );
  }

  return await new Promise<ApplePurchaseResult>((resolve, reject) => {
    let settled = false;
    let updatedSubscription: { remove: () => void } | null = null;
    let errorSubscription: { remove: () => void } | null = null;

    const cleanup = () => {
      updatedSubscription?.remove();
      errorSubscription?.remove();
    };

    const rejectOnce = (error: unknown) => {
      if (settled) {
        return;
      }

      settled = true;
      cleanup();
      reject(error instanceof Error ? error : new Error(readErrorMessage(error)));
    };

    updatedSubscription = purchaseUpdatedListener((purchase) => {
      if (purchase.productId !== appStoreProductId || settled) {
        return;
      }

      settled = true;
      cleanup();

      if (purchase.purchaseState !== 'purchased') {
        reject(new Error('Achat Apple en attente de validation.'));
        return;
      }

      void finalizePurchase(purchase).then(resolve).catch(reject);
    });

    errorSubscription = purchaseErrorListener((error) => {
      if (isPurchaseCanceled(error)) {
        rejectOnce(new Error('Achat Apple annulé.'));
        return;
      }

      rejectOnce(error);
    });

    void requestPurchase({
      type: 'subs',
      request: {
        apple: { sku: appStoreProductId },
      },
    }).catch(rejectOnce);
  });
}

export async function restorePurchases(): Promise<ApplePurchaseResult[]> {
  if (Platform.OS !== 'ios') {
    return [];
  }

  if (!getConfirmUrl()) {
    throw new AppleIapNotConfiguredError(
      'Confirmation Apple non configurée. EXPO_PUBLIC_SUPABASE_URL est manquant.',
    );
  }

  await connectToStore();
  await restoreStorePurchases();

  const purchases = await getAvailablePurchases({
    alsoPublishToEventListenerIOS: false,
    onlyIncludeActiveItemsIOS: true,
  });
  const paidPurchases = purchases
    .filter(
      (purchase) =>
        purchase.store === 'apple' && isApplePaidProductId(purchase.productId),
    )
    .sort((left, right) => {
      const leftIos = left as PurchaseIOS;
      const rightIos = right as PurchaseIOS;
      return (
        (rightIos.expirationDateIOS ?? rightIos.transactionDate) -
        (leftIos.expirationDateIOS ?? leftIos.transactionDate)
      );
    });

  const mostRecentPurchase = paidPurchases[0];

  if (!mostRecentPurchase) {
    return [];
  }

  return [await finalizePurchase(mostRecentPurchase)];
}

export function isAppleIapConfigured(): boolean {
  return Platform.OS === 'ios' && Boolean(getConfirmUrl());
}

export function isAppleIapNotConfiguredError(
  error: unknown,
): error is AppleIapNotConfiguredError {
  return error instanceof AppleIapNotConfiguredError;
}

function readErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Achat Apple impossible.';
}
