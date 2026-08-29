import type { ProductAnalysisDraft } from '@/components/ai/product-analysis-confirmation-modal';
import type { ProductImageAnalysis } from '@/types/ai-product';
import { formatDecimalForInput } from '@/types/quote';
import type { ImportedProductRow } from '@/lib/products/spreadsheet-import';

export function mapAnalysisToDraft(analysis: ProductImageAnalysis): ProductAnalysisDraft {
  const vatRate = analysis.vat;
  const priceTtc = analysis.price_ttc;
  const priceHt =
    analysis.price_ht ??
    (priceTtc !== null && vatRate !== null ? computePriceHtFromTtc(priceTtc, vatRate) : null);

  return {
    title: analysis.title ?? '',
    brand: analysis.brand ?? '',
    model: analysis.model ?? '',
    reference: analysis.reference ?? '',
    description: analysis.description ?? '',
    unitPriceHt: priceHt === null ? '' : formatDecimalForInput(priceHt),
    unitPriceTtc: priceTtc === null ? '' : formatDecimalForInput(priceTtc),
    vatRate: vatRate === null || vatRate === undefined ? '' : formatDecimalForInput(vatRate),
    currency: analysis.currency || 'EUR',
    unit: analysis.unit || 'pièce',
    quantity: formatDecimalForInput(Math.max(1, analysis.quantity || 1)),
    confidence: Math.max(0, Math.min(1, analysis.confidence || 0)),
    sku: analysis.sku ?? '',
    ean: analysis.ean ?? '',
    sourceUrl: analysis.source_url ?? '',
  };
}

export function mapImportRowToDraft(row: ImportedProductRow): ProductAnalysisDraft {
  return {
    title: row.name,
    brand: row.brand,
    model: '',
    reference: row.reference,
    description: row.description,
    unitPriceHt: row.unitPriceHt === null ? '' : formatDecimalForInput(row.unitPriceHt),
    unitPriceTtc: row.unitPriceTtc === null ? '' : formatDecimalForInput(row.unitPriceTtc),
    vatRate: row.vatRate === null ? '' : formatDecimalForInput(row.vatRate),
    currency: 'EUR',
    unit: row.unit || 'pièce',
    quantity: formatDecimalForInput(row.quantity),
    confidence: 1,
    sku: row.sku,
    ean: row.ean,
    sourceUrl: '',
  };
}

function computePriceHtFromTtc(priceTtc: number, vatRate: number): number {
  const divider = 1 + Math.max(vatRate, 0) / 100;
  return divider > 0 ? priceTtc / divider : priceTtc;
}
