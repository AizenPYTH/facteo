#!/usr/bin/env node
/**
 * Provisionne les Products + Prices Stripe INVEQ (8 abonnements) + sync Supabase
 * + configure le Customer Portal.
 *
 * Usage:
 *   STRIPE_SECRET_KEY=sk_... \
 *   SUPABASE_URL=https://xxx.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=... \
 *     node scripts/provision-stripe-subscription-prices.mjs
 *
 * Idempotent :
 * - réutilise un Price existant par lookup_key (aucun doublon)
 * - réutilise / met à jour un Product par metadata.plan_id
 * - peut être relancé sans créer de doublons
 *
 * LOOKUP KEYS — DÉFINITIFS (ne pas renommer) :
 *   monthly_basic, yearly_basic,
 *   monthly_standard, yearly_standard,
 *   monthly_pro, yearly_pro,
 *   monthly_max, yearly_max
 */

const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY?.trim();
const SUPABASE_URL = process.env.SUPABASE_URL?.trim() || process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

if (!STRIPE_SECRET) {
  console.error('Missing STRIPE_SECRET_KEY');
  process.exit(1);
}

/**
 * Catalogue définitif.
 * Montants HT en centimes EUR.
 * Annuel = équivalent mensuel × 12 (facturation annuelle).
 *   Basique  6,82 € → 682 ; annuel 4,27 × 12 = 51,24 € → 5124
 *   Standard 16,21 € → 1621 ; annuel 12,80 × 12 = 153,60 € → 15360
 *   Pro      27,30 € → 2730 ; annuel 21,33 × 12 = 255,96 € → 25596
 *   Max      63,98 € → 6398 ; annuel 51,18 × 12 = 614,16 € → 61416
 */
const CATALOG = [
  {
    planId: 'basique',
    sortOrder: 1,
    productName: 'INVEQ Basique',
    productDescription:
      'Offre Basique INVEQ — documents illimités, modèles PDF, personnalisation entreprise, recherche SIREN/SIRET (50/mois). Prix HT.',
    monthly: {
      lookup_key: 'monthly_basic',
      nickname: 'Basique mensuel (HT)',
      unit_amount: 682,
    },
    yearly: {
      lookup_key: 'yearly_basic',
      nickname: 'Basique annuel (HT)',
      unit_amount: 5124,
    },
  },
  {
    planId: 'standard',
    sortOrder: 2,
    productName: 'INVEQ Standard',
    productDescription:
      'Offre Standard INVEQ — tout Basique, signature électronique, jusqu’à 3 entreprises, recherche SIREN/SIRET (200/mois). Prix HT.',
    monthly: {
      lookup_key: 'monthly_standard',
      nickname: 'Standard mensuel (HT)',
      unit_amount: 1621,
    },
    yearly: {
      lookup_key: 'yearly_standard',
      nickname: 'Standard annuel (HT)',
      unit_amount: 15360,
    },
  },
  {
    planId: 'pro',
    sortOrder: 3,
    productName: 'INVEQ Pro',
    productDescription:
      'Offre Pro INVEQ — tout Standard, entreprises illimitées, recherche SIREN/SIRET illimitée. Prix HT.',
    monthly: {
      lookup_key: 'monthly_pro',
      nickname: 'Pro mensuel (HT)',
      unit_amount: 2730,
    },
    yearly: {
      lookup_key: 'yearly_pro',
      nickname: 'Pro annuel (HT)',
      unit_amount: 25596,
    },
  },
  {
    planId: 'max',
    sortOrder: 4,
    productName: 'INVEQ Max',
    productDescription:
      'Offre Max INVEQ — tout Pro, paiements Stripe sur factures, assistant IA, statistiques avancées. Prix HT.',
    monthly: {
      lookup_key: 'monthly_max',
      nickname: 'Max mensuel (HT)',
      unit_amount: 6398,
    },
    yearly: {
      lookup_key: 'yearly_max',
      nickname: 'Max annuel (HT)',
      unit_amount: 61416,
    },
  },
];

async function stripe(path, method = 'GET', body) {
  const response = await fetch(`https://api.stripe.com/v1${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${STRIPE_SECRET}`,
      ...(body ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}),
    },
    body: body ? new URLSearchParams(flattenBody(body)).toString() : undefined,
  });
  const json = await response.json();
  if (!response.ok) {
    throw new Error(`${method} ${path}: ${json.error?.message || JSON.stringify(json)}`);
  }
  return json;
}

/** Stripe form encoding for nested keys like metadata[plan_id]. */
function flattenBody(body, prefix = '') {
  const out = {};
  for (const [key, value] of Object.entries(body)) {
    const fullKey = prefix ? `${prefix}[${key}]` : key;
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        if (item && typeof item === 'object') {
          Object.assign(out, flattenBody(item, `${fullKey}[${index}]`));
        } else {
          out[`${fullKey}[${index}]`] = String(item);
        }
      });
    } else if (typeof value === 'object') {
      Object.assign(out, flattenBody(value, fullKey));
    } else {
      out[fullKey] = String(value);
    }
  }
  return out;
}

async function findPriceByLookupKey(lookupKey) {
  const list = await stripe(`/prices?lookup_keys[]=${encodeURIComponent(lookupKey)}&active=true&limit=1`);
  return list.data?.[0] ?? null;
}

async function findProductByPlanId(planId) {
  try {
    const search = await stripe(
      `/products/search?query=${encodeURIComponent(`active:'true' AND metadata['plan_id']:'${planId}'`)}`,
    );
    if (search.data?.[0]) return search.data[0];
  } catch {
    // Search may be unavailable on some accounts — fall through.
  }

  // Fallback: list active products and match metadata.
  let startingAfter = undefined;
  for (let page = 0; page < 10; page += 1) {
    const qs = new URLSearchParams({ active: 'true', limit: '100' });
    if (startingAfter) qs.set('starting_after', startingAfter);
    const list = await stripe(`/products?${qs.toString()}`);
    const match = (list.data || []).find((p) => p.metadata?.plan_id === planId);
    if (match) return match;
    if (!list.has_more || !list.data?.length) break;
    startingAfter = list.data[list.data.length - 1].id;
  }
  return null;
}

async function findOrCreateProduct(entry) {
  const existing = await findProductByPlanId(entry.planId);
  const metadata = {
    plan_id: entry.planId,
    sort_order: String(entry.sortOrder),
    source: 'INVEQ_provision',
    app: 'INVEQ',
  };

  if (existing) {
    const updated = await stripe(`/products/${existing.id}`, 'POST', {
      name: entry.productName,
      description: entry.productDescription,
      metadata,
    });
    console.log(`✓ product ${entry.planId} → ${updated.id} (updated)`);
    return updated;
  }

  const created = await stripe('/products', 'POST', {
    name: entry.productName,
    description: entry.productDescription,
    metadata,
  });
  console.log(`+ product ${entry.planId} → ${created.id}`);
  return created;
}

async function ensurePrice(productId, planId, spec, interval) {
  const existing = await findPriceByLookupKey(spec.lookup_key);
  if (existing) {
    if (existing.unit_amount !== spec.unit_amount) {
      throw new Error(
        `Price ${spec.lookup_key} exists (${existing.id}) with unit_amount=${existing.unit_amount}, expected ${spec.unit_amount}. ` +
          `Lookup keys are immutable — archive the old price in Stripe Dashboard then re-run, or keep the existing amount.`,
      );
    }
    if (existing.currency !== 'eur') {
      throw new Error(`Price ${spec.lookup_key} currency is ${existing.currency}, expected eur.`);
    }
    console.log(`✓ reuse ${spec.lookup_key} → ${existing.id}`);
    return existing;
  }

  const created = await stripe('/prices', 'POST', {
    product: productId,
    currency: 'eur',
    unit_amount: String(spec.unit_amount),
    nickname: spec.nickname,
    lookup_key: spec.lookup_key,
    tax_behavior: 'exclusive', // HT — TVA calculée par Stripe Tax si activée
    recurring: { interval: interval === 'yearly' ? 'year' : 'month' },
    metadata: {
      plan_id: planId,
      billing_interval: interval,
      lookup_key: spec.lookup_key,
      amount_ht_cents: String(spec.unit_amount),
      currency: 'eur',
      tax: 'exclusive_ht',
      source: 'INVEQ_provision',
    },
  });
  console.log(`+ create ${spec.lookup_key} → ${created.id} (${spec.unit_amount} centimes HT)`);
  return created;
}

async function updateSupabasePlan(planId, monthlyPriceId, yearlyPriceId, productId, entry) {
  if (!SUPABASE_URL || !SERVICE_ROLE) {
    console.warn('Skip DB update (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing)');
    return;
  }

  const response = await fetch(`${SUPABASE_URL}/rest/v1/subscription_plans?id=eq.${planId}`, {
    method: 'PATCH',
    headers: {
      apikey: SERVICE_ROLE,
      Authorization: `Bearer ${SERVICE_ROLE}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({
      display_name: entry.productName.replace(/^INVEQ\s+/, ''),
      description: entry.productDescription,
      sort_order: entry.sortOrder,
      stripe_product_id: productId,
      stripe_price_id: monthlyPriceId,
      stripe_price_id_yearly: yearlyPriceId,
      stripe_lookup_key_monthly: entry.monthly.lookup_key,
      stripe_lookup_key_yearly: entry.yearly.lookup_key,
      is_active: true,
      updated_at: new Date().toISOString(),
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Supabase update ${planId}: ${response.status} ${text}`);
  }
  console.log(`✓ DB ${planId} synced (sort_order=${entry.sortOrder})`);
}

async function ensureCustomerPortal(productsWithPrices) {
  const features = {
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
      default_allowed_updates: ['price'],
      proration_behavior: 'create_prorations',
      products: productsWithPrices.map((entry) => ({
        product: entry.productId,
        prices: [entry.monthlyPriceId, entry.yearlyPriceId],
      })),
    },
  };

  const list = await stripe('/billing_portal/configurations?limit=10&active=true');
  const existing = (list.data || []).find(
    (config) => config.metadata?.source === 'INVEQ_provision',
  );

  const payload = {
    business_profile: {
      headline: 'Gérer votre abonnement INVEQ',
    },
    features,
    metadata: {
      source: 'INVEQ_provision',
      app: 'INVEQ',
    },
    default_return_url:
      process.env.INVEQ_PORTAL_RETURN_URL?.trim() ||
      'https://inveq.app/app/settings/subscription',
  };

  if (existing) {
    const updated = await stripe(`/billing_portal/configurations/${existing.id}`, 'POST', payload);
    console.log(`✓ Customer Portal config updated → ${updated.id}`);
    return updated;
  }

  const created = await stripe('/billing_portal/configurations', 'POST', payload);
  console.log(`+ Customer Portal config created → ${created.id}`);
  return created;
}

async function ensureMicroSortOrder() {
  if (!SUPABASE_URL || !SERVICE_ROLE) return;
  const response = await fetch(`${SUPABASE_URL}/rest/v1/subscription_plans?id=eq.micro`, {
    method: 'PATCH',
    headers: {
      apikey: SERVICE_ROLE,
      Authorization: `Bearer ${SERVICE_ROLE}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({
      sort_order: 0,
      display_name: 'Micro',
      is_active: true,
      updated_at: new Date().toISOString(),
    }),
  });
  if (!response.ok) {
    console.warn(`Warn: could not ensure Micro sort_order: ${response.status}`);
    return;
  }
  console.log('✓ DB micro sort_order=0');
}

async function main() {
  console.log('Lookup keys (FINAL):');
  for (const entry of CATALOG) {
    console.log(`  ${entry.monthly.lookup_key}, ${entry.yearly.lookup_key}`);
  }
  console.log('');

  const provisioned = [];

  for (const entry of CATALOG) {
    const product = await findOrCreateProduct(entry);
    const monthly = await ensurePrice(product.id, entry.planId, entry.monthly, 'monthly');
    const yearly = await ensurePrice(product.id, entry.planId, entry.yearly, 'yearly');
    await updateSupabasePlan(entry.planId, monthly.id, yearly.id, product.id, entry);
    provisioned.push({
      planId: entry.planId,
      productId: product.id,
      monthlyPriceId: monthly.id,
      yearlyPriceId: yearly.id,
    });
  }

  await ensureMicroSortOrder();
  await ensureCustomerPortal(provisioned);

  console.log('\nDone. 4 products + 8 prices + Customer Portal ready (idempotent).');
  console.log('Tax: prices are tax_behavior=exclusive (HT). Enable Stripe Tax + registrations in Dashboard, then set STRIPE_AUTOMATIC_TAX=true on the checkout edge function.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
