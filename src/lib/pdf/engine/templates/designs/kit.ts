import type { TemplateContext } from '@/lib/pdf/engine/templates/context';
import { escapeHtml } from '@/lib/pdf/engine/templates/shared';

/**
 * Données communes des modèles 21 et suivants, déjà triées. Ces modèles ne
 * partagent volontairement aucun bloc visuel : seule la donnée est commune,
 * chaque mise en page la dispose à sa façon.
 */

export type TotalEntry = { label: string; value: string; kind: 'row' | 'ttc' | 'deposit' | 'final' };

/** HT, remise, TVA par taux, TTC, acompte éventuel, puis le montant final. */
export function totalsList(context: TemplateContext, ttcLabel = 'Total TTC', depositLabel = 'Acompte versé'): TotalEntry[] {
  const { totals, labels } = context;
  return [
    ...totals.rows.map((row) => ({ ...row, kind: 'row' as const })),
    { label: ttcLabel, value: totals.totalTtc, kind: 'ttc' as const },
    ...(totals.deposit ? [{ label: depositLabel, value: totals.deposit, kind: 'deposit' as const }] : []),
    { label: labels.amountDue, value: totals.amountDue, kind: 'final' as const },
  ];
}

/** « SIREN 123 456 789 · TVA FR… », dans l'ordre choisi par l'utilisateur. */
export function legalIdsText(context: TemplateContext, separator = ' · '): string {
  return context.issuerLegalIds.map((entry) => `${entry.label} ${entry.value}`).join(separator);
}

/** Coordonnées de paiement, ligne par ligne, sans libellé orphelin. */
export function paymentLines(context: TemplateContext): string[] {
  const { payment } = context;
  return [
    payment.iban ? `IBAN ${payment.iban}` : '',
    payment.bic ? `BIC ${payment.bic}` : '',
    payment.methods.length > 0 ? payment.methods.join(', ') : '',
  ].filter(Boolean);
}

/** Lignes de texte échappées et jointes, rien si la liste est vide. */
export function joinLines(lines: (string | null | undefined)[], separator = '<br/>'): string {
  return lines
    .filter((line): line is string => Boolean(line && line.trim()))
    .map(escapeHtml)
    .join(separator);
}

/** Désignation et détail d'une ligne, échappés. */
export function lineLabel(line: TemplateContext['lines'][number]): { title: string; detail: string } {
  return { title: escapeHtml(line.title), detail: line.description ? escapeHtml(line.description) : '' };
}

/** Quantité et unité : « 2 h », « 1 forfait ». */
export function quantityText(line: TemplateContext['lines'][number]): string {
  return escapeHtml([line.quantity, line.unit].filter(Boolean).join(' '));
}
