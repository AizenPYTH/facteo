/**
 * Options de présentation d'une facture, choisies à la création.
 * Stockées dans `invoices.pdf_options` (jsonb, nullable).
 */

export type IssuerLegalId = 'siren' | 'siret' | 'vat';

export const ISSUER_LEGAL_IDS: IssuerLegalId[] = ['siren', 'siret', 'vat'];

export const ISSUER_LEGAL_ID_LABELS: Record<IssuerLegalId, string> = {
  siren: 'SIREN',
  siret: 'SIRET',
  vat: 'N° TVA',
};

/** Ce qu'affichaient les factures avant le choix : SIRET et TVA. */
export const DEFAULT_ISSUER_LEGAL_IDS: IssuerLegalId[] = ['siret', 'vat'];

export const DEFAULT_INVOICE_TITLE = 'Facture';

export const INVOICE_TITLE_SUGGESTIONS = [
  'Facture',
  'Facture d’acompte',
  'Facture de solde',
  'Note d’honoraires',
];

/** Couleur du cachet « Facture payée ». `auto` : couleur du modèle choisi. */
export type StampColor = 'auto' | 'green' | 'red' | 'blue' | 'black';

export const STAMP_COLORS: StampColor[] = ['auto', 'green', 'red', 'blue', 'black'];

export const STAMP_COLOR_VALUES: Record<Exclude<StampColor, 'auto'>, string> = {
  green: '#0B7A4B',
  red: '#C0392B',
  blue: '#1F4FD1',
  black: '#1A1A22',
};

export const STAMP_COLOR_LABELS: Record<StampColor, string> = {
  auto: 'Du modèle',
  green: 'Vert',
  red: 'Rouge',
  blue: 'Bleu',
  black: 'Noir',
};

/** Emplacement du cachet. `auto` : près des totaux, à l'endroit prévu pour le modèle. */
export type StampPosition = 'auto' | 'top' | 'bottom' | 'none';

export const STAMP_POSITIONS: StampPosition[] = ['auto', 'top', 'bottom', 'none'];

export const STAMP_POSITION_LABELS: Record<StampPosition, string> = {
  auto: 'Près des totaux',
  top: 'En haut',
  bottom: 'En bas',
  none: 'Sans tampon',
};

/**
 * Emplacement des SIREN / SIRET / TVA sur la facture : celui du modèle, en
 * haut, en bas, ou un point choisi à la main (fractions de la page A4, coin
 * supérieur gauche du bloc).
 */
export type LegalIdsPlacement = 'auto' | 'top' | 'bottom' | { x: number; y: number };

export const LEGAL_IDS_PLACEMENT_LABELS = {
  auto: 'Selon le modèle',
  top: 'En haut',
  bottom: 'En bas',
  free: 'Où je veux',
} as const;

function clampUnit(value: number): number {
  return Math.min(1, Math.max(0, Math.round(value * 10000) / 10000));
}

export function parseLegalIdsPlacement(value: unknown): LegalIdsPlacement {
  if (value === 'top' || value === 'bottom') return value;
  if (value && typeof value === 'object') {
    const { x, y } = value as Record<string, unknown>;
    if (typeof x === 'number' && typeof y === 'number' && Number.isFinite(x) && Number.isFinite(y)) {
      return { x: clampUnit(x), y: clampUnit(y) };
    }
  }
  return 'auto';
}

function normalizeCountry(country: string | null | undefined): string {
  return (country ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[’']/g, ' ')
    .toLowerCase()
    .trim();
}

/** France métropolitaine et outre-mer (pays vide : France, comme avant). */
const FRENCH_COUNTRIES = [
  '',
  'france',
  'fr',
  'republique francaise',
  'guadeloupe',
  'martinique',
  'guyane',
  'guyane francaise',
  'la reunion',
  'reunion',
  'mayotte',
];

export function isFrenchCountry(country: string | null | undefined): boolean {
  return FRENCH_COUNTRIES.includes(normalizeCountry(country));
}

/**
 * Numéro qui identifie une entreprise dans son pays, et comment le retrouver
 * dans son n° de TVA quand il en fait partie (Portugal : PT + NIPC…).
 */
type NationalIdRule = {
  names: string[];
  label: string;
  fromVat?: (vat: string) => string | null;
};

function vatDigits(prefix: string, pattern: RegExp, format?: (digits: string) => string) {
  return (vat: string) => {
    if (!vat.startsWith(prefix)) return null;
    const rest = vat.slice(prefix.length);
    if (!pattern.test(rest)) return null;
    return format ? format(rest) : rest;
  };
}

const NATIONAL_ID_RULES: NationalIdRule[] = [
  { names: ['portugal', 'pt'], label: 'NIPC', fromVat: vatDigits('PT', /^\d{9}$/) },
  {
    names: ['belgique', 'belgium', 'belgie', 'be'],
    label: 'N° d’entreprise',
    fromVat: vatDigits('BE', /^[01]\d{9}$/, (d) => `${d.slice(0, 4)}.${d.slice(4, 7)}.${d.slice(7)}`),
  },
  { names: ['espagne', 'spain', 'espana', 'es'], label: 'NIF', fromVat: vatDigits('ES', /^[A-Z0-9]\d{7}[A-Z0-9]$/) },
  { names: ['italie', 'italy', 'italia', 'it'], label: 'Partita IVA', fromVat: vatDigits('IT', /^\d{11}$/) },
  { names: ['pologne', 'poland', 'polska', 'pl'], label: 'NIP', fromVat: vatDigits('PL', /^\d{10}$/) },
  { names: ['tchequie', 'republique tcheque', 'czechia', 'czech republic', 'cz'], label: 'IČO', fromVat: vatDigits('CZ', /^\d{8}$/) },
  { names: ['hongrie', 'hungary', 'magyarorszag', 'hu'], label: 'Adószám', fromVat: vatDigits('HU', /^\d{8}$/) },
  { names: ['roumanie', 'romania', 'ro'], label: 'CUI', fromVat: vatDigits('RO', /^\d{2,10}$/) },
  { names: ['bulgarie', 'bulgaria', 'bg'], label: 'EIK', fromVat: vatDigits('BG', /^\d{9,10}$/) },
  { names: ['croatie', 'croatia', 'hrvatska', 'hr'], label: 'OIB', fromVat: vatDigits('HR', /^\d{11}$/) },
  { names: ['slovenie', 'slovenia', 'slovenija', 'si'], label: 'Davčna št.', fromVat: vatDigits('SI', /^\d{8}$/) },
  { names: ['danemark', 'denmark', 'danmark', 'dk'], label: 'CVR', fromVat: vatDigits('DK', /^\d{8}$/) },
  {
    names: ['finlande', 'finland', 'suomi', 'fi'],
    label: 'Y-tunnus',
    fromVat: vatDigits('FI', /^\d{8}$/, (d) => `${d.slice(0, 7)}-${d.slice(7)}`),
  },
  {
    names: ['suede', 'sweden', 'sverige', 'se'],
    label: 'Org.nr',
    fromVat: vatDigits('SE', /^\d{10}01$/, (d) => `${d.slice(0, 6)}-${d.slice(6, 10)}`),
  },
  { names: ['lettonie', 'latvia', 'latvija', 'lv'], label: 'Reģ. Nr.', fromVat: vatDigits('LV', /^\d{11}$/) },
  { names: ['grece', 'greece', 'ellada', 'gr', 'el'], label: 'AFM', fromVat: vatDigits('EL', /^\d{9}$/) },
  { names: ['chypre', 'cyprus', 'cy'], label: 'TIC', fromVat: vatDigits('CY', /^\d{8}[A-Z]$/) },
  { names: ['luxembourg', 'lu'], label: 'RCS' },
  { names: ['allemagne', 'germany', 'deutschland', 'de'], label: 'Handelsregister' },
  { names: ['autriche', 'austria', 'osterreich', 'at'], label: 'Firmenbuch' },
  { names: ['pays-bas', 'pays bas', 'netherlands', 'nederland', 'nl'], label: 'KvK' },
  { names: ['irlande', 'ireland', 'ie'], label: 'CRO' },
  { names: ['estonie', 'estonia', 'eesti', 'ee'], label: 'Registrikood' },
  { names: ['lituanie', 'lithuania', 'lietuva', 'lt'], label: 'Įmonės kodas' },
  { names: ['slovaquie', 'slovakia', 'slovensko', 'sk'], label: 'IČO' },
  { names: ['malte', 'malta', 'mt'], label: 'Company No.' },
  { names: ['suisse', 'switzerland', 'schweiz', 'svizzera', 'ch'], label: 'IDE' },
  { names: ['royaume-uni', 'royaume uni', 'united kingdom', 'uk', 'gb', 'angleterre', 'irlande du nord'], label: 'Company No.' },
  { names: ['maroc', 'morocco', 'ma'], label: 'ICE' },
  { names: ['algerie', 'algeria', 'dz'], label: 'NIF' },
  { names: ['tunisie', 'tunisia', 'tn'], label: 'Matricule fiscal' },
  { names: ['senegal', 'sn'], label: 'NINEA' },
  { names: ['cote d ivoire', 'ci'], label: 'RCCM' },
];

function nationalIdRule(country: string | null | undefined): NationalIdRule | undefined {
  const key = normalizeCountry(country);
  return NATIONAL_ID_RULES.find((rule) => rule.names.includes(key));
}

/** « Portugal » → « NIPC ». Pays inconnu : « N° d'immatriculation ». */
export function nationalIdLabel(country: string | null | undefined): string {
  return nationalIdRule(country)?.label ?? 'N° d’immatriculation';
}

/**
 * Libellé d'un identifiant de l'émetteur : SIREN / SIRET en France, numéro
 * national ailleurs (NIPC au Portugal…), « N° TVA » partout.
 */
export function issuerLegalIdLabel(id: IssuerLegalId, country?: string | null): string {
  if (id === 'siret' && !isFrenchCountry(country)) return nationalIdLabel(country);
  return ISSUER_LEGAL_ID_LABELS[id];
}

/**
 * Numéro national d'une entreprise hors de France : celui saisi, sinon tiré
 * du n° de TVA quand il le contient (Portugal : PT + NIPC).
 */
export function nationalIdValue(
  country: string | null | undefined,
  registration: string | null | undefined,
  vatNumber: string | null | undefined,
): string | null {
  const typed = registration?.trim();
  if (typed) return typed;
  const vat = vatNumber?.replace(/[\s.\-]/g, '').toUpperCase().replace(/^GR/, 'EL') ?? '';
  return (vat && nationalIdRule(country)?.fromVat?.(vat)) || null;
}

/**
 * Facture pour un client hors de France : le SIREN et le SIRET de l'émetteur
 * ne sont ni proposés ni imprimés ; seul le n° de TVA reste (avec le numéro
 * national du client).
 */
export function issuerLegalIdsForClient(
  selected: IssuerLegalId[],
  clientCountry: string | null | undefined,
): IssuerLegalId[] {
  return isFrenchCountry(clientCountry) ? selected : selected.filter((id) => id === 'vat');
}

/** Numéro national d'un client hors de France, prêt à imprimer. `null` : client français ou inconnu. */
export function clientNationalId(
  client: {
    country?: string | null;
    siret?: string | null;
    siren?: string | null;
    vatNumber?: string | null;
  } | null | undefined,
): { label: string; value: string } | null {
  if (!client || isFrenchCountry(client.country)) return null;
  const value = nationalIdValue(client.country, client.siret || client.siren, client.vatNumber);
  return value ? { label: nationalIdLabel(client.country), value } : null;
}

function groupDigits(digits: string, sizes: number[]): string {
  const parts: string[] = [];
  let cursor = 0;
  for (const size of sizes) {
    if (cursor >= digits.length) break;
    parts.push(digits.slice(cursor, cursor + size));
    cursor += size;
  }
  return parts.join(' ');
}

/**
 * Valeurs affichables de l'entreprise émettrice. Le SIREN n'est pas saisi à
 * part : ce sont les 9 premiers chiffres du SIRET. `null` : non renseigné.
 */
export function formatIssuerLegalIds(
  siretInput: string | null | undefined,
  vatInput: string | null | undefined,
  sirenInput?: string | null,
  country?: string | null,
): Record<IssuerLegalId, string | null> {
  const siretRaw = siretInput?.trim() ?? '';
  const siret = siretRaw.replace(/\D/g, '');
  const vat = vatInput?.replace(/\s/g, '').toUpperCase() ?? '';

  // Hors de France : pas de SIREN ; le numéro national prend la place du SIRET.
  if (!isFrenchCountry(country)) {
    return {
      siren: null,
      siret: nationalIdValue(country, siretRaw || sirenInput, vat),
      vat: vat || null,
    };
  }
  // SIREN saisi dans la page Entreprise en priorité, sinon tiré du SIRET.
  const siren = sirenInput?.replace(/\D/g, '') || siret.slice(0, 9);

  return {
    siren: siren.length === 9 ? groupDigits(siren, [3, 3, 3]) : null,
    siret: siret.length === 14 ? groupDigits(siret, [3, 3, 3, 5]) : siretRaw || null,
    vat: vat || null,
  };
}

const LEGAL_IDS_STORAGE_KEY = 'inveq:invoice-legal-ids';

/** Dernier choix SIREN / SIRET / TVA de ce navigateur, repris à la facture suivante. */
export function readRememberedLegalIds(): IssuerLegalId[] {
  try {
    if (typeof window === 'undefined') return [...DEFAULT_ISSUER_LEGAL_IDS];
    const raw = window.localStorage.getItem(LEGAL_IDS_STORAGE_KEY);
    if (!raw) return [...DEFAULT_ISSUER_LEGAL_IDS];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? ISSUER_LEGAL_IDS.filter((id) => parsed.includes(id))
      : [...DEFAULT_ISSUER_LEGAL_IDS];
  } catch {
    return [...DEFAULT_ISSUER_LEGAL_IDS];
  }
}

export function rememberLegalIds(legalIds: IssuerLegalId[]): void {
  try {
    window.localStorage.setItem(LEGAL_IDS_STORAGE_KEY, JSON.stringify(legalIds));
  } catch {
    // Stockage indisponible (navigation privée) : le choix ne sera simplement pas repris.
  }
}

/** Coordonnées bancaires imprimées sur une facture. */
export type InvoiceBankDetails = {
  /** Afficher l'IBAN et le BIC. */
  show: boolean;
  iban: string;
  bic: string;
};

/** IBAN ou BIC sans espaces ni tirets, en majuscules : la forme stockée. */
export function normalizeBankValue(value: string | null | undefined): string {
  return (value ?? '').replace(/[\s-]/g, '').toUpperCase();
}

/**
 * Coordonnées réellement imprimées : celles de la facture si elle en porte,
 * sinon celles de l'entreprise (comportement des factures déjà émises).
 */
export function resolveInvoiceBankDetails(
  bank: InvoiceBankDetails | null,
  company: { iban?: string | null; bic?: string | null } | null | undefined,
): InvoiceBankDetails {
  if (bank) return bank;
  const iban = normalizeBankValue(company?.iban);
  const bic = normalizeBankValue(company?.bic);
  return { show: Boolean(iban), iban, bic };
}

/** Émetteur passé au moteur PDF, avec les coordonnées bancaires propres à la facture. */
export function withInvoiceBankDetails<T extends { iban?: string; bic?: string }>(
  company: T,
  bank: InvoiceBankDetails | null,
): T {
  if (!bank) return company;
  const iban = normalizeBankValue(bank.iban);
  const bic = normalizeBankValue(bank.bic);
  return {
    ...company,
    iban: bank.show && iban ? iban : undefined,
    bic: bank.show && bic ? bic : undefined,
  };
}

/** BIC : 8 ou 11 caractères (banque, pays, localité, agence facultative). */
export function isValidBic(value: string): boolean {
  return /^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(normalizeBankValue(value));
}

const NBSP = '\u00a0';

export type PaymentMentionPresetId = 'short' | 'l441' | 'ecb' | 'eom45';

/** Mentions de paiement prêtes à l'emploi, proposées sur chaque facture. */
export const PAYMENT_MENTION_PRESETS: { id: PaymentMentionPresetId; label: string; text: string }[] = [
  {
    id: 'short',
    label: '30 jours · version courte',
    text: `Échéance${NBSP}: 30 jours date de facture. Pas d’escompte pour paiement anticipé. En cas de retard${NBSP}: pénalités au taux de 3 fois le taux d’intérêt légal et indemnité forfaitaire de recouvrement de 40${NBSP}€.`,
  },
  {
    id: 'l441',
    label: '30 jours · article L441-10',
    text: `Paiement à 30 jours à compter de la date d’émission de la facture. Aucun escompte ne sera accordé pour paiement anticipé. Tout retard de paiement entraînera l’application de pénalités égales à trois fois le taux d’intérêt légal, ainsi qu’une indemnité forfaitaire de 40${NBSP}€ pour frais de recouvrement (art.${NBSP}L441-10 du Code de commerce).`,
  },
  {
    id: 'ecb',
    label: '30 jours · taux BCE + 10 points',
    text: `La présente facture est payable dans un délai de 30 jours suivant sa date d’émission. Aucun escompte n’est consenti en cas de règlement anticipé. À défaut de paiement à l’échéance, des pénalités de retard calculées au taux de la Banque centrale européenne majoré de 10 points seront exigibles de plein droit, de même qu’une indemnité forfaitaire de 40${NBSP}€ au titre des frais de recouvrement.`,
  },
  {
    id: 'eom45',
    label: '45 jours fin de mois',
    text: `Règlement à 45 jours fin de mois à compter de la date de facture. Conditions d’escompte${NBSP}: néant. Les sommes non réglées à l’échéance porteront intérêt de plein droit, sans mise en demeure préalable, au taux de trois fois le taux d’intérêt légal. Une indemnité de 40${NBSP}€ pour frais de recouvrement sera également due par le débiteur professionnel.`,
  },
];

const DAYS_PATTERN = /(\d+)(\s*)jours/;

/** Délai écrit dans une mention (« 30 jours » → 30). `null` : aucun. */
export function paymentMentionDays(text: string | null | undefined): number | null {
  const match = text?.match(DAYS_PATTERN);
  return match ? Number(match[1]) : null;
}

/** Remplace le délai écrit dans la mention par celui de la facture. */
export function withPaymentMentionDays(text: string, days: number): string {
  return text.replace(DAYS_PATTERN, (_match, _days, space: string) => `${days}${space}jours`);
}

/**
 * Mention prédéfinie correspondant au texte, délai mis à part : une mention
 * adaptée à 15 jours reste reconnue. `null` : texte libre.
 */
export function matchPaymentMentionPreset(text: string | null | undefined): PaymentMentionPresetId | null {
  if (!text) return null;
  const key = (value: string) => value.replace(/\d+(\s*)jours/, 'N jours').replace(/\s+/g, ' ').trim();
  return PAYMENT_MENTION_PRESETS.find((preset) => key(preset.text) === key(text))?.id ?? null;
}

function normalizePaymentMention(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim().slice(0, 2000) : null;
}

const PAYMENT_MENTION_STORAGE_KEY = 'inveq:invoice-payment-mention';

/** Dernière mention choisie sur ce navigateur, reprise à la facture suivante. */
export function readRememberedPaymentMention(): string | null {
  try {
    if (typeof window === 'undefined') return null;
    const raw = window.localStorage.getItem(PAYMENT_MENTION_STORAGE_KEY);
    return raw ? normalizePaymentMention(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

export function rememberPaymentMention(mention: string | null): void {
  try {
    window.localStorage.setItem(PAYMENT_MENTION_STORAGE_KEY, JSON.stringify(mention ?? ''));
  } catch {
    // Stockage indisponible (navigation privée) : le choix ne sera simplement pas repris.
  }
}

export type InvoicePdfOptions = {
  /** `null` : « Facture ». */
  title: string | null;
  legalIds: IssuerLegalId[];
  stampColor: StampColor;
  stampPosition: StampPosition;
  /** Modèle PDF de cette facture ('01'…'20'). `null` : modèle par défaut des réglages. */
  templateId: string | null;
  /** E-mail de l'entreprise sur la facture. Masqué par défaut, anciennes factures comprises. */
  showEmail: boolean;
  /** Logo de l'entreprise sur le document (s'il existe). */
  showLogo: boolean;
  /** Emplacement des SIREN / SIRET / TVA. 'auto' : celui du modèle, comme avant. */
  legalIdsPlacement: LegalIdsPlacement;
  /** Client hors de France : imprimer son numéro national (NIPC…). Affiché par défaut. */
  showClientId: boolean;
  /** Emplacement de ce numéro. 'auto' : sous l'adresse du client. */
  clientIdPlacement: LegalIdsPlacement;
  /** Coordonnées bancaires de la facture. `null` : celles de l'entreprise, comme avant. */
  bank: InvoiceBankDetails | null;
  /** Mention de paiement imprimée en bas de la facture. `null` : aucune. */
  paymentMention: string | null;
};

export function createDefaultInvoicePdfOptions(): InvoicePdfOptions {
  return {
    title: null,
    legalIds: [...DEFAULT_ISSUER_LEGAL_IDS],
    stampColor: 'auto',
    stampPosition: 'auto',
    templateId: null,
    showEmail: false,
    showLogo: true,
    legalIdsPlacement: 'auto',
    showClientId: true,
    clientIdPlacement: 'auto',
    bank: null,
    paymentMention: null,
  };
}

function parseInvoiceBankDetails(value: unknown): InvoiceBankDetails | null {
  if (!value || typeof value !== 'object') return null;
  const source = value as Record<string, unknown>;
  if (typeof source.show !== 'boolean') return null;
  const text = (entry: unknown, max: number) =>
    typeof entry === 'string' ? normalizeBankValue(entry).slice(0, max) : '';
  return { show: source.show, iban: text(source.iban, 34), bic: text(source.bic, 11) };
}

/** Lit la colonne jsonb sans lui faire confiance : toute valeur inattendue retombe sur le défaut. */
export function parseInvoicePdfOptions(value: unknown): InvoicePdfOptions {
  if (!value || typeof value !== 'object') {
    return createDefaultInvoicePdfOptions();
  }

  const source = value as Record<string, unknown>;
  const title = typeof source.title === 'string' && source.title.trim() ? source.title.trim() : null;
  const legalIds = Array.isArray(source.legal_ids)
    ? ISSUER_LEGAL_IDS.filter((id) => (source.legal_ids as unknown[]).includes(id))
    : [...DEFAULT_ISSUER_LEGAL_IDS];

  const stampColor = STAMP_COLORS.find((color) => color === source.stamp_color) ?? 'auto';
  const stampPosition =
    STAMP_POSITIONS.find((position) => position === source.stamp_position) ?? 'auto';

  const templateId =
    typeof source.template_id === 'string' && /^\d{2,3}$/.test(source.template_id)
      ? source.template_id
      : null;

  const showEmail = source.show_email === true;
  const showLogo = source.show_logo !== false;
  const legalIdsPlacement = parseLegalIdsPlacement(source.legal_ids_placement);
  const showClientId = source.show_client_id !== false;
  const clientIdPlacement = parseLegalIdsPlacement(source.client_id_placement);
  const bank = parseInvoiceBankDetails(source.bank);
  const paymentMention = normalizePaymentMention(source.payment_mention);

  return {
    title,
    legalIds,
    stampColor,
    stampPosition,
    templateId,
    showEmail,
    showLogo,
    legalIdsPlacement,
    bank,
    paymentMention,
    showClientId,
    clientIdPlacement,
  };
}

export function serializeInvoicePdfOptions(options: InvoicePdfOptions) {
  return {
    title: options.title?.trim() || null,
    legal_ids: ISSUER_LEGAL_IDS.filter((id) => options.legalIds.includes(id)),
    stamp_color: options.stampColor,
    stamp_position: options.stampPosition,
    template_id: options.templateId,
    show_email: options.showEmail,
    show_logo: options.showLogo,
    legal_ids_placement: parseLegalIdsPlacement(options.legalIdsPlacement),
    show_client_id: options.showClientId,
    client_id_placement: parseLegalIdsPlacement(options.clientIdPlacement),
    bank: options.bank
      ? {
          show: options.bank.show,
          iban: normalizeBankValue(options.bank.iban),
          bic: normalizeBankValue(options.bank.bic),
        }
      : null,
    payment_mention: normalizePaymentMention(options.paymentMention),
  };
}
