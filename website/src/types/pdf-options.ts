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
): Record<IssuerLegalId, string | null> {
  const siretRaw = siretInput?.trim() ?? '';
  const siret = siretRaw.replace(/\D/g, '');
  const vat = vatInput?.replace(/\s/g, '').toUpperCase() ?? '';
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
  /** Afficher l'IBAN, le BIC et le QR code de virement. */
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
  const bank = parseInvoiceBankDetails(source.bank);
  const paymentMention = normalizePaymentMention(source.payment_mention);

  return {
    title,
    legalIds,
    stampColor,
    stampPosition,
    templateId,
    showEmail,
    bank,
    paymentMention,
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
