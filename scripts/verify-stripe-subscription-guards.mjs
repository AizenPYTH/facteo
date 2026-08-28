#!/usr/bin/env node
/**
 * Vérifications statiques + (optionnel) live Test des garde-fous Stripe abonnement.
 *
 * Sans clés : audite le code (mode, anti-doublons, rotation prix, CTAs, anti-double Checkout).
 * Avec sk_test_ : vérifie les 8 Prices côté Stripe (aucun objet Live).
 *
 * Usage :
 *   node scripts/verify-stripe-subscription-guards.mjs
 *   STRIPE_SECRET_KEY=sk_test_... node scripts/verify-stripe-subscription-guards.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const LOOKUP_KEYS = [
  'monthly_basic',
  'yearly_basic',
  'monthly_standard',
  'yearly_standard',
  'monthly_pro',
  'yearly_pro',
  'monthly_max',
  'yearly_max',
];

const EXPECTED_CENTS = {
  monthly_basic: 682,
  yearly_basic: 5124,
  monthly_standard: 1621,
  yearly_standard: 15360,
  monthly_pro: 2730,
  yearly_pro: 25596,
  monthly_max: 6398,
  yearly_max: 61416,
};

/** @type {Array<{ name: string, ok: boolean, detail?: string }>} */
const results = [];

function check(name, ok, detail) {
  results.push({ name, ok: Boolean(ok), detail });
  const mark = ok ? '✓' : '✗';
  console.log(`${mark} ${name}${detail ? ` — ${detail}` : ''}`);
}

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

function detectMode(key) {
  if (key.startsWith('sk_live_') || key.startsWith('rk_live_')) return 'live';
  if (key.startsWith('sk_test_') || key.startsWith('rk_test_')) return 'test';
  throw new Error('clé invalide');
}

function auditCode() {
  console.log('\n=== Audit code (sans API) ===\n');

  const provision = read('scripts/provision-stripe-subscription-prices.mjs');
  check(
    'Mode Live/Test détecté depuis le préfixe de clé',
    provision.includes('detectStripeMode') &&
      provision.includes('sk_live_') &&
      provision.includes('sk_test_') &&
      provision.includes('stripe_mode'),
  );
  check(
    'Anti-doublon Product (nom + metadata.plan_id)',
    provision.includes('assertNoDuplicateProductNames') &&
      provision.includes('findExistingProduct') &&
      provision.includes('productName'),
  );
  check(
    'Rotation prix (transfer_lookup_key, pas de mutation unit_amount)',
    provision.includes('transfer_lookup_key: true') &&
      provision.includes('createOrRotatePrice') &&
      provision.includes('active: false'),
  );
  check(
    'Sync Supabase après rotation',
    provision.includes('syncSupabasePlan') && provision.includes('stripe_price_id_yearly'),
  );
  check(
    'Portal metadata source=INVEQ_provision',
    provision.includes("source: 'INVEQ_provision'"),
  );

  for (const key of LOOKUP_KEYS) {
    check(`Lookup key figée: ${key}`, provision.includes(`'${key}'`));
  }
  for (const [key, cents] of Object.entries(EXPECTED_CENTS)) {
    check(`Montant ${key} = ${cents}`, provision.includes(String(cents)));
  }

  const checkout = read('supabase/functions/stripe-create-subscription-checkout/index.ts');
  check(
    'Checkout refuse un 2e abonnement (USE_BILLING_PORTAL)',
    checkout.includes('USE_BILLING_PORTAL') && checkout.includes('alreadyPaid'),
  );

  const portalFn = read('supabase/functions/stripe-create-billing-portal/index.ts');
  check(
    'Edge function Billing Portal présente',
    portalFn.includes('billingPortal.sessions.create'),
  );

  const webCheckout = read('website/src/lib/stripe/subscription-checkout.ts');
  check(
    'Web : Acheter → Checkout, sinon → Portal',
    webCheckout.includes('useBillingPortal') && webCheckout.includes('startBillingPortalRedirect'),
  );

  const appCheckout = read('src/lib/stripe/subscription-checkout.ts');
  check(
    'App : Acheter → Checkout, sinon → Portal',
    appCheckout.includes('useBillingPortal') && appCheckout.includes('openBillingPortal'),
  );

  const plans = read('website/src/lib/subscription-plans.ts');
  check('CTA Acheter Basique/Standard/Pro/Max', plans.includes('Acheter Basique') && plans.includes('Acheter Max'));

  const subContent = read('website/src/app/app/settings/subscription/subscription-content.tsx');
  check(
    'Boutons Changer d’offre / mensuel↔annuel / Gérer',
    subContent.includes('Changer d’offre') &&
      subContent.includes('Passer à l’annuel') &&
      subContent.includes('Gérer mon abonnement'),
  );

  const premium = read('src/app/(app)/settings/premium.tsx');
  check(
    'App premium : Acheter / Changer d’offre / Gérer',
    premium.includes('Acheter') &&
      premium.includes('Changer d’offre') &&
      premium.includes('Gérer mon abonnement') &&
      premium.includes('Passer à l’annuel'),
  );

  const sync = read('supabase/functions/_shared/subscription-sync.ts');
  check(
    'Webhook sync résout le plan via lookup_key',
    sync.includes('resolvePlanIdFromLookupKey') && sync.includes('monthly_basic'),
  );

  // Unit test detectStripeMode (inline)
  try {
    check('detectMode(sk_test_) → test', detectMode('sk_test_abc') === 'test');
    check('detectMode(sk_live_) → live', detectMode('sk_live_abc') === 'live');
    let threw = false;
    try {
      detectMode('pk_test_x');
    } catch {
      threw = true;
    }
    check('detectMode refuse pk_/clés invalides', threw);
  } catch (e) {
    check('detectMode unit', false, String(e));
  }
}

async function auditStripeTestApi() {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) {
    console.log('\n=== API Stripe ===\n⊘ STRIPE_SECRET_KEY absent — skip (fournir sk_test_… pour vérifier les 8 Prices)\n');
    return;
  }

  let mode;
  try {
    mode = detectMode(key);
  } catch (e) {
    check('Clé Stripe valide', false, String(e));
    return;
  }

  check('Clé en mode TEST pour cette vérif pré-prod', mode === 'test', `mode=${mode}`);
  if (mode !== 'test') {
    console.log('⛔ Refus de lister des objets Live depuis ce script de garde. Utilisez sk_test_.');
    return;
  }

  console.log('\n=== API Stripe Test ===\n');
  const Stripe = (await import('stripe')).default;
  const stripe = new Stripe(key, { apiVersion: '2024-12-18.acacia' });

  /** @type {Map<string, string[]>} */
  const names = new Map();
  let startingAfter;
  for (;;) {
    const page = await stripe.products.list({ active: true, limit: 100, starting_after: startingAfter });
    for (const p of page.data) {
      if (!p.name.startsWith('INVEQ ')) continue;
      const list = names.get(p.name) ?? [];
      list.push(p.id);
      names.set(p.name, list);
      if (p.metadata?.stripe_mode && p.metadata.stripe_mode !== 'test') {
        check(`Produit ${p.name} mode test`, false, `stripe_mode=${p.metadata.stripe_mode}`);
      }
    }
    if (!page.has_more) break;
    startingAfter = page.data[page.data.length - 1]?.id;
    if (!startingAfter) break;
  }

  for (const name of ['INVEQ Basique', 'INVEQ Standard', 'INVEQ Pro', 'INVEQ Max']) {
    const ids = names.get(name) ?? [];
    check(`Pas de doublon produit « ${name} »`, ids.length <= 1, ids.length ? ids.join(',') : 'absent (provisionner)');
  }

  for (const keyName of LOOKUP_KEYS) {
    const listed = await stripe.prices.list({ lookup_keys: [keyName], active: true, limit: 1 });
    const price = listed.data[0];
    if (!price) {
      check(`Price actif ${keyName}`, false, 'manquant — lancer provision');
      continue;
    }
    const expected = EXPECTED_CENTS[keyName];
    check(
      `Price ${keyName}`,
      price.unit_amount === expected,
      `${price.id} amount=${price.unit_amount} (attendu ${expected})`
    );
  }
}

async function main() {
  console.log('INVEQ — vérification garde-fous abonnement Stripe');
  auditCode();
  await auditStripeTestApi();

  const failed = results.filter((r) => !r.ok);
  console.log(`\n=== Résultat : ${results.length - failed.length}/${results.length} OK ===`);
  if (failed.length) {
    console.log('Échecs :');
    for (const f of failed) console.log(`  - ${f.name}${f.detail ? ` (${f.detail})` : ''}`);
    process.exit(1);
  }
  console.log('\nProchaine étape E2E (sk_test_ + service role) :');
  console.log('  node scripts/e2e-stripe-subscription-journey.mjs');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
