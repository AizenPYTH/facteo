/**
 * Product IDs In-App Purchase — Subscription Group « INVEQ Plans ».
 * Levels ASC (bas → haut) : basique=1, standard=2, pro=3, max=4.
 */
export const APPLE_SUBSCRIPTION_GROUP = 'INVEQ Plans';

export const APPLE_PLAN_PRODUCT_IDS = {
  basique: 'com.inveq.app.basique.monthly',
  standard: 'com.inveq.app.standard.monthly',
  pro: 'com.inveq.app.pro.monthly',
  max: 'com.inveq.app.max.monthly',
} as const;

export type ApplePaidPlanId = keyof typeof APPLE_PLAN_PRODUCT_IDS;

export const APPLE_PAID_PLAN_IDS = Object.keys(APPLE_PLAN_PRODUCT_IDS) as ApplePaidPlanId[];

export const APPLE_PRODUCT_IDS = Object.values(APPLE_PLAN_PRODUCT_IDS);

export const APPLE_PRODUCT_ID_TO_PLAN: Record<string, ApplePaidPlanId> = {
  [APPLE_PLAN_PRODUCT_IDS.basique]: 'basique',
  [APPLE_PLAN_PRODUCT_IDS.standard]: 'standard',
  [APPLE_PLAN_PRODUCT_IDS.pro]: 'pro',
  [APPLE_PLAN_PRODUCT_IDS.max]: 'max',
};

/** Prix ASC cibles (référence config App Store — l’UI utilise toujours displayPrice StoreKit). */
export const APPLE_PLAN_ASC_PRICE_EUR: Record<ApplePaidPlanId, number> = {
  basique: 7.99,
  standard: 19.99,
  pro: 32.99,
  max: 76.99,
};

export function planIdFromAppleProductId(productId: string): ApplePaidPlanId | null {
  return APPLE_PRODUCT_ID_TO_PLAN[productId] ?? null;
}

export function appleProductIdForPlan(planId: string): string | null {
  if (planId in APPLE_PLAN_PRODUCT_IDS) {
    return APPLE_PLAN_PRODUCT_IDS[planId as ApplePaidPlanId];
  }
  return null;
}

export function isApplePaidProductId(productId: string): boolean {
  return productId in APPLE_PRODUCT_ID_TO_PLAN;
}
