/**
 * Vérifie les exemptions du gate mobile pour les pages légales (App Store)
 * et l’absence de redirect sur la homepage `/`.
 * Usage : node scripts/verify-legal-urls.mjs
 */

const MOBILE_GATE_EXEMPT_PREFIXES = [
  '/mobile',
  '/auth',
  '/login',
  '/register',
  '/_next',
  '/api',
  '/favicon',
  '/confidentialite',
  '/conditions-utilisation',
  '/conditions',
  '/mentions-legales',
  '/cookies',
  '/privacy',
  '/terms',
  '/legal',
  '/support',
  '/contact',
];

function shouldRedirectMobile(userAgent, pathname) {
  const path = pathname.replace(/\/+$/, '') || '/';
  if (path === '/') {
    return { redirect: false };
  }
  if (MOBILE_GATE_EXEMPT_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return { redirect: false };
  }
  if (/iPhone|iPod|iPad/i.test(userAgent) || /Android/i.test(userAgent)) {
    return { redirect: true, to: /Android/i.test(userAgent) ? '/mobile/android' : '/mobile/ios' };
  }
  return { redirect: false };
}

const IPHONE_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';

const MUST_STAY_OPEN = [
  '/',
  '/confidentialite',
  '/conditions-utilisation',
  '/conditions',
  '/mentions-legales',
  '/cookies',
  '/privacy',
  '/terms',
  '/legal',
  '/support',
  '/contact',
];

const MUST_REDIRECT = ['/tarifs', '/fonctionnalites', '/app'];

let failed = 0;

for (const path of MUST_STAY_OPEN) {
  const result = shouldRedirectMobile(IPHONE_UA, path);
  if (result.redirect) {
    console.error(`FAIL ${path} → redirected to ${result.to}`);
    failed += 1;
  } else {
    console.log(`OK   ${path} (no redirect)`);
  }
}

for (const path of MUST_REDIRECT) {
  const result = shouldRedirectMobile(IPHONE_UA, path);
  if (!result.redirect) {
    console.error(`FAIL ${path} → should redirect on iPhone`);
    failed += 1;
  } else {
    console.log(`OK   ${path} → ${result.to}`);
  }
}

if (failed > 0) {
  console.error(`\n${failed} check(s) failed`);
  process.exit(1);
}

console.log('\nAll mobile-gate exemptions OK (homepage never redirected)');
