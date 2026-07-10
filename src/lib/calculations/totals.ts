export function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export type LineTotals = {
  lineTotalHt: number;
  lineVat: number;
  lineTotalTtc: number;
};

export function calculateLineTotals(
  quantity: number,
  unitPrice: number,
  vatRate: number,
): LineTotals {
  const lineTotalHt = roundCurrency(quantity * unitPrice);
  const lineVat = roundCurrency(lineTotalHt * (vatRate / 100));
  const lineTotalTtc = roundCurrency(lineTotalHt + lineVat);

  return { lineTotalHt, lineVat, lineTotalTtc };
}

export type DocumentTotals = {
  subtotalHt: number;
  totalVat: number;
  totalTtc: number;
};

export function calculateDocumentTotals(
  lines: Pick<LineTotals, 'lineTotalHt' | 'lineVat'>[],
): DocumentTotals {
  const subtotalHt = roundCurrency(lines.reduce((sum, line) => sum + line.lineTotalHt, 0));
  const totalVat = roundCurrency(lines.reduce((sum, line) => sum + line.lineVat, 0));
  const totalTtc = roundCurrency(subtotalHt + totalVat);

  return { subtotalHt, totalVat, totalTtc };
}
