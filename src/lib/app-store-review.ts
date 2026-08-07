/**
 * Compte Apple App Review.
 * Si Supabase n’a pas encore confirmé l’email / abonnement Max,
 * l’app active un mode offline (mêmes écrans + plan Max) pour ce login.
 */
export const APP_STORE_REVIEW_EMAIL = 'review@inveq.fr';
export const APP_STORE_REVIEW_PASSWORD = 'azaz651234';

export const APP_STORE_REVIEW_USER_ID = 'e1111111-1111-4111-8111-111111111111';
export const APP_STORE_REVIEW_SESSION_KEY = 'inveq:app-store-review-session';

let reviewModeActive = false;

export function isAppStoreReviewCredentials(email: string, password: string): boolean {
  return (
    email.trim().toLowerCase() === APP_STORE_REVIEW_EMAIL &&
    password === APP_STORE_REVIEW_PASSWORD
  );
}

export function activateAppStoreReviewMode(): void {
  reviewModeActive = true;
}

export function deactivateAppStoreReviewMode(): void {
  reviewModeActive = false;
}

export function isAppStoreReviewModeActive(): boolean {
  return reviewModeActive;
}
