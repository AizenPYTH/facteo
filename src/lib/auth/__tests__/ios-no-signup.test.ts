/**
 * Audit + regression helpers for Guideline 3.1.1 (no iOS account creation).
 * Run: npm run test:ios-no-signup
 */
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { isAccountCreationPathOrUrl } from '../account-creation-paths.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '../../../..');
const SRC = join(root, 'src');

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '.git') continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (/\.(tsx?|jsx?)$/.test(name)) out.push(p);
  }
  return out;
}

test('isAccountCreationPathOrUrl detects registration targets', () => {
  assert.equal(isAccountCreationPathOrUrl('/register'), true);
  assert.equal(isAccountCreationPathOrUrl('/register?x=1'), true);
  assert.equal(isAccountCreationPathOrUrl('/inscription'), true);
  assert.equal(isAccountCreationPathOrUrl('https://www.inveq.fr/register'), true);
  assert.equal(isAccountCreationPathOrUrl('https://www.inveq.fr/inscription'), true);
  assert.equal(isAccountCreationPathOrUrl('/signup'), true);
  assert.equal(isAccountCreationPathOrUrl('/login'), false);
  assert.equal(isAccountCreationPathOrUrl('/forgot-password'), false);
  assert.equal(isAccountCreationPathOrUrl('https://www.inveq.fr/support'), false);
  assert.equal(isAccountCreationPathOrUrl('https://www.inveq.fr/confidentialite'), false);
});

test('login screen gates register CTA', () => {
  const loginSrc = readFileSync(join(root, 'src/app/(auth)/login.tsx'), 'utf8');
  assert.match(loginSrc, /isIosAccountCreationDisabled/);
  assert.match(loginSrc, /hideAccountCreation \? null/);
  assert.match(loginSrc, /title="Connexion"/);
});

test('register screen redirects on iOS before form', () => {
  const registerSrc = readFileSync(join(root, 'src/app/(auth)/register.tsx'), 'utf8');
  assert.match(registerSrc, /isIosAccountCreationDisabled/);
  assert.match(registerSrc, /Redirect href=\{\'\/login\'/);
  assert.match(registerSrc, /RegisterScreenForm/);
});

test('auth provider blocks signUp on iOS', () => {
  const authSrc = readFileSync(join(root, 'src/providers/auth-provider.tsx'), 'utf8');
  assert.match(authSrc, /assertIosSignupAllowed/);
});

test('openExternalUrl blocks register URLs on iOS', () => {
  const legalSrc = readFileSync(join(root, 'src/lib/legal/open-legal-page.ts'), 'utf8');
  assert.match(legalSrc, /isAccountCreationPathOrUrl/);
  assert.match(legalSrc, /isIosAccountCreationDisabled/);
});

test('marketing button remaps register href on iOS', () => {
  const btnSrc = readFileSync(join(root, 'src/components/marketing/marketing-button.tsx'), 'utf8');
  assert.match(btnSrc, /resolveSafeHref/);
  assert.match(btnSrc, /\/login/);
});

test('plan checkout uses Apple IAP on iOS (no Stripe subscription)', () => {
  const checkoutSrc = readFileSync(join(root, 'src/hooks/use-plan-checkout.ts'), 'utf8');
  assert.match(checkoutSrc, /Platform\.OS === 'ios'/);
  assert.match(checkoutSrc, /startApplePlanPurchase/);
  assert.ok(checkoutSrc.indexOf('usesAppleIap') > 0);
});

test('src has no ungated Link to /register outside register.tsx/marketing', () => {
  const files = walk(SRC);
  const offenders: string[] = [];
  for (const file of files) {
    const rel = relative(root, file);
    if (rel.includes('register.tsx')) continue;
    if (rel.includes('ios-no-signup') || rel.includes('account-creation-paths')) continue;
    if (rel.includes('__tests__')) continue;
    if (rel.includes('components/marketing/')) continue;
    const src = readFileSync(file, 'utf8');
    if (/href=\{\s*['"`]\/register['"`]/.test(src) || /href=["']\/register["']/.test(src)) {
      if (!src.includes('isIosAccountCreationDisabled') && !src.includes('hideAccountCreation')) {
        offenders.push(rel);
      }
    }
    if (/inveq\.fr\/register/.test(src) && !src.includes('isAccountCreationPathOrUrl')) {
      offenders.push(rel);
    }
  }
  assert.deepEqual(offenders, [], `Ungated register links: ${offenders.join(', ')}`);
});

test('website /register page still exists', () => {
  const page = join(root, 'website/src/app/register/page.tsx');
  const src = readFileSync(page, 'utf8');
  assert.match(src, /Créer un compte/);
  assert.match(src, /RegisterForm/);
});
