/**
 * Mapping Product ID Apple ↔ plan métier (copie Deno — alignée sur src/constants/iap.ts).
 */
export const APPLE_PLAN_PRODUCT_IDS = {
  basique: 'com.inveq.app.basique.monthly',
  standard: 'com.inveq.app.standard.monthly',
  pro: 'com.inveq.app.pro.monthly',
  max: 'com.inveq.app.max.monthly',
} as const;

export type ApplePaidPlanId = keyof typeof APPLE_PLAN_PRODUCT_IDS;

export const APPLE_PRODUCT_ID_TO_PLAN: Record<string, ApplePaidPlanId> = {
  [APPLE_PLAN_PRODUCT_IDS.basique]: 'basique',
  [APPLE_PLAN_PRODUCT_IDS.standard]: 'standard',
  [APPLE_PLAN_PRODUCT_IDS.pro]: 'pro',
  [APPLE_PLAN_PRODUCT_IDS.max]: 'max',
};

export function planIdFromAppleProductId(productId: string): ApplePaidPlanId | null {
  return APPLE_PRODUCT_ID_TO_PLAN[productId] ?? null;
}

export function allowedAppleProductIds(): Set<string> {
  return new Set(Object.keys(APPLE_PRODUCT_ID_TO_PLAN));
}
