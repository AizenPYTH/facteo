import { roundCurrency } from '@/lib/calculations/totals';
import { hasLineDesignation } from '@/lib/documents/line-mappers';
import { frenchDateInputToIso } from '@/lib/format/date-input';
import { parseDecimalInput, parseVatRateForTotals, parseVatRateInput } from '@/lib/format/decimal';
import { mapInvoiceLineValueToTotals } from '@/lib/invoices/mappers';
import type { InvoiceLineValue } from '@/types/invoice';

/**
 * Lecture « affichage » de l'état de l'assistant : libellés, regroupements,
 * points à corriger. Aucune règle métier nouvelle — les contrôles de ligne
 * reprennent exactement `isInvoiceLineValid`, champ par champ, pour pouvoir
 * dire lequel pose problème.
 */

export const COMPOSER_STEPS = [
  { step: 1, name: 'Client et conditions', short: 'Client' },
  { step: 2, name: 'Lignes', short: 'Lignes' },
  { step: 3, name: 'Modèle et récapitulatif', short: 'Modèle' },
] as const;

export type LineIssue = 'designation' | 'unit' | 'quantity' | 'price' | 'vat' | 'discount';

const LINE_ISSUE_LABELS: Record<LineIssue, string> = {
  designation: 'Désignation',
  unit: 'Unité',
  quantity: 'Quantité',
  price: 'Prix',
  vat: 'TVA',
  discount: 'Remise',
};

const LINE_ISSUE_HINTS: Record<LineIssue, string> = {
  designation: 'une désignation',
  unit: 'une unité',
  quantity: 'une quantité',
  price: 'un prix',
  vat: 'une TVA entre 0 et 100 %',
  discount: 'une remise entre 0 et 100 %',
};

export function getLineIssues(line: InvoiceLineValue): LineIssue[] {
  const issues: LineIssue[] = [];
  const quantity = parseDecimalInput(line.quantity);
  const unitPrice = parseDecimalInput(line.unitPrice);
  const vatRate = parseVatRateInput(line.vatRate);
  const discount = line.discountPercent.trim() ? parseDecimalInput(line.discountPercent) : 0;

  if (!hasLineDesignation(line)) issues.push('designation');
  if (!line.unit.trim()) issues.push('unit');
  if (!(quantity > 0)) issues.push('quantity');
  if (!(unitPrice >= 0)) issues.push('price');
  if (!(vatRate >= 0 && vatRate <= 100)) issues.push('vat');
  if (!(discount >= 0 && discount <= 100)) issues.push('discount');

  return issues;
}

/** « Ajoutez une désignation et un prix. » */
export function describeLineIssues(issues: LineIssue[]): string {
  const parts = issues.map((issue) => LINE_ISSUE_HINTS[issue]);
  if (parts.length === 0) return '';
  const sentence =
    parts.length === 1 ? parts[0] : `${parts.slice(0, -1).join(', ')} et ${parts[parts.length - 1]}`;
  return `Ajoutez ${sentence}.`;
}

export type ComposerIssue = { key: string; label: string; step: 1 | 2 | 3 };

export function collectIssues(input: {
  clientId: string | null;
  lines: InvoiceLineValue[];
  infoValid: boolean;
}): ComposerIssue[] {
  const issues: ComposerIssue[] = [];

  if (!input.clientId) {
    issues.push({ key: 'client', label: 'Client manquant', step: 1 });
  }
  if (!input.infoValid) {
    issues.push({ key: 'dates', label: 'Date d’émission ou délai de paiement', step: 1 });
  }
  if (input.lines.length === 0) {
    issues.push({ key: 'lines', label: 'Aucune ligne', step: 2 });
  }
  input.lines.forEach((line, index) => {
    for (const issue of getLineIssues(line)) {
      issues.push({
        key: `${line.id}-${issue}`,
        label: `${LINE_ISSUE_LABELS[issue]} de la ligne ${index + 1}`,
        step: 2,
      });
    }
  });

  return issues;
}

export type VatGroup = { rate: number; base: number; amount: number };

/** TVA regroupée par taux, du plus fort au plus faible. */
export function groupVatByRate(lines: InvoiceLineValue[]): VatGroup[] {
  const groups = new Map<number, VatGroup>();

  for (const line of lines) {
    const totals = mapInvoiceLineValueToTotals(line);
    const rate = parseVatRateForTotals(line.vatRate);
    const current = groups.get(rate) ?? { rate, base: 0, amount: 0 };
    current.base += totals.lineTotalHt;
    current.amount += totals.lineVat;
    groups.set(rate, current);
  }

  return [...groups.values()]
    .map((group) => ({
      ...group,
      base: roundCurrency(group.base),
      amount: roundCurrency(group.amount),
    }))
    .sort((left, right) => right.rate - left.rate);
}

const SHORT_MONTHS = [
  'janv.',
  'févr.',
  'mars',
  'avr.',
  'mai',
  'juin',
  'juil.',
  'août',
  'sept.',
  'oct.',
  'nov.',
  'déc.',
];

/** « 02/10/2026 » → « 2 oct. 2026 ». `null` si la saisie n'est pas une date. */
export function formatShortFrenchDate(input: string): string | null {
  const iso = frenchDateInputToIso(input);
  if (!iso) return null;
  const date = new Date(iso);
  return `${date.getUTCDate()} ${SHORT_MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

/** Nombre décimal lisible : « 2,5 », « 480 ». */
export function formatQuantity(value: string): string {
  const parsed = parseDecimalInput(value);
  if (!Number.isFinite(parsed)) return value.trim() || '0';
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 3 }).format(parsed);
}
