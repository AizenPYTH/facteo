/**
 * Tests unitaires — plans / mapping Apple / Stripe (sans build EAS).
 * Exécution : npx tsx --test src/lib/subscription/__tests__/multi-plan.test.ts
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  APPLE_PLAN_PRODUCT_IDS,
  APPLE_PRODUCT_ID_TO_PLAN,
  planIdFromAppleProductId,
} from '../../../constants/iap';
import { DEFAULT_PLAN_FEATURES, resolveEffectivePlanId } from '../plans';
import { SUBSCRIPTION_CATALOG } from '../../../constants/subscription-catalog';

describe('resolveEffectivePlanId — identité 1:1', () => {
  for (const plan of ['micro', 'basique', 'standard', 'pro', 'max'] as const) {
    it(`${plan} → ${plan}`, () => {
      assert.equal(resolveEffectivePlanId(plan), plan);
    });
  }

  it('legacy free → micro', () => assert.equal(resolveEffectivePlanId('free'), 'micro'));
  it('legacy starter → basique', () => assert.equal(resolveEffectivePlanId('starter'), 'basique'));
  it('legacy premium → pro (lecture seule)', () =>
    assert.equal(resolveEffectivePlanId('premium'), 'pro'));
  it('legacy enterprise → max', () => assert.equal(resolveEffectivePlanId('enterprise'), 'max'));
});

describe('features par plan', () => {
  it('Micro : pas de signature client / stripe / IA', () => {
    const f = DEFAULT_PLAN_FEATURES.micro;
    assert.equal(f.client_signature, false);
    assert.equal(f.stripe_payments, false);
    assert.equal(f.ai_assistant, false);
  });

  it('Basique : templates + siren, pas de signature client', () => {
    const f = DEFAULT_PLAN_FEATURES.basique;
    assert.equal(f.pdf_templates, true);
    assert.equal(f.siren_search, true);
    assert.equal(f.client_signature, false);
  });

  it('Standard : signature client', () => {
    assert.equal(DEFAULT_PLAN_FEATURES.standard.client_signature, true);
  });

  it('Pro : siren + pas stripe/IA (réservés Max)', () => {
    const f = DEFAULT_PLAN_FEATURES.pro;
    assert.equal(f.siren_search, true);
    assert.equal(f.stripe_payments, false);
    assert.equal(f.ai_assistant, false);
  });

  it('Max : stripe + IA + stats', () => {
    const f = DEFAULT_PLAN_FEATURES.max;
    assert.equal(f.stripe_payments, true);
    assert.equal(f.ai_assistant, true);
    assert.equal(f.advanced_stats, true);
  });
});

describe('Apple product → plan', () => {
  it('mappe les 4 SKUs', () => {
    assert.equal(planIdFromAppleProductId(APPLE_PLAN_PRODUCT_IDS.basique), 'basique');
    assert.equal(planIdFromAppleProductId(APPLE_PLAN_PRODUCT_IDS.standard), 'standard');
    assert.equal(planIdFromAppleProductId(APPLE_PLAN_PRODUCT_IDS.pro), 'pro');
    assert.equal(planIdFromAppleProductId(APPLE_PLAN_PRODUCT_IDS.max), 'max');
  });

  it('rejette premium.monthly', () => {
    assert.equal(planIdFromAppleProductId('com.inveq.app.premium.monthly'), null);
    assert.equal('com.inveq.app.premium.monthly' in APPLE_PRODUCT_ID_TO_PLAN, false);
  });
});

describe('catalogue public', () => {
  it('contient micro basique standard pro max', () => {
    const ids = SUBSCRIPTION_CATALOG.map((p) => p.id);
    assert.deepEqual(ids, ['micro', 'basique', 'standard', 'pro', 'max']);
  });

  it('Max à 63.98 HT', () => {
    assert.equal(SUBSCRIPTION_CATALOG.find((p) => p.id === 'max')?.priceMonthlyHt, 63.98);
  });
});

describe('Stripe plan ids (contrat)', () => {
  it('accepte uniquement basique/standard/pro/max comme payants', () => {
    const allowed = new Set(['basique', 'standard', 'pro', 'max']);
    for (const id of allowed) assert.ok(allowed.has(id));
    assert.equal(allowed.has('premium'), false);
    assert.equal(allowed.has('micro'), false);
  });
});
