/**
 * Mode captures App Store : UI réelle + données fixtures (sans session Supabase).
 * Activer via EXPO_PUBLIC_SCREENSHOT_DEMO=1 (Expo web / Playwright).
 */
export function isScreenshotDemo(): boolean {
  const value = process.env.EXPO_PUBLIC_SCREENSHOT_DEMO?.trim().toLowerCase();
  return value === '1' || value === 'true' || value === 'yes';
}

export function getScreenshotDemoCredentials() {
  return {
    email: process.env.EXPO_PUBLIC_APP_STORE_DEMO_EMAIL?.trim() || 'appstore-demo@inveq.fr',
    password:
      process.env.EXPO_PUBLIC_APP_STORE_DEMO_PASSWORD?.trim() || 'InveqAppStoreDemo2026!',
  };
}
