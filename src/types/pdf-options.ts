import AsyncStorage from '@react-native-async-storage/async-storage';

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
export type StampPosition = 'auto' | 'top' | 'bottom';

export const STAMP_POSITIONS: StampPosition[] = ['auto', 'top', 'bottom'];

export const STAMP_POSITION_LABELS: Record<StampPosition, string> = {
  auto: 'Près des totaux',
  top: 'En haut',
  bottom: 'En bas',
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

/** Dernier choix SIREN / SIRET / TVA de l'appareil, repris à la facture suivante. */
export async function readRememberedLegalIds(): Promise<IssuerLegalId[]> {
  try {
    const raw = await AsyncStorage.getItem(LEGAL_IDS_STORAGE_KEY);
    if (!raw) return [...DEFAULT_ISSUER_LEGAL_IDS];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? ISSUER_LEGAL_IDS.filter((id) => parsed.includes(id))
      : [...DEFAULT_ISSUER_LEGAL_IDS];
  } catch {
    return [...DEFAULT_ISSUER_LEGAL_IDS];
  }
}

export async function rememberLegalIds(legalIds: IssuerLegalId[]): Promise<void> {
  try {
    await AsyncStorage.setItem(LEGAL_IDS_STORAGE_KEY, JSON.stringify(legalIds));
  } catch {
    // Stockage indisponible : le choix ne sera simplement pas repris.
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
};

export function createDefaultInvoicePdfOptions(): InvoicePdfOptions {
  return {
    title: null,
    legalIds: [...DEFAULT_ISSUER_LEGAL_IDS],
    stampColor: 'auto',
    stampPosition: 'auto',
    templateId: null,
    showEmail: false,
  };
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
    typeof source.template_id === 'string' && /^\d{2}$/.test(source.template_id)
      ? source.template_id
      : null;

  const showEmail = source.show_email === true;

  return { title, legalIds, stampColor, stampPosition, templateId, showEmail };
}

export function serializeInvoicePdfOptions(options: InvoicePdfOptions) {
  return {
    title: options.title?.trim() || null,
    legal_ids: ISSUER_LEGAL_IDS.filter((id) => options.legalIds.includes(id)),
    stamp_color: options.stampColor,
    stamp_position: options.stampPosition,
    template_id: options.templateId,
    show_email: options.showEmail,
  };
}
