/**
 * Contrôle d’accès web selon l’appareil.
 *
 * ENABLE_MOBILE_WEB = true  → les mobiles accèdent au site web normalement
 * ENABLE_MOBILE_WEB = false → redirection vers les pages /mobile/ios|android
 *
 * Variable d’env : NEXT_PUBLIC_ENABLE_MOBILE_WEB=true|false
 */

export type DevicePlatform = 'ios' | 'android' | 'desktop';

export const DEVICE_ACCESS = {
  /**
   * Quand true, iPhone / Android voient le site web comme sur desktop.
   * Passer à true lorsque la web app sera réellement responsive.
   */
  enableMobileWeb:
    process.env.NEXT_PUBLIC_ENABLE_MOBILE_WEB === 'true' ||
    process.env.ENABLE_MOBILE_WEB === 'true',

  /** App Store — laisser vide tant que non publié */
  iosAppStoreUrl: process.env.NEXT_PUBLIC_IOS_APP_STORE_URL?.trim() || '',

  /** TestFlight optionnel */
  iosTestFlightUrl: process.env.NEXT_PUBLIC_IOS_TESTFLIGHT_URL?.trim() || '',

  /** true uniquement quand l’app iOS est en ligne sur l’App Store */
  iosAppAvailable: process.env.NEXT_PUBLIC_IOS_APP_AVAILABLE === 'true',

  iosGatePath: '/mobile/ios',
  androidGatePath: '/mobile/android',
} as const;

/**
 * Chemins exclus de la redirection mobile.
 * Inclut les documents légaux / support : l’app iOS les ouvre dans Safari
 * (exigence App Store) — ils doivent rester accessibles sur téléphone.
 */
export const MOBILE_GATE_EXEMPT_PREFIXES = [
  '/mobile',
  '/auth',
  '/_next',
  '/api',
  '/favicon',
  // Légal (FR + alias EN)
  '/confidentialite',
  '/conditions-utilisation',
  '/conditions',
  '/mentions-legales',
  '/cookies',
  '/privacy',
  '/terms',
  '/legal',
  // Aide & contact (ouverts depuis l’app)
  '/support',
  '/contact',
] as const;

export function detectDevicePlatform(userAgent: string): DevicePlatform {
  const ua = userAgent || '';

  if (/iPhone|iPod|iPad/i.test(ua)) {
    return 'ios';
  }

  if (/Android/i.test(ua)) {
    return 'android';
  }

  return 'desktop';
}

export function shouldRedirectMobile(
  userAgent: string,
  pathname: string,
): { redirect: true; to: string } | { redirect: false } {
  if (DEVICE_ACCESS.enableMobileWeb) {
    return { redirect: false };
  }

  if (MOBILE_GATE_EXEMPT_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return { redirect: false };
  }

  const platform = detectDevicePlatform(userAgent);

  if (platform === 'ios') {
    return { redirect: true, to: DEVICE_ACCESS.iosGatePath };
  }

  if (platform === 'android') {
    return { redirect: true, to: DEVICE_ACCESS.androidGatePath };
  }

  return { redirect: false };
}
