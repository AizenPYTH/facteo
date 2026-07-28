#!/usr/bin/env node
/**
 * Crée / met à jour les 4 Products + 8 Prices Stripe (Live ou Test selon la clé),
 * configure le Customer Portal, et synchronise subscription_plans dans Supabase.
 *
 * Garanties :
 * 1. Mode strict : sk_live_ → Live uniquement, sk_test_ → Test uniquement (aucun mélange).
 * 2. Idempotence produit : jamais 2 Products avec le même nom (recherche par metadata.plan_id puis nom exact).
 * 3. Rotation de prix : si le montant change, archive l’ancien Price, crée un nouveau Price
 *    (transfer_lookup_key), met à jour Supabase — ne modifie jamais amount d’un Price existant.
 *
 * Usage :
 *   STRIPE_SECRET_KEY=sk_test_... SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
 *     node scripts/provision-stripe-subscription-prices.mjs
 *
 * Optionnel : STRIPE_PRODUCT_CURRENCY=eur
 */

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const currency = (process.env.STRIPE_PRODUCT_CURRENCY || 'eur').toLowerCase();

/** @typedef {'basique' | 'standard' | 'pro' | 'max'} PaidPlanId */

/** @type {Array<{
 *   planId: PaidPlanId,
 *   productName: string,
 *   description: string,
 *   monthlyCents: number,
 *   yearlyCents: number,
 *   monthlyLookup: string,
 *   yearlyLookup: string,
 * }>} */
const PLANS = [
  {
    planId: 'basique',
    productName: 'INVEQ Basique',
    description: 'Offre Basique — facturation et clients essentiels',
    monthlyCents: 682,
    yearlyCents: 5124,
    monthlyLookup: 'monthly_basic',
    yearlyLookup: 'yearly_basic',
  },
  {
    planId: 'standard',
    productName: 'INVEQ Standard',
    description: 'Offre Standard — automatisations et outils avancés',
    monthlyCents: 1621,
    yearlyCents: 15360,
    monthlyLookup: 'monthly_standard',
    yearlyLookup: 'yearly_standard',
  },
  {
    planId: 'pro',
    productName: 'INVEQ Pro',
    description: 'Offre Pro — volume et accompagnement prioritaire',
    monthlyCents: 2730,
    yearlyCents: 25596,
    monthlyLookup: 'monthly_pro',
    yearlyLookup: 'yearly_pro',
  },
  {
    planId: 'max',
    productName: 'INVEQ Max',
    description: 'Offre Max — usage intensif et priorités maximales',
    monthlyCents: 6398,
    yearlyCents: 61416,
    monthlyLookup: 'monthly_max',
    yearlyLookup: 'yearly_max',
  },
];

/**
 * @param {string} key
 * @returns {'test' | 'live'}
 */
function detectStripeMode(key) {
  if (key.startsWith('sk_live_') || key.startsWith('rk_live_')) return 'live';
  if (key.startsWith('sk_test_') || key.startsWith('rk_test_')) return 'test';
  throw new Error(
    'STRIPE_SECRET_KEY invalide : doit commencer par sk_test_ / sk_live_ (ou rk_test_ / rk_live_).'
  );
}

/**
 * @param {Stripe} stripe
 * @param {string} lookupKey
 */
async function findPriceByLookupKey(stripe, lookupKey) {
  const listed = await stripe.prices.list({
    lookup_keys: [lookupKey],
    active: true,
    limit: 1,
  });
  return listed.data[0] ?? null;
}

/**
 * @param {Stripe} stripe
 * @param {string} productId
 * @param {'month' | 'year'} interval
 * @param {number} unitAmount
 */
async function findActivePriceByAmount(stripe, productId, interval, unitAmount) {
  const listed = await stripe.prices.list({
    product: productId,
    active: true,
    type: 'recurring',
    limit: 100,
  });
  return (
    listed.data.find(
      (p) =>
        p.recurring?.interval === interval &&
        p.unit_amount === unitAmount &&
        p.currency === currency
    ) ?? null
  );
}

/**
 * @param {Stripe} stripe
 * @param {PaidPlanId} planId
 * @param {string} productName
 */
async function findExistingProduct(stripe, planId, productName) {
  let startingAfter;
  for (;;) {
    /** @type {Stripe.ProductListParams} */
    const params = { active: true, limit: 100 };
    if (startingAfter) params.starting_after = startingAfter;
    const page = await stripe.products.list(params);
    const byMeta = page.data.find((p) => p.metadata?.plan_id === planId);
    if (byMeta) return byMeta;
    const byName = page.data.find((p) => p.name === productName);
    if (byName) return byName;
    if (!page.has_more) break;
    startingAfter = page.data[page.data.length - 1]?.id;
    if (!startingAfter) break;
  }
  return null;
}

/**
 * Refuse s’il existe déjà plusieurs produits actifs avec le même nom.
 * @param {Stripe} stripe
 */
async function assertNoDuplicateProductNames(stripe) {
  /** @type {Map<string, string[]>} */
  const byName = new Map();
  let startingAfter;
  for (;;) {
    /** @type {Stripe.ProductListParams} */
    const params = { active: true, limit: 100 };
    if (startingAfter) params.starting_after = startingAfter;
    const page = await stripe.products.list(params);
    for (const p of page.data) {
      const list = byName.get(p.name) ?? [];
      list.push(p.id);
      byName.set(p.name, list);
    }
    if (!page.has_more) break;
    startingAfter = page.data[page.data.length - 1]?.id;
    if (!startingAfter) break;
  }

  const expectedNames = new Set(PLANS.map((p) => p.productName));
  for (const [name, ids] of byName) {
    if (!expectedNames.has(name)) continue;
    if (ids.length > 1) {
      throw new Error(
        `Doublon détecté pour le produit "${name}" (${ids.join(', ')}). ` +
          'Supprimez ou archivez les doublons dans le Dashboard Stripe avant de relancer.'
      );
    }
  }
}

/**
 * @param {Stripe} stripe
 * @param {typeof PLANS[number]} plan
 * @param {'test' | 'live'} mode
 */
async function ensureProduct(stripe, plan, mode) {
  const existing = await findExistingProduct(stripe, plan.planId, plan.productName);
  const metadata = {
    plan_id: plan.planId,
    app: 'inveq',
    stripe_mode: mode,
  };

  if (existing) {
    if (existing.metadata?.stripe_mode && existing.metadata.stripe_mode !== mode) {
      throw new Error(
        `Produit ${existing.id} (${existing.name}) a metadata.stripe_mode=${existing.metadata.stripe_mode} ` +
          `mais la clé utilisée est en mode ${mode}. Aucun mélange Live/Test.`
      );
    }
    return stripe.products.update(existing.id, {
      name: plan.productName,
      description: plan.description,
      metadata,
    });
  }

  await assertNoDuplicateProductNames(stripe);

  return stripe.products.create({
    name: plan.productName,
    description: plan.description,
    metadata,
  });
}

/**
 * Crée un Price ou réutilise l’existant. Si le montant a changé :
 * archive l’ancien, crée un nouveau Price avec transfer_lookup_key, ne mute jamais unit_amount.
 *
 * @param {Stripe} stripe
 * @param {string} productId
 * @param {{
 *   lookupKey: string,
 *   unitAmount: number,
 *   interval: 'month' | 'year',
 *   planId: PaidPlanId,
 *   mode: 'test' | 'live',
 * }} opts
 */
async function createOrRotatePrice(stripe, productId, opts) {
  const { lookupKey, unitAmount, interval, planId, mode } = opts;
  const existing = await findPriceByLookupKey(stripe, lookupKey);

  if (existing) {
    if (existing.metadata?.stripe_mode && existing.metadata.stripe_mode !== mode) {
      throw new Error(
        `Price ${existing.id} (${lookupKey}) est tagué mode=${existing.metadata.stripe_mode} ` +
          `mais la clé est ${mode}. Aucun mélange.`
      );
    }
    if (existing.product !== productId) {
      throw new Error(
        `Price ${existing.id} (${lookupKey}) est lié au produit ${existing.product}, attendu ${productId}.`
      );
    }
    if (
      existing.unit_amount === unitAmount &&
      existing.currency === currency &&
      existing.recurring?.interval === interval
    ) {
      return { price: existing, rotated: false };
    }

    // Montant / devise / intervalle différents → nouveau Price (Stripe interdit de muter unit_amount)
    console.log(
      `  ↻ Rotation ${lookupKey}: ${existing.unit_amount} → ${unitAmount} ${currency}/${interval}`
    );
    const created = await stripe.prices.create({
      product: productId,
      currency,
      unit_amount: unitAmount,
      tax_behavior: 'exclusive',
      recurring: { interval },
      lookup_key: lookupKey,
      transfer_lookup_key: true,
      metadata: {
        plan_id: planId,
        interval,
        app: 'inveq',
        stripe_mode: mode,
        replaces_price: existing.id,
      },
    });
    if (existing.active) {
      await stripe.prices.update(existing.id, { active: false });
    }
    return { price: created, rotated: true, previousPriceId: existing.id };
  }

  const byAmount = await findActivePriceByAmount(stripe, productId, interval, unitAmount);
  if (byAmount) {
    if (byAmount.lookup_key !== lookupKey) {
      return {
        price: await stripe.prices.update(byAmount.id, {
          lookup_key: lookupKey,
          metadata: {
            plan_id: planId,
            interval,
            app: 'inveq',
            stripe_mode: mode,
          },
        }),
        rotated: false,
      };
    }
    return { price: byAmount, rotated: false };
  }

  const created = await stripe.prices.create({
    product: productId,
    currency,
    unit_amount: unitAmount,
    tax_behavior: 'exclusive',
    recurring: { interval },
    lookup_key: lookupKey,
    metadata: {
      plan_id: planId,
      interval,
      app: 'inveq',
      stripe_mode: mode,
    },
  });
  return { price: created, rotated: false };
}

/**
 * @param {Stripe} stripe
 * @param {string[]} priceIds
 */
async function ensureCustomerPortal(stripe, priceIds) {
  const unique = [...new Set(priceIds.filter(Boolean))];
  if (unique.length < 8) {
    throw new Error(`Portal: 8 price ids requis, reçu ${unique.length}`);
  }

  const priceObjects = await Promise.all(unique.map((id) => stripe.prices.retrieve(id)));
  const productByPrice = new Map(
    priceObjects.map((p) => [p.id, typeof p.product === 'string' ? p.product : p.product.id])
  );

  const products = PLANS.map((plan, index) => {
    const monthlyId = unique[index * 2];
    const yearlyId = unique[index * 2 + 1];
    const productId = productByPrice.get(monthlyId);
    if (!productId) throw new Error(`Produit introuvable pour ${plan.planId}`);
    return {
      product: productId,
      prices: [monthlyId, yearlyId],
    };
  });

  const payload = {
    business_profile: {
      headline: 'Gérer votre abonnement INVEQ',
    },
    metadata: {
      source: 'INVEQ_provision',
      app: 'inveq',
    },
    features: {
      customer_update: {
        enabled: true,
        allowed_updates: ['email', 'address', 'tax_id'],
      },
      invoice_history: { enabled: true },
      payment_method_update: { enabled: true },
      subscription_cancel: {
        enabled: true,
        mode: 'at_period_end',
        proration_behavior: 'none',
      },
      subscription_update: {
        enabled: true,
        default_allowed_updates: ['price', 'promotion_code'],
        proration_behavior: 'create_prorations',
        products,
      },
    },
  };

  const configs = await stripe.billingPortal.configurations.list({ limit: 20, active: true });
  const existing =
    configs.data.find((c) => c.metadata?.source === 'INVEQ_provision') ?? configs.data[0] ?? null;

  if (existing) {
    return stripe.billingPortal.configurations.update(existing.id, payload);
  }
  return stripe.billingPortal.configurations.create(payload);
}

/**
 * Synchronise uniquement les colonnes réelles de public.subscription_plans.
 * (Pas de currency / price_*_cents — montants & devise vivent sur Stripe Price.)
 *
 * Colonnes schéma :
 *   stripe_price_id          → Price mensuel (cache)
 *   stripe_price_id_yearly   → Price annuel (cache)
 *   stripe_product_id        → Product
 *   stripe_lookup_key_*      → lookup_keys (source de vérité)
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {{
 *   planId: PaidPlanId,
 *   productId: string,
 *   monthlyPriceId: string,
 *   yearlyPriceId: string,
 *   monthlyLookup: string,
 *   yearlyLookup: string,
 * }} input
 */
async function syncSupabasePlan(supabase, input) {
  const { error } = await supabase
    .from('subscription_plans')
    .update({
      stripe_product_id: input.productId,
      stripe_price_id: input.monthlyPriceId,
      stripe_price_id_yearly: input.yearlyPriceId,
      stripe_lookup_key_monthly: input.monthlyLookup,
      stripe_lookup_key_yearly: input.yearlyLookup,
      is_active: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.planId);

  if (error) {
    throw new Error(`Supabase update ${input.planId}: ${error.message}`);
  }
}

async function main() {
  const stripeKey = process.env.STRIPE_SECRET_KEY?.trim();
  const supabaseUrl = (process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL || '').trim();
  const serviceRole = (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    ''
  ).trim();

  if (!stripeKey) {
    console.error('Missing STRIPE_SECRET_KEY');
    process.exit(1);
  }
  if (!supabaseUrl || !serviceRole) {
    console.error('Missing SUPABASE_URL (or EXPO_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  const mode = detectStripeMode(stripeKey);
  console.log(`\n🔐 Mode Stripe détecté : ${mode.toUpperCase()} (clé ${stripeKey.slice(0, 8)}…)`);
  if (mode === 'live') {
    console.log('⚠️  Vous provisionnez l’environnement LIVE. Vérifiez les montants avant production.\n');
  } else {
    console.log('✅ Environnement TEST — aucun objet Live ne sera touché.\n');
  }

  const stripe = new Stripe(stripeKey, {
    apiVersion: '2024-12-18.acacia',
  });

  // Sanity: la clé doit pouvoir lister — et on stamp le mode sur les objets créés
  const account = await stripe.accounts.retrieve();
  console.log(`Compte Stripe : ${account.id} (${account.settings?.dashboard?.display_name || 'n/a'})`);

  await assertNoDuplicateProductNames(stripe);

  const supabase = createClient(supabaseUrl, serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  /** @type {string[]} */
  const orderedPriceIds = [];
  /** @type {Record<string, { monthly: string, yearly: string, rotated: string[] }>} */
  const summary = {};

  for (const plan of PLANS) {
    console.log(`→ ${plan.productName}`);
    const product = await ensureProduct(stripe, plan, mode);
    console.log(`  Product ${product.id}`);

    const monthly = await createOrRotatePrice(stripe, product.id, {
      lookupKey: plan.monthlyLookup,
      unitAmount: plan.monthlyCents,
      interval: 'month',
      planId: plan.planId,
      mode,
    });
    const yearly = await createOrRotatePrice(stripe, product.id, {
      lookupKey: plan.yearlyLookup,
      unitAmount: plan.yearlyCents,
      interval: 'year',
      planId: plan.planId,
      mode,
    });

    console.log(`  Monthly ${monthly.price.id}${monthly.rotated ? ' (nouveau)' : ''}`);
    console.log(`  Yearly  ${yearly.price.id}${yearly.rotated ? ' (nouveau)' : ''}`);

    await syncSupabasePlan(supabase, {
      planId: plan.planId,
      productId: product.id,
      monthlyPriceId: monthly.price.id,
      yearlyPriceId: yearly.price.id,
      monthlyLookup: plan.monthlyLookup,
      yearlyLookup: plan.yearlyLookup,
    });
    console.log(`  ✓ Supabase subscription_plans.${plan.planId} à jour`);

    orderedPriceIds.push(monthly.price.id, yearly.price.id);
    summary[plan.planId] = {
      product: product.id,
      monthly: monthly.price.id,
      yearly: yearly.price.id,
      rotated: [
        ...(monthly.rotated ? [plan.monthlyLookup] : []),
        ...(yearly.rotated ? [plan.yearlyLookup] : []),
      ],
    };
  }

  // Micro gratuit — pas de Price Stripe
  {
    const { error: microError } = await supabase
      .from('subscription_plans')
      .update({
        stripe_product_id: null,
        stripe_price_id: null,
        stripe_price_id_yearly: null,
        stripe_lookup_key_monthly: null,
        stripe_lookup_key_yearly: null,
        is_active: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', 'micro');
    if (microError) {
      throw new Error(`Supabase update micro: ${microError.message}`);
    }
  }

  console.log('\n→ Customer Portal (changement d’offre / mensuel↔annuel / résiliation)');
  const portal = await ensureCustomerPortal(stripe, orderedPriceIds);
  console.log(`  Configuration ${portal.id}`);

  // Vérification finale anti-mélange + anti-doublons
  await assertNoDuplicateProductNames(stripe);
  for (const plan of PLANS) {
    for (const key of [plan.monthlyLookup, plan.yearlyLookup]) {
      const p = await findPriceByLookupKey(stripe, key);
      if (!p) throw new Error(`Lookup manquant après provision: ${key}`);
      if (p.metadata?.stripe_mode && p.metadata.stripe_mode !== mode) {
        throw new Error(`Mélange mode sur ${key}`);
      }
    }
  }

  console.log('\n=== Récapitulatif ===');
  console.log(JSON.stringify({ mode, account: account.id, plans: summary, portal: portal.id }, null, 2));
  console.log('\nProchaines étapes :');
  console.log('1. Dashboard Stripe → Webhooks → endpoint …/functions/v1/stripe-subscription-webhook');
  console.log('   Events : checkout.session.completed, customer.subscription.*, invoice.paid');
  console.log('2. Secrets Supabase : STRIPE_SECRET_KEY (même mode), STRIPE_WEBHOOK_SECRET');
  console.log('3. Relancer ce script après un changement de tarif (rotation auto + update Supabase)');
  console.log('4. Tester le parcours avec sk_test_ via : node scripts/e2e-stripe-subscription-journey.mjs');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
