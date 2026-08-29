/**
 * Apple In-App Purchase — point d'intégration StoreKit.
 *
 * DESIGN §1 (contrainte non négociable) : les abonnements iOS passent
 * exclusivement par Apple IAP, jamais par Stripe Checkout ni par un lien
 * vers le site. Ce module isole ce point d'entrée pour que l'écran
 * Abonnement (`app/(app)/settings/premium.tsx`) et ses points d'accès
 * (plan-limit-modal, premium-upgrade-banner) restent stables une fois
 * StoreKit réellement câblé.
 *
 * ÉTAT ACTUEL — OPEN ITEM : aucune brique StoreKit native n'est installée
 * (pas de `expo-in-app-purchases`, pas de RevenueCat). Câbler l'un des deux
 * est le travail restant ; en attendant, ces fonctions échouent explicitement
 * plutôt que de simuler un faux succès. L'UI affiche alors le toast
 * « Achats Apple non encore reliés ».
 */

export class AppleIapNotConfiguredError extends Error {
  constructor() {
    super('Achats Apple non encore reliés.');
    this.name = 'AppleIapNotConfiguredError';
  }
}

export type ApplePurchaseResult = {
  /** `SubscriptionPlan.appStoreProductId` de l'offre achetée. */
  productId: string;
};

/**
 * Déclenche l'achat App Store de l'offre Premium.
 *
 * @param appStoreProductId `SubscriptionPlan.appStoreProductId` du palier ciblé
 * (`null` si le catalogue n'a pas encore de produit App Store configuré).
 *
 * TODO (open item) : brancher StoreKit — ex. `expo-in-app-purchases` /
 * `react-native-purchases` — puis appeler `stripe-confirm-subscription-checkout`
 * (ou son équivalent Apple côté serveur) avec le reçu de transaction pour
 * synchroniser `subscriptions` comme le fait déjà le retour Stripe web.
 */
export async function purchasePremium(
  appStoreProductId: string | null,
): Promise<ApplePurchaseResult> {
  void appStoreProductId;
  throw new AppleIapNotConfiguredError();
}

/**
 * Restaure les achats Apple existants (« Restaurer mes achats »).
 *
 * TODO (open item) : brancher `InAppPurchases.getPurchaseHistoryAsync` (ou
 * équivalent) puis revalider les reçus côté serveur.
 */
export async function restorePurchases(): Promise<ApplePurchaseResult[]> {
  throw new AppleIapNotConfiguredError();
}

/** `false` tant que StoreKit n'est pas câblé — voir OPEN ITEM ci-dessus. */
export function isAppleIapConfigured(): boolean {
  return false;
}

export function isAppleIapNotConfiguredError(
  error: unknown,
): error is AppleIapNotConfiguredError {
  return error instanceof AppleIapNotConfiguredError;
}
