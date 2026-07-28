#!/usr/bin/env node
/**
 * Provisionne les 8 Prices Stripe INVEQ (lookup_keys) + met à jour subscription_plans.
 *
 * Usage:
 *   STRIPE_SECRET_KEY=sk_... SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
 *     node scripts/provision-stripe-subscription-prices.mjs
 *
 * Idempotent : réutilise les prices existants par lookup_key.
 */

const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY?.trim();
const SUPABASE_URL = process.env.SUPABASE_URL?.trim() || process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

if (!STRIPE_SECRET) {
  console.error('Missing STRIPE_SECRET_KEY');
  process.exit(1);
}

/** Montants HT en centimes EUR — créés une seule fois dans Stripe, lus ensuite via API. */
const CATALOG = [
  {
    planId: 'basique',
    productName: 'INVEQ Basique',
    monthly: { lookup_key: 'monthly_basic', nickname: 'Monthly Basic', unit_amount: 682 },
    yearly: { lookup_key: 'yearly_basic', nickname: 'Yearly Basic', unit_amount: 5124 },
  },
  {
    planId: 'standard',
    productName: 'INVEQ Standard',
    monthly: { lookup_key: 'monthly_standard', nickname: 'Monthly Standard', unit_amount: 1621 },
    yearly: { lookup_key: 'yearly_standard', nickname: 'Yearly Standard', unit_amount: 15360 },
  },
  {
    planId: 'pro',
    productName: 'INVEQ Pro',
    monthly: { lookup_key: 'monthly_pro', nickname: 'Monthly Pro', unit_amount: 2730 },
    yearly: { lookup_key: 'yearly_pro', nickname: 'Yearly Pro', unit_amount: 25596 },
  },
  {
    planId: 'max',
    productName: 'INVEQ Max',
    monthly: { lookup_key: 'monthly_max', nickname: 'Monthly Max', unit_amount: 6398 },
    yearly: { lookup_key: 'yearly_max', nickname: 'Yearly Max', unit_amount: 61416 },
  },
];

async function stripe(path, method = 'GET', body) {
  const response = await fetch(`https://api.stripe.com/v1${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${STRIPE_SECRET}`,
      ...(body ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}),
    },
    body: body ? new URLSearchParams(body).toString() : undefined,
  });
  const json = await response.json();
  if (!response.ok) {
    throw new Error(`${method} ${path}: ${json.error?.message || JSON.stringify(json)}`);
  }
  return json;
}

async function findPriceByLookupKey(lookupKey) {
  const list = await stripe(`/prices?lookup_keys[]=${encodeURIComponent(lookupKey)}&active=true&limit=1`);
  return list.data?.[0] ?? null;
}

async function findOrCreateProduct(name, planId) {
  const search = await stripe(
    `/products/search?query=${encodeURIComponent(`active:'true' AND metadata['plan_id']:'${planId}'`)}`,
  );
  if (search.data?.[0]) return search.data[0];

  return stripe('/products', 'POST', {
    name,
    'metadata[plan_id]': planId,
    'metadata[source]': 'INVEQ_provision',
  });
}

async function ensurePrice(productId, spec, interval) {
  const existing = await findPriceByLookupKey(spec.lookup_key);
  if (existing) {
    console.log(`✓ reuse ${spec.lookup_key} → ${existing.id}`);
    return existing;
  }

  const created = await stripe('/prices', 'POST', {
    product: productId,
    currency: 'eur',
    unit_amount: String(spec.unit_amount),
    nickname: spec.nickname,
    lookup_key: spec.lookup_key,
    'recurring[interval]': interval === 'yearly' ? 'year' : 'month',
    'metadata[billing_interval]': interval,
  });
  console.log(`+ create ${spec.lookup_key} → ${created.id} (${spec.unit_amount} centimes)`);
  return created;
}

async function updateSupabasePlan(planId, monthlyPriceId, yearlyPriceId, productId) {
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
      stripe_product_id: productId,
      stripe_price_id: monthlyPriceId,
      stripe_price_id_yearly: yearlyPriceId,
      stripe_lookup_key_monthly: CATALOG.find((c) => c.planId === planId).monthly.lookup_key,
      stripe_lookup_key_yearly: CATALOG.find((c) => c.planId === planId).yearly.lookup_key,
      updated_at: new Date().toISOString(),
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Supabase update ${planId}: ${response.status} ${text}`);
  }
  console.log(`✓ DB ${planId} price ids synced`);
}

async function main() {
  for (const entry of CATALOG) {
    const product = await findOrCreateProduct(entry.productName, entry.planId);
    const monthly = await ensurePrice(product.id, entry.monthly, 'monthly');
    const yearly = await ensurePrice(product.id, entry.yearly, 'yearly');
    await updateSupabasePlan(entry.planId, monthly.id, yearly.id, product.id);
  }
  console.log('\nDone. 8 subscription prices ready.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
