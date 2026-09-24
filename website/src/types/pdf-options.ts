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

export type InvoicePdfOptions = {
  /** `null` : « Facture ». */
  title: string | null;
  legalIds: IssuerLegalId[];
  stampColor: StampColor;
  stampPosition: StampPosition;
  /** Modèle PDF de cette facture ('01'…'20'). `null` : modèle par défaut des réglages. */
  templateId: string | null;
};

export function createDefaultInvoicePdfOptions(): InvoicePdfOptions {
  return {
    title: null,
    legalIds: [...DEFAULT_ISSUER_LEGAL_IDS],
    stampColor: 'auto',
    stampPosition: 'auto',
    templateId: null,
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

  return { title, legalIds, stampColor, stampPosition, templateId };
}

export function serializeInvoicePdfOptions(options: InvoicePdfOptions) {
  return {
    title: options.title?.trim() || null,
    legal_ids: ISSUER_LEGAL_IDS.filter((id) => options.legalIds.includes(id)),
    stamp_color: options.stampColor,
    stamp_position: options.stampPosition,
    template_id: options.templateId,
  };
}
