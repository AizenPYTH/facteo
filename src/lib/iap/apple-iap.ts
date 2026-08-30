/**
 * @deprecated Utiliser `@/lib/iap/apple-subscription` (multi-plan Micro→Max).
 * Réexport de compatibilité — ne pas ajouter de logique Premium unique ici.
 */
export {
  confirmAppleSubscriptionPurchase,
  fetchAppleStoreProducts,
  isApplePurchaseCanceledError,
  isAppleSubscriptionConfirmConfigured,
  isAppleSubscriptionConfirmConfigured as isAppleIapConfigured,
  isAppleSubscriptionConfirmConfigured as isAppleIapConfirmConfigured,
  restoreApplePlanPurchases,
  restoreApplePlanPurchases as restorePremiumPurchases,
  restoreApplePlanPurchases as restorePurchases,
  startApplePlanPurchase,
  startApplePremiumPurchase,
  type ApplePlanConfirmResult,
  type ApplePlanConfirmResult as AppleIapConfirmResult,
  type AppleStoreProductInfo,
} from '@/lib/iap/apple-subscription';

import { startApplePlanPurchase } from '@/lib/iap/apple-subscription';
import { planIdFromAppleProductId } from '@/constants/iap';

/** @deprecated Utiliser startApplePlanPurchase(planId) */
export async function purchasePremium(appStoreProductId: string | null) {
  const planId = appStoreProductId
    ? planIdFromAppleProductId(appStoreProductId)
    : null;
  return startApplePlanPurchase(planId ?? 'pro');
}
