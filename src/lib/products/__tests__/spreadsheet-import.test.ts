/**
 * Spreadsheet import unit tests (mirrors website Excel semantics).
 * Run: npx tsx --test src/lib/products/__tests__/spreadsheet-import.test.ts
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as XLSX from 'xlsx';
import {
  buildProductImportTemplateBytes,
  parseProductCsv,
  parseProductSpreadsheet,
  PRODUCT_IMPORT_TEMPLATE_HEADERS,
} from '../spreadsheet-import';

function writeTestXlsx(rows: unknown[][]): Uint8Array {
  const workbook = XLSX.utils.book_new();
  const sheet = XLSX.utils.aoa_to_sheet(rows);
  XLSX.utils.book_append_sheet(workbook, sheet, 'Produits');
  const out = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer | Uint8Array;
  return out instanceof ArrayBuffer ? new Uint8Array(out) : out;
}

describe('PRODUCT_IMPORT_TEMPLATE_HEADERS', () => {
  it('includes EAN and TVA columns', () => {
    assert.ok(PRODUCT_IMPORT_TEMPLATE_HEADERS.includes('Code-barres (EAN)'));
    assert.ok(PRODUCT_IMPORT_TEMPLATE_HEADERS.includes('TVA'));
    assert.ok(PRODUCT_IMPORT_TEMPLATE_HEADERS.includes('Nom'));
  });
});

describe('parseProductCsv', () => {
  it('parses multiple products without mixing fields', () => {
    const csv = [
      'Nom;Référence;Prix HT;TVA;Quantité;Code-barres (EAN)',
      'Produit A;REF-A;10;20;2;111',
      'Produit B;REF-B;25;;1;222',
    ].join('\n');

    const rows = parseProductCsv(csv);
    assert.equal(rows.length, 2);
    assert.equal(rows[0]?.name, 'Produit A');
    assert.equal(rows[0]?.reference, 'REF-A');
    assert.equal(rows[0]?.unitPriceHt, 10);
    assert.equal(rows[0]?.vatRate, 20);
    assert.equal(rows[0]?.ean, '111');
    assert.equal(rows[1]?.name, 'Produit B');
    assert.equal(rows[1]?.reference, 'REF-B');
    assert.equal(rows[1]?.unitPriceHt, 25);
    assert.equal(rows[1]?.vatRate, null, 'missing VAT must stay null');
    assert.equal(rows[1]?.ean, '222');
  });

  it('does not invent VAT when absent', () => {
    const csv = 'Nom,Prix HT\nWidget,12.5\n';
    const rows = parseProductCsv(csv);
    assert.equal(rows.length, 1);
    assert.equal(rows[0]?.vatRate, null);
    assert.equal(rows[0]?.unitPriceHt, 12.5);
  });
});

describe('parseProductSpreadsheet', () => {
  it('reads xlsx template-like workbook', () => {
    const buffer = writeTestXlsx([
      Array.from(PRODUCT_IMPORT_TEMPLATE_HEADERS),
      [
        'Chaise bureau',
        'Ergo',
        'CH-01',
        'Mobilier',
        'Acme',
        '80',
        '',
        '20',
        'pièce',
        '1',
        '',
        '3017620422003',
        'SKU-1',
        '',
        'oui',
        '',
      ],
    ]);
    const rows = parseProductSpreadsheet(buffer);
    assert.equal(rows.length, 1);
    assert.equal(rows[0]?.name, 'Chaise bureau');
    assert.equal(rows[0]?.brand, 'Acme');
    assert.equal(rows[0]?.ean, '3017620422003');
    assert.equal(rows[0]?.sku, 'SKU-1');
    assert.equal(rows[0]?.vatRate, 20);
  });
});

describe('buildProductImportTemplateBytes', () => {
  it('produces a non-empty xlsx', () => {
    const buf = buildProductImportTemplateBytes();
    assert.ok(buf.byteLength > 100);
  });
});
