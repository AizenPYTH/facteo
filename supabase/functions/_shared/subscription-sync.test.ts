import {
  isPaidPlanId,
  normalizeRequestedPlanId,
  resolvePlanId,
  resolveStripePriceId,
} from './subscription-plan-id.ts';

Deno.test('normalizeRequestedPlanId accepte le catalogue payant et premium legacy', () => {
  if (normalizeRequestedPlanId('basique') !== 'basique') throw new Error('basique');
  if (normalizeRequestedPlanId('Standard') !== 'standard') throw new Error('standard');
  if (normalizeRequestedPlanId('premium') !== 'pro') throw new Error('premium→pro');
  if (normalizeRequestedPlanId('micro') !== null) throw new Error('micro unpaid');
  if (normalizeRequestedPlanId('') !== null) throw new Error('empty');
});

Deno.test('resolvePlanId mappe metadata et statuts vers le catalogue', () => {
  if (resolvePlanId('basique') !== 'basique') throw new Error('basique');
  if (resolvePlanId('standard') !== 'standard') throw new Error('standard');
  if (resolvePlanId('premium', 'active') !== 'pro') throw new Error('premium');
  if (resolvePlanId('free') !== 'micro') throw new Error('free');
  if (resolvePlanId(undefined, 'active') !== 'pro') throw new Error('legacy paid');
  if (resolvePlanId(undefined, 'canceled') !== 'micro') throw new Error('canceled');
});

Deno.test('isPaidPlanId ne retient que Basique / Standard / Pro', () => {
  if (!isPaidPlanId('basique')) throw new Error('basique');
  if (isPaidPlanId('micro')) throw new Error('micro');
  if (isPaidPlanId('premium')) throw new Error('premium');
});

Deno.test('resolveStripePriceId préfère la colonne plan puis l’env du bon palier', () => {
  const fromColumn = resolveStripePriceId('price_basique_db', 'basique', () => 'price_env');
  if (fromColumn !== 'price_basique_db') throw new Error('column first');

  const env = new Map([
    ['STRIPE_BASIQUE_PRICE_ID', 'price_basique'],
    ['STRIPE_PREMIUM_PRICE_ID', 'price_legacy_pro'],
  ]);
  const readEnv = (key: string) => env.get(key);

  if (resolveStripePriceId(null, 'basique', readEnv) !== 'price_basique') {
    throw new Error('basique env');
  }
  if (resolveStripePriceId(null, 'pro', readEnv) !== 'price_legacy_pro') {
    throw new Error('pro fallback premium');
  }
  if (resolveStripePriceId(null, 'standard', readEnv) !== null) {
    throw new Error('standard must not use premium price');
  }
});
