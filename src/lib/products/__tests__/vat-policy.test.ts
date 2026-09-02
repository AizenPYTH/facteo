/**
 * VAT mapping policy tests.
 * Run: npx tsx --test src/lib/products/__tests__/vat-policy.test.ts
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { mapAnalysisToDraft } from '../map-product-draft';
import type { ProductImageAnalysis } from '@/types/ai-product';

describe('mapAnalysisToDraft VAT policy', () => {
  it('leaves vatRate empty when vat is null (never invents 20%)', () => {
    const analysis: ProductImageAnalysis = {
      title: 'Produit test',
      brand: '',
      model: '',
      reference: 'R1',
      description: '',
      price_ttc: 120,
      price_ht: null,
      vat: null,
      currency: 'EUR',
      unit: 'pièce',
      quantity: 1,
      confidence: 0.8,
    };
    const draft = mapAnalysisToDraft(analysis);
    assert.equal(draft.vatRate, '');
    assert.equal(draft.unitPriceHt, '', 'without VAT, HT must not be invented from TTC');
    assert.equal(draft.unitPriceTtc, '120');
  });

  it('computes HT only when VAT is known', () => {
    const analysis: ProductImageAnalysis = {
      title: 'Produit test',
      brand: 'Brand',
      model: '',
      reference: '',
      description: '',
      price_ttc: 120,
      price_ht: null,
      vat: 20,
      currency: 'EUR',
      unit: 'pièce',
      quantity: 1,
      confidence: 0.9,
      ean: '123',
      sku: 'S1',
    };
    const draft = mapAnalysisToDraft(analysis);
    assert.equal(draft.vatRate, '20');
    assert.equal(draft.ean, '123');
    assert.ok(Number(draft.unitPriceHt.replace(',', '.')) > 99);
  });
});
