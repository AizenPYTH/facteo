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
