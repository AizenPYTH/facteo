import { isAppStoreReviewModeActive } from '@/lib/app-store-review';
import { isScreenshotDemo } from '@/lib/screenshot-demo/is-screenshot-demo';

/** Données fixtures (captures OU compte Apple Review hors session Supabase). */
export function isOfflineDemoData(): boolean {
  return isScreenshotDemo() || isAppStoreReviewModeActive();
}
