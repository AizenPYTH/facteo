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

const MENTIONS: Record<VatRegime, string> = {
  standard:
    'TVA acquittée sur les débits. En cas de retard de paiement, des pénalités seront exigibles.',
  eu_reverse_charge:
    'Autoliquidation — Article 196 de la Directive 2006/112/CE. TVA due par le preneur.',
  export_outside_eu:
    'Exonération de TVA — exportation hors Union européenne (CGI, art. 262 I).',
  exempt:
    'TVA non applicable — article 293 B du CGI (franchise en base) ou exonération applicable.',
};

export function getLegalMentionForRegime(regime: VatRegime | string | null | undefined): string {
  if (!regime || !(regime in MENTIONS)) {
    return MENTIONS.standard;
  }
  return MENTIONS[regime as VatRegime];
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
