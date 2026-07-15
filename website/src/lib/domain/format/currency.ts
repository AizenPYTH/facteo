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

export function formatVatRate(rate: number, locale = 'fr-FR'): string {
  return `${new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(rate)}\u00a0%`;
}
