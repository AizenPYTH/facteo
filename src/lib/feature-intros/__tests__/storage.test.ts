/**
 * Feature intro storage unit tests.
 * Run: npx tsx --test src/lib/feature-intros/__tests__/storage.test.ts
 */
import assert from 'node:assert/strict';
import { describe, it, beforeEach } from 'node:test';

import {
  FEATURE_INTRO_IDS,
  featureIntroStorageKey,
  isFeatureIntroId,
} from '../types';
import { getFeatureIntroConfig, listFeatureIntroConfigs } from '../config';

describe('feature intro types', () => {
  it('keeps the six product intros and the legacy payments intro', () => {
    assert.deepEqual([...FEATURE_INTRO_IDS].sort(), [
      'ai',
      'invoice',
      'payments',
      'quote',
      'scanner',
      'statistics',
      'templates',
    ]);
  });

  it('builds storage keys as feature_intro_<id>_seen', () => {
    assert.equal(featureIntroStorageKey('scanner'), 'feature_intro_scanner_seen');
    assert.equal(featureIntroStorageKey('invoice'), 'feature_intro_invoice_seen');
  });

  it('validates ids', () => {
    assert.equal(isFeatureIntroId('scanner'), true);
    assert.equal(isFeatureIntroId('nope'), false);
  });
});

describe('feature intro config', () => {
  it('exposes the six product intros without surfacing payments as a seventh', () => {
    const configs = listFeatureIntroConfigs();
    assert.deepEqual(
      configs.map((config) => config.id).sort(),
      ['ai', 'invoice', 'quote', 'scanner', 'statistics', 'templates'],
    );

    for (const config of configs) {
      assert.equal(config.steps.length, 3, config.id);
      const total = config.steps.reduce((sum, step) => sum + step.durationMs, 0);
      assert.ok(total >= 2800 && total <= 4000, `${config.id} total ${total}`);
      assert.ok(config.ctaLabel.length > 0);
      assert.ok(config.title.length > 0);
    }
  });

  it('returns config by id', () => {
    assert.equal(getFeatureIntroConfig('payments').id, 'payments');
  });
});
