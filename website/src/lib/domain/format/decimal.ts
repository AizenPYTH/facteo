function normalize(value: string | null | undefined): string {
  return (value ?? '').trim().replace(/\s/g, '').replace(',', '.');
}

/**
 * Saisie utilisateur → nombre.
 *
 * Renvoie `NaN` pour une saisie vide ou invalide : c'est ce que la **validation**
 * attend (un prix non renseigné n'est pas 0, il est manquant). Pour les
 * **calculs et l'affichage**, utiliser `parseAmountInput`, qui ne produit jamais
 * de NaN.
 */
export function parseDecimalInput(value: string | null | undefined): number {
  return Number.parseFloat(normalize(value));
}

/**
 * Saisie utilisateur → nombre sûr pour les calculs : vide ou invalide vaut 0.
 * Garantit qu'aucun `NaN` ni `Infinity` ne remonte dans les totaux ou le PDF.
 */
export function parseAmountInput(value: string | null | undefined): number {
  const parsed = Number.parseFloat(normalize(value));

  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Taux de TVA. Un champ TVA **vide vaut 0 %** : l'utilisateur n'a pas à écrire
 * « 0 ». Une saisie non numérique reste `NaN` pour que la validation la rejette.
 */
export function parseVatRateInput(value: string | null | undefined): number {
  const normalized = normalize(value);

  if (!normalized) {
    return 0;
  }

  return Number.parseFloat(normalized);
}

/** Taux de TVA sûr pour les calculs : vide ou invalide vaut 0, borné à [0, 100]. */
export function parseVatRateForTotals(value: string | null | undefined): number {
  const parsed = parseVatRateInput(value);

  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return Math.min(100, Math.max(0, parsed));
}
