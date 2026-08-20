/** Identifiants In-App Purchase (App Store Connect). */
export const APPLE_PREMIUM_PRODUCT_ID =
  process.env.EXPO_PUBLIC_APPLE_PREMIUM_PRODUCT_ID?.trim() || 'com.inveq.app.premium.monthly';

export const APPLE_PREMIUM_PRODUCT_IDS = [APPLE_PREMIUM_PRODUCT_ID] as const;
