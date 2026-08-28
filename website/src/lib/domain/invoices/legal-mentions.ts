import type { VatRegime } from '@/types/invoice';

export type { VatRegime };

export const VAT_REGIME_OPTIONS: Array<{ value: VatRegime; label: string; hint: string }> = [
  {
    value: 'standard',
    label: 'TVA française standard',
    hint: 'Client en France — TVA applicable',
  },
  {
    value: 'eu_reverse_charge',
    label: 'Autoliquidation UE (B2B)',
    hint: 'Client professionnel dans l’UE avec N° TVA',
  },
  {
    value: 'export_outside_eu',
    label: 'Export hors UE',
    hint: 'Client hors Union européenne',
  },
  {
    value: 'exempt',
    label: 'TVA exonérée',
    hint: 'Opération exonérée (franchise ou autre)',
  },
];

const VAT_MENTIONS: Record<VatRegime, string> = {
  standard: 'TVA acquittée sur les débits.',
  eu_reverse_charge:
    'Autoliquidation — Article 196 de la Directive 2006/112/CE. TVA due par le preneur.',
  export_outside_eu:
    'Exonération de TVA — exportation hors Union européenne (CGI, art. 262 I).',
  exempt:
    'TVA non applicable — article 293 B du CGI (franchise en base) ou exonération applicable.',
};

/** Mentions Code de commerce L441-10 — obligatoires sur toute facture. */
export const MANDATORY_PAYMENT_LEGAL_MENTIONS = [
  'Pas d’escompte pour paiement anticipé.',
  'En cas de retard de paiement, application d’un taux d’intérêt égal à trois fois le taux d’intérêt légal.',
  'Indemnité forfaitaire pour frais de recouvrement due au créancier : 40 €.',
] as const;

export function getMandatoryPaymentLegalBlock(): string {
  return MANDATORY_PAYMENT_LEGAL_MENTIONS.join(' ');
}

export function getLegalMentionForRegime(regime: VatRegime | string | null | undefined): string {
  if (!regime || !(regime in VAT_MENTIONS)) {
    return VAT_MENTIONS.standard;
  }
  return VAT_MENTIONS[regime as VatRegime];
}

export function buildInvoiceLegalFooter(input: {
  vatRegime?: VatRegime | string | null;
  customFooter?: string | null;
  includePaymentMentions?: boolean;
}): string {
  const custom = input.customFooter?.trim();
  const vat = getLegalMentionForRegime(input.vatRegime);
  const payment = input.includePaymentMentions ? getMandatoryPaymentLegalBlock() : '';
  return [custom, vat, payment].filter(Boolean).join(' ');
}

export function suggestVatRegime(input: {
  sellerCountry?: string | null;
  clientCountry?: string | null;
  clientVatNumber?: string | null;
}): VatRegime {
  const seller = normalizeCountry(input.sellerCountry) || 'france';
  const client = normalizeCountry(input.clientCountry) || seller;

  if (seller === 'france' && client === 'france') {
    return 'standard';
  }

  const eu = isEuCountry(client);
  if (seller === 'france' && eu && client !== 'france' && input.clientVatNumber?.trim()) {
    return 'eu_reverse_charge';
  }

  if (seller === 'france' && !eu) {
    return 'export_outside_eu';
  }

  return 'standard';
}

function normalizeCountry(value?: string | null): string {
  return (value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

const EU_COUNTRIES = new Set([
  'france',
  'allemagne',
  'germany',
  'belgique',
  'belgium',
  'espagne',
  'spain',
  'italie',
  'italy',
  'portugal',
  'pays-bas',
  'netherlands',
  'luxembourg',
  'irlande',
  'ireland',
  'autriche',
  'austria',
  'suede',
  'sweden',
  'danemark',
  'denmark',
  'finlande',
  'finland',
  'grece',
  'greece',
  'pologne',
  'poland',
  'roumanie',
  'romania',
  'hongrie',
  'hungary',
  'tchequie',
  'czech republic',
  'slovaquie',
  'slovakia',
  'slovenie',
  'slovenia',
  'croatie',
  'croatia',
  'bulgarie',
  'bulgaria',
  'estonie',
  'estonia',
  'lettonie',
  'latvia',
  'lituanie',
  'lithuania',
  'malte',
  'malta',
  'chypre',
  'cyprus',
]);

function isEuCountry(normalized: string): boolean {
  return EU_COUNTRIES.has(normalized);
}
