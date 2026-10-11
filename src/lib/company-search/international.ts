import { CompanySearchError } from '@/lib/company-search/errors';
import type { CompanySearchOptions } from '@/lib/company-search/types';

/**
 * Recherche d'entreprises hors de France, sans clé ni compte :
 * - n° de TVA intracommunautaire → VIES (Commission européenne) : validité,
 *   nom et adresse quand l'État membre les communique ;
 * - nom → GLEIF (registre mondial des LEI) : entreprises du monde entier.
 */

const VIES_URL = 'https://ec.europa.eu/taxation_customs/vies/rest-api/ms';
const GLEIF_URL = 'https://api.gleif.org/api/v1/lei-records';

/** Préfixes TVA de l'UE (la Grèce utilise EL, l'Irlande du Nord XI). */
export const EU_VAT_COUNTRIES: Record<string, string> = {
  AT: 'Autriche',
  BE: 'Belgique',
  BG: 'Bulgarie',
  CY: 'Chypre',
  CZ: 'Tchéquie',
  DE: 'Allemagne',
  DK: 'Danemark',
  EE: 'Estonie',
  EL: 'Grèce',
  ES: 'Espagne',
  FI: 'Finlande',
  FR: 'France',
  HR: 'Croatie',
  HU: 'Hongrie',
  IE: 'Irlande',
  IT: 'Italie',
  LT: 'Lituanie',
  LU: 'Luxembourg',
  LV: 'Lettonie',
  MT: 'Malte',
  NL: 'Pays-Bas',
  PL: 'Pologne',
  PT: 'Portugal',
  RO: 'Roumanie',
  SE: 'Suède',
  SI: 'Slovénie',
  SK: 'Slovaquie',
  XI: 'Irlande du Nord',
};

/** Pays courants hors UE ; les autres passent par Intl, sinon leur code. */
const OTHER_COUNTRIES: Record<string, string> = {
  GB: 'Royaume-Uni',
  GR: 'Grèce',
  CH: 'Suisse',
  NO: 'Norvège',
  IS: 'Islande',
  LI: 'Liechtenstein',
  MC: 'Monaco',
  AD: 'Andorre',
  US: 'États-Unis',
  CA: 'Canada',
  MX: 'Mexique',
  BR: 'Brésil',
  MA: 'Maroc',
  DZ: 'Algérie',
  TN: 'Tunisie',
  SN: 'Sénégal',
  CI: 'Côte d’Ivoire',
  CM: 'Cameroun',
  TR: 'Turquie',
  AE: 'Émirats arabes unis',
  SA: 'Arabie saoudite',
  IL: 'Israël',
  CN: 'Chine',
  HK: 'Hong Kong',
  JP: 'Japon',
  KR: 'Corée du Sud',
  IN: 'Inde',
  SG: 'Singapour',
  AU: 'Australie',
  NZ: 'Nouvelle-Zélande',
  ZA: 'Afrique du Sud',
};

export function countryNameFromCode(code: string | null | undefined): string {
  const upper = (code ?? '').trim().toUpperCase();
  if (!upper) return '';
  const known = EU_VAT_COUNTRIES[upper] ?? OTHER_COUNTRIES[upper];
  if (known) return known;
  try {
    const DisplayNames = (Intl as unknown as { DisplayNames?: typeof Intl.DisplayNames }).DisplayNames;
    const name = DisplayNames ? new DisplayNames(['fr'], { type: 'region' }).of(upper) : undefined;
    if (name && name !== upper) return name;
  } catch {
    // Intl incomplet sur certains moteurs : le code reste lisible.
  }
  return upper;
}

export type InternationalCompanyResult = {
  /** Vide quand l'administration ne le communique pas (Allemagne, Espagne…). */
  companyName: string;
  address: string;
  postalCode: string;
  city: string;
  /** Nom du pays en français. */
  country: string;
  countryCode: string;
  /** N° de TVA vérifié auprès de VIES, avec son préfixe pays. */
  vatNumber: string | null;
  source: 'vies' | 'gleif';
};

/**
 * NIPC portugais (numéro d'identification fiscale d'une entreprise) : 9
 * chiffres, le dernier de contrôle (modulo 11). C'est aussi son n° de TVA,
 * précédé de « PT ».
 */
export function isValidNipc(value: string): boolean {
  const digits = value.replace(/\D/g, '');
  if (!/^[1-9]\d{8}$/.test(digits)) return false;
  const sum = digits
    .slice(0, 8)
    .split('')
    .reduce((total, digit, index) => total + Number(digit) * (9 - index), 0);
  const rest = sum % 11;
  const check = rest < 2 ? 0 : 11 - rest;
  return check === Number(digits[8]);
}

/**
 * « be 0403.170.701 » → { country: 'BE', number: '0403170701' }. Un NIPC
 * portugais seul (« 500 100 144 », « NIPC 500100144 ») vaut « PT500100144 ».
 * `null` : pas un n° de TVA UE.
 */
export function parseEuVatNumber(input: string): { country: string; number: string } | null {
  const compact = input.replace(/[\s.\-_/]/g, '').toUpperCase().replace(/^(NIPC|NIF)/, '');
  if (/^\d{9}$/.test(compact) && isValidNipc(compact)) {
    return { country: 'PT', number: compact };
  }
  const match = compact.match(/^([A-Z]{2})([A-Z0-9]{2,13})$/);
  if (!match || !/\d/.test(match[2])) return null;
  const country = match[1] === 'GR' ? 'EL' : match[1];
  if (!EU_VAT_COUNTRIES[country]) return null;
  return { country, number: match[2] };
}

function clean(value: unknown): string {
  if (typeof value !== 'string') return '';
  const trimmed = value.replace(/\s+/g, ' ').trim();
  // VIES écrit « --- » quand l'État membre ne communique pas l'information.
  return /^-+$/.test(trimmed) ? '' : trimmed;
}

/**
 * Adresse VIES en texte libre, sur une ou plusieurs lignes :
 * « Grote Markt 1\n1000 Brussel », « VIA ROMA 1\n00144 ROMA RM ».
 * La dernière ligne qui commence par un code postal donne code postal et ville.
 */
export function splitViesAddress(raw: string): { address: string; postalCode: string; city: string } {
  const lines = raw
    .split(/\r?\n|,(?=\s*(?:[A-Z]{1,3}-)?\d)/)
    .map((line) => clean(line))
    .filter(Boolean);
  if (lines.length === 0) return { address: '', postalCode: '', city: '' };

  for (let index = lines.length - 1; index >= 0; index -= 1) {
    const match = lines[index].match(/^((?:[A-Z]{1,3}-)?\d[\d -]*[A-Z]{0,2})\s+(\D.*)$/);
    if (match) {
      return {
        address: lines.filter((_, line) => line !== index).join(', '),
        postalCode: match[1].trim(),
        city: match[2].trim(),
      };
    }
  }

  if (lines.length === 1) return { address: lines[0], postalCode: '', city: '' };
  return { address: lines.slice(0, -1).join(', '), postalCode: '', city: lines[lines.length - 1] };
}

async function fetchJson(url: string, options: CompanySearchOptions, accept = 'application/json') {
  let response: Response;
  try {
    response = await fetch(url, { headers: { Accept: accept }, signal: options.signal });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw error;
    throw new CompanySearchError('API_UNAVAILABLE');
  }
  if (response.status === 404) return null;
  if (!response.ok) throw new CompanySearchError('API_UNAVAILABLE');
  try {
    return (await response.json()) as unknown;
  } catch {
    throw new CompanySearchError('INVALID_RESPONSE');
  }
}

/** Vérifie un n° de TVA intracommunautaire et récupère l'entreprise (VIES). */
export async function lookupEuVatNumber(
  input: string,
  options: CompanySearchOptions = {},
): Promise<InternationalCompanyResult> {
  const vat = parseEuVatNumber(input);
  if (!vat) throw new CompanySearchError('INVALID_REGISTRATION_NUMBER');

  const data = await fetchJson(`${VIES_URL}/${vat.country}/vat/${vat.number}`, options);
  if (!data || typeof data !== 'object') throw new CompanySearchError('INVALID_RESPONSE');
  const body = data as Record<string, unknown>;

  const userError = typeof body.userError === 'string' ? body.userError : '';
  if (userError && userError !== 'VALID' && userError !== 'INVALID') {
    // MS_UNAVAILABLE, TIMEOUT, MS_MAX_CONCURRENT_REQ… : le registre du pays ne répond pas.
    throw new CompanySearchError(userError === 'INVALID_INPUT' ? 'INVALID_REGISTRATION_NUMBER' : 'API_UNAVAILABLE');
  }
  if (body.isValid !== true) throw new CompanySearchError('COMPANY_NOT_FOUND');

  const address = splitViesAddress(typeof body.address === 'string' ? body.address : '');
  // L'Irlande du Nord (XI) dépend du Royaume-Uni pour l'adresse postale.
  const countryCode = vat.country === 'EL' ? 'GR' : vat.country === 'XI' ? 'GB' : vat.country;

  return {
    companyName: clean(body.name),
    ...address,
    country: countryNameFromCode(countryCode),
    countryCode,
    vatNumber: `${vat.country}${vat.number}`,
    source: 'vies',
  };
}

type GleifAddress = {
  addressLines?: unknown;
  city?: unknown;
  postalCode?: unknown;
  country?: unknown;
};

function mapGleifRecord(record: unknown): InternationalCompanyResult | null {
  const entity = (record as { attributes?: { entity?: Record<string, unknown> } })?.attributes?.entity;
  if (!entity) return null;
  const name = clean((entity.legalName as { name?: unknown } | undefined)?.name);
  if (!name) return null;
  const address = (entity.legalAddress ?? {}) as GleifAddress;
  const lines = Array.isArray(address.addressLines) ? address.addressLines.map(clean).filter(Boolean) : [];
  const countryCode = clean(address.country).toUpperCase();

  return {
    companyName: name,
    address: lines.join(', '),
    postalCode: clean(address.postalCode),
    city: clean(address.city),
    country: countryNameFromCode(countryCode),
    countryCode,
    vatNumber: null,
    source: 'gleif',
  };
}

/** Entreprises du monde entier par leur nom (GLEIF), les actives d'abord. */
export async function searchCompaniesByName(
  query: string,
  options: CompanySearchOptions = {},
): Promise<InternationalCompanyResult[]> {
  const text = query.trim();
  if (text.length < 2) return [];

  const params = [
    `filter%5Bfulltext%5D=${encodeURIComponent(text)}`,
    'filter%5Bentity.status%5D=ACTIVE',
    'page%5Bsize%5D=15',
  ].join('&');
  const data = await fetchJson(`${GLEIF_URL}?${params}`, options, 'application/vnd.api+json');
  const records = (data as { data?: unknown } | null)?.data;
  if (!Array.isArray(records)) {
    if (data === null) return [];
    throw new CompanySearchError('INVALID_RESPONSE');
  }

  const seen = new Set<string>();
  return records
    .map(mapGleifRecord)
    .filter((entry): entry is InternationalCompanyResult => {
      if (!entry) return false;
      const key = `${entry.companyName}|${entry.city}|${entry.countryCode}`.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}
