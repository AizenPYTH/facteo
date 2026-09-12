/**
 * Arithmétique monétaire exacte.
 *
 * Les montants eBay arrivent en chaînes décimales ("12.34"). Toute la
 * manipulation se fait en centimes entiers (bigint) : aucun calcul flottant.
 */

export type Money = {
  /** Montant en plus petite unité (centimes pour EUR/USD…), signé. */
  readonly cents: bigint;
  /** Code ISO 4217, ou null si la source ne l'a pas fourni. */
  readonly currency: string | null;
};

export const ZERO: Money = { cents: 0n, currency: null };

/**
 * Convertit une chaîne décimale en centimes, sans passer par un float.
 * Les décimales au-delà du centime sont tronquées vers zéro (jamais arrondies
 * à la hausse : on ne facture pas un centime que la marketplace n'a pas compté).
 * Renvoie null si la chaîne n'est pas un décimal exploitable.
 */
export function parseDecimalToCents(value: unknown): bigint | null {
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return null;
    return parseDecimalToCents(value.toFixed(6));
  }
  if (typeof value !== 'string') return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  const match = /^([+-]?)(\d*)(?:[.,](\d*))?$/.exec(trimmed);
  if (!match) return null;

  const [, sign, wholeRaw, fracRaw] = match;
  const whole = wholeRaw || '';
  const frac = fracRaw ?? '';
  if (!whole && !frac) return null;

  const cents = BigInt(whole || '0') * 100n + BigInt((frac + '00').slice(0, 2) || '0');
  return sign === '-' ? -cents : cents;
}

/** Lit un objet `Amount` eBay ({ value, currency }) en Money. */
export function amountToMoney(amount: unknown): Money {
  if (!amount || typeof amount !== 'object') return ZERO;
  const record = amount as { value?: unknown; currency?: unknown };
  const cents = parseDecimalToCents(record.value);
  const currency =
    typeof record.currency === 'string' && /^[A-Z]{3}$/.test(record.currency.trim().toUpperCase())
      ? record.currency.trim().toUpperCase()
      : null;
  return { cents: cents ?? 0n, currency };
}

export function addMoney(a: Money, b: Money): Money {
  return { cents: a.cents + b.cents, currency: a.currency ?? b.currency };
}

export function sumMoney(values: Money[]): Money {
  return values.reduce(addMoney, ZERO);
}

export function subtractMoney(a: Money, b: Money): Money {
  return { cents: a.cents - b.cents, currency: a.currency ?? b.currency };
}

export function negateMoney(a: Money): Money {
  return { cents: -a.cents, currency: a.currency };
}

export function absMoney(a: Money): Money {
  return { cents: a.cents < 0n ? -a.cents : a.cents, currency: a.currency };
}

/** Rend une chaîne décimale à deux décimales, adaptée à une colonne numeric(14,2). */
export function centsToDecimalString(cents: bigint): string {
  const negative = cents < 0n;
  const abs = negative ? -cents : cents;
  const whole = abs / 100n;
  const frac = abs % 100n;
  return `${negative ? '-' : ''}${whole}.${frac.toString().padStart(2, '0')}`;
}

export function moneyToDecimalString(money: Money): string {
  return centsToDecimalString(money.cents);
}

/**
 * Prix unitaire = total ligne / quantité, en centimes exacts.
 * Renvoie null quand la division n'est pas exacte : l'appelant doit alors
 * facturer la ligne en une seule unité plutôt que d'inventer un arrondi.
 */
export function exactUnitPriceCents(totalCents: bigint, quantity: number): bigint | null {
  if (!Number.isInteger(quantity) || quantity <= 0) return null;
  const q = BigInt(quantity);
  if (totalCents % q !== 0n) return null;
  return totalCents / q;
}
