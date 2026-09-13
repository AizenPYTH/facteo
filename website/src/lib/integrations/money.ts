/**
 * Montants exacts côté application.
 *
 * Les commandes importées portent des chaînes décimales. Toute comparaison ou
 * addition se fait en centimes entiers ; les flottants ne servent qu'au moment
 * de remplir les champs texte du formulaire de facture.
 */

/** "12.34" → 1234. Renvoie null si la chaîne n'est pas un décimal exploitable. */
export function decimalStringToCents(value: string | null | undefined): number | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim().replace(',', '.');
  if (!trimmed) return null;

  const match = /^([+-]?)(\d*)(?:\.(\d*))?$/.exec(trimmed);
  if (!match) return null;

  const [, sign, wholeRaw, fracRaw] = match;
  const whole = wholeRaw || '';
  const frac = fracRaw ?? '';
  if (!whole && !frac) return null;

  const cents = Number(whole || '0') * 100 + Number((frac + '00').slice(0, 2) || '0');
  if (!Number.isSafeInteger(cents)) return null;
  return sign === '-' ? -cents : cents;
}

/** Idem, mais 0 plutôt que null : pour les calculs qui ne doivent jamais casser. */
export function decimalStringToCentsOrZero(value: string | null | undefined): number {
  return decimalStringToCents(value) ?? 0;
}

export function centsToDecimalString(cents: number): string {
  const negative = cents < 0;
  const abs = Math.abs(Math.trunc(cents));
  return `${negative ? '-' : ''}${Math.trunc(abs / 100)}.${String(abs % 100).padStart(2, '0')}`;
}

/** Formatage lisible. La devise vient de la commande, jamais d'un défaut inventé. */
export function formatMoney(value: string | null | undefined, currency: string | null): string {
  const cents = decimalStringToCents(value);
  if (cents === null) return '—';
  const amount = cents / 100;
  try {
    return new Intl.NumberFormat('fr-FR', {
      style: currency ? 'currency' : 'decimal',
      currency: currency ?? undefined,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${centsToDecimalString(cents)}${currency ? ` ${currency}` : ''}`;
  }
}

export function isPositiveAmount(value: string | null | undefined): boolean {
  return (decimalStringToCents(value) ?? 0) > 0;
}

/**
 * Convertit un montant TTC en HT pour un taux donné.
 *
 * Les prix eBay sont affichés TTC : la facture eBay du 11 septembre 2026
 * montre « Prix de l'objet 29,00 EUR », « Taux de TVA 20 % », « Montant de la
 * TVA 4,83 EUR » et un HT de 24,17 EUR. Facturer 29,00 en HT puis ajouter 20 %
 * produirait 34,80 EUR, soit une facture qui ne correspond ni à ce que
 * l'acheteur a payé, ni à ce qu'eBay a déclaré.
 *
 * Le calcul se fait en centimes entiers, avec arrondi au centime le plus
 * proche (moitié vers le haut), comme le fait eBay.
 */
export function centsExcludingVat(ttcCents: number, vatRatePercent: number): number {
  if (!Number.isFinite(vatRatePercent) || vatRatePercent <= 0) return ttcCents;
  const divisor = 1 + vatRatePercent / 100;
  const negative = ttcCents < 0;
  const value = Math.abs(ttcCents) / divisor;
  const rounded = Math.round(value);
  return negative ? -rounded : rounded;
}

/** Idem, en chaînes décimales. Renvoie la valeur d'origine si elle est illisible. */
export function decimalExcludingVat(ttc: string, vatRate: string): string {
  const cents = decimalStringToCents(ttc);
  if (cents === null) return ttc;
  const rate = Number.parseFloat((vatRate || '').replace(',', '.'));
  return centsToDecimalString(centsExcludingVat(cents, Number.isFinite(rate) ? rate : 0));
}

/** Reconstruit le TTC d'une ligne HT, pour comparer au total eBay. */
export function centsIncludingVat(htCents: number, vatRatePercent: number): number {
  if (!Number.isFinite(vatRatePercent) || vatRatePercent <= 0) return htCents;
  const negative = htCents < 0;
  const value = (Math.abs(htCents) * (1 + vatRatePercent / 100));
  const rounded = Math.round(value);
  return negative ? -rounded : rounded;
}
