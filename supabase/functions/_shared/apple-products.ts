/**
 * Product IDs Apple acceptés côté serveur.
 * Garder ce mapping aligné avec `src/constants/iap.ts`.
 */
export const APPLE_PREMIUM_PRODUCT_ID = 'com.inveq.app.premium.monthly';

export const APPLE_PRODUCT_ID_TO_PLAN: Record<string, 'premium'> = {
  [APPLE_PREMIUM_PRODUCT_ID]: 'premium',
  'com.inveq.app.basique.monthly': 'premium',
  'com.inveq.app.standard.monthly': 'premium',
  'com.inveq.app.pro.monthly': 'premium',
  'com.inveq.app.max.monthly': 'premium',
};

export function planIdFromAppleProductId(productId: string): 'premium' | null {
  return APPLE_PRODUCT_ID_TO_PLAN[productId] ?? null;
}

export function allowedAppleProductIds(): Set<string> {
  return new Set(Object.keys(APPLE_PRODUCT_ID_TO_PLAN));
}
