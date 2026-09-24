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

export type InvoicePdfOptions = {
  /** `null` : « Facture ». */
  title: string | null;
  legalIds: IssuerLegalId[];
};

export function createDefaultInvoicePdfOptions(): InvoicePdfOptions {
  return { title: null, legalIds: [...DEFAULT_ISSUER_LEGAL_IDS] };
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

  return { title, legalIds };
}

export function serializeInvoicePdfOptions(options: InvoicePdfOptions) {
  return {
    title: options.title?.trim() || null,
    legal_ids: ISSUER_LEGAL_IDS.filter((id) => options.legalIds.includes(id)),
  };
}
