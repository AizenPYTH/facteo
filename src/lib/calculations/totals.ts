export function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Ramène une entrée non finie à zéro.
 *
 * `parseDecimalInput` renvoie `NaN` sur une saisie vide ou non numérique. Sans
 * ce garde-fou, un seul champ mal rempli contamine le total de la ligne, puis
 * celui du document, et le montant `NaN` part en base. La validation refuse
 * déjà ces saisies : ceci couvre les autres chemins — reprise d'un document
 * ancien, import, duplication.
 */
function finiteOrZero(value: number): number {
  return Number.isFinite(value) ? value : 0;
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
  const safeQuantity = finiteOrZero(quantity);
  const safeUnitPrice = finiteOrZero(unitPrice);
  const safeVatRate = finiteOrZero(vatRate);
  const safeDiscount = finiteOrZero(discountPercent);

  const grossHt = roundCurrency(safeQuantity * safeUnitPrice);
  const discountAmount = roundCurrency(grossHt * (Math.min(100, Math.max(0, safeDiscount)) / 100));
  const lineTotalHt = roundCurrency(grossHt - discountAmount);
  const lineVat = roundCurrency(lineTotalHt * (safeVatRate / 100));
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
