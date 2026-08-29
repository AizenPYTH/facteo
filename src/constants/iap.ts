/**
 * Product IDs Apple acceptés pour l'abonnement INVEQ Premium.
 *
 * Garder ce mapping aligné avec
 * `supabase/functions/_shared/apple-products.ts`.
 */
export const APPLE_PREMIUM_PRODUCT_ID = 'com.inveq.app.premium.monthly';

export const APPLE_PRODUCT_ID_TO_PLAN = {
  [APPLE_PREMIUM_PRODUCT_ID]: 'premium',
  'com.inveq.app.basique.monthly': 'premium',
  'com.inveq.app.standard.monthly': 'premium',
  'com.inveq.app.pro.monthly': 'premium',
  'com.inveq.app.max.monthly': 'premium',
} as const;

export type ApplePlanId = (typeof APPLE_PRODUCT_ID_TO_PLAN)[keyof typeof APPLE_PRODUCT_ID_TO_PLAN];

export const APPLE_PRODUCT_IDS = Object.keys(APPLE_PRODUCT_ID_TO_PLAN);

export function planIdFromAppleProductId(productId: string): ApplePlanId | null {
  return productId in APPLE_PRODUCT_ID_TO_PLAN ? 'premium' : null;
}

export function isApplePaidProductId(productId: string): boolean {
  return planIdFromAppleProductId(productId) === 'premium';
}
