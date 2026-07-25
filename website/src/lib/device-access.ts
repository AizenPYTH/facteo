/**
 * Contrôle d’accès web selon l’appareil.
 *
 * ENABLE_MOBILE_WEB = true  → les mobiles accèdent au site web normalement
 * ENABLE_MOBILE_WEB = false → redirection vers /mobile/ios|android (sauf exemptions)
 *
 * La homepage `/` n’est JAMAIS redirigée : même HTML pour desktop, mobile et Googlebot.
 * Variable d’env : NEXT_PUBLIC_ENABLE_MOBILE_WEB=true|false
 */

export type DevicePlatform = 'ios' | 'android' | 'desktop';

export const DEVICE_ACCESS = {
  /**
   * Quand true, iPhone / Android voient le site web comme sur desktop
   * (toutes les routes, pas seulement `/`).
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
 * Inclut le légal et le support (ouverts depuis l’app native).
 * La homepage `/` est gérée à part dans shouldRedirectMobile.
 */
export const MOBILE_GATE_EXEMPT_PREFIXES = [
  '/mobile',
  '/auth',
  '/login',
  '/register',
  '/onboarding',
  '/mot-de-passe-oublie',
  '/reinitialiser-mot-de-passe',
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

  // Homepage : jamais de gate — même HTML pour tous les UA (dont Googlebot Smartphone).
  const path = pathname.replace(/\/+$/, '') || '/';
  if (path === '/') {
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
