/**
 * Helpers d’affichage prix — source = catalogue partagé (mêmes offres que le site).
 * @deprecated Préférer `formatPriceHt` / `SUBSCRIPTION_PLANS` depuis `@/constants/subscription-plans`.
 */

import {
  formatPriceHt,
  getCatalogPlanById,
  SUBSCRIPTION_PRICING_COPY,
} from '@/constants/subscription-plans';

const basique = getCatalogPlanById('basique');

/** @deprecated Ancien Premium ; équivalent marketing Basique. */
export const PREMIUM_PRICE_EUR = basique?.priceMonthlyHt ?? 6.82;

export const PREMIUM_PRICE_LABEL = formatPriceHt(PREMIUM_PRICE_EUR).replace(' HT', '');

export const PREMIUM_PRICE_PERIOD_LABEL = ` ${SUBSCRIPTION_PRICING_COPY.perMonthLabel}`;

export const PREMIUM_PRICE_DISPLAY = `${PREMIUM_PRICE_LABEL}${PREMIUM_PRICE_PERIOD_LABEL}`;
