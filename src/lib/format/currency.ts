export function formatCurrency(
  amount: number,
  locale = 'fr-FR',
  currency = 'EUR',
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPriceHT(
  amount: number,
  locale = 'fr-FR',
  currency = 'EUR',
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatPriceTTC(
  amount: number,
  locale = 'fr-FR',
  currency = 'EUR',
): string {
  return formatPriceHT(amount, locale, currency);
}

/** A stable, screen-reader-friendly euro amount without a visual currency symbol. */
export function formatSpokenEuros(amount: number, locale = 'fr-FR'): string {
  const normalizedAmount = Object.is(amount, -0) ? 0 : amount;
  const absoluteCentimes = Math.round(Math.abs(normalizedAmount) * 100);
  const roundedCentimes = absoluteCentimes % 100;
  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: roundedCentimes === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(normalizedAmount);
  const unit = absoluteCentimes === 100 ? 'euro' : 'euros';

  return `${formatted} ${unit}`;
}

export function formatVatRate(rate: number, locale = 'fr-FR'): string {
  return `${new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(rate)}\u00a0%`;
}
