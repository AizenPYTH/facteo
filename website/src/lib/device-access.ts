/**
 * Contrôle d’accès web selon l’appareil.
 *
 * ENABLE_MOBILE_WEB = true  → les mobiles accèdent au site web normalement
 * ENABLE_MOBILE_WEB = false → redirection vers /mobile/ios|android (sauf exemptions)
 *
 * La homepage `/` n’est JAMAIS redirigée : même HTML pour desktop, mobile et Googlebot.
 * Les robots d’indexation ne sont JAMAIS redirigés non plus, sur aucune route :
 * voir `isCrawler`.
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

/**
 * Robots d’indexation, reconnus à leur user-agent.
 *
 * Le crawler PRINCIPAL de Google est « Googlebot Smartphone », et son
 * user-agent contient « Android ». Il était donc pris pour un téléphone et
 * renvoyé vers `/mobile/android` sur toutes les pages hors exemptions — une
 * URL elle-même interdite dans robots.txt. Résultat : Search Console ne voyait
 * plus que des « Page avec redirection », et aucune page produit ou guide ne
 * pouvait être indexée. Bingbot, sur le même modèle d’user-agent, subissait le
 * même sort.
 *
 * Un robot doit toujours recevoir la page réelle, celle que voit un visiteur
 * sur ordinateur : c’est le contenu canonique du site.
 */
const CRAWLER_PATTERN =
  /(googlebot|google-inspectiontool|storebot-google|google-extended|adsbot-google|bingbot|bingpreview|applebot|duckduckbot|baiduspider|yandex(bot|images)|slurp|sogou|exabot|facebookexternalhit|facebot|twitterbot|linkedinbot|whatsapp|telegrambot|slackbot|discordbot|embedly|pinterest(bot)?|petalbot|ia_archiver|semrushbot|ahrefsbot|mj12bot|dotbot|screaming frog|chrome-lighthouse|lighthouse|gtmetrix|pagespeed|headlesschrome)/i;

export function isCrawler(userAgent: string): boolean {
  return CRAWLER_PATTERN.test(userAgent || '');
}

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

  // Un robot reçoit toujours la page réelle, sur toutes les routes. Le rediriger
  // rend le site inindexable (voir `isCrawler`).
  if (isCrawler(userAgent)) {
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
