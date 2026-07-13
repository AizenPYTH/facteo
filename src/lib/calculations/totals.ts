export function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export type LineTotals = {
  lineTotalHt: number;
  lineVat: number;
  lineTotalTtc: number;
  discountAmount: number;
};

export function calculateLineTotals(
  quantity: number,
  unitPrice: number,
  vatRate: number,
  discountPercent = 0,
): LineTotals {
  const grossHt = roundCurrency(quantity * unitPrice);
  const discountAmount = roundCurrency(grossHt * (Math.min(100, Math.max(0, discountPercent)) / 100));
  const lineTotalHt = roundCurrency(grossHt - discountAmount);
  const lineVat = roundCurrency(lineTotalHt * (vatRate / 100));
  const lineTotalTtc = roundCurrency(lineTotalHt + lineVat);

  return { lineTotalHt, lineVat, lineTotalTtc, discountAmount };
}

export type DocumentTotals = {
  subtotalHt: number;
  totalVat: number;
  totalTtc: number;
  totalDiscount: number;
};

export function calculateDocumentTotals(
  lines: Pick<LineTotals, 'lineTotalHt' | 'lineVat' | 'discountAmount'>[],
): DocumentTotals {
  const subtotalHt = roundCurrency(lines.reduce((sum, line) => sum + line.lineTotalHt, 0));
  const totalVat = roundCurrency(lines.reduce((sum, line) => sum + line.lineVat, 0));
  const totalDiscount = roundCurrency(lines.reduce((sum, line) => sum + line.discountAmount, 0));
  const totalTtc = roundCurrency(subtotalHt + totalVat);

  return { subtotalHt, totalVat, totalTtc, totalDiscount };
}
