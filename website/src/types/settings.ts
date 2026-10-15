import { DEFAULT_PDF_TEMPLATE_ID } from '@/lib/pdf/engine/templates/types';

/** Séparateurs proposés entre préfixe, année et numéro (vide : collés). */
export const NUMBER_SEPARATORS = ['-', '/', '_', '.', ''] as const;
export type NumberSeparator = (typeof NUMBER_SEPARATORS)[number];

export type NumberFormat = {
  includeYear: boolean;
  separator: string;
  digits: number;
};

export const DEFAULT_NUMBER_FORMAT: NumberFormat = { includeYear: true, separator: '-', digits: 6 };

/**
 * Même règle que `public.format_document_number` (base de données) :
 * PRÉFIXE-2026-000042, FA/42, 2026-0042… Le numéro n'est jamais tronqué.
 */
export function formatDocumentNumber(
  prefix: string | null | undefined,
  next: number | string,
  format: NumberFormat = DEFAULT_NUMBER_FORMAT,
  at: Date = new Date(),
): string {
  const value = Math.max(1, Math.floor(Number(next) || 1));
  const digits = Math.min(10, Math.max(1, Math.floor(format.digits) || 6));
  const year = format.includeYear
    ? new Intl.DateTimeFormat('fr-FR', { year: 'numeric', timeZone: 'Europe/Paris' }).format(at)
    : null;
  return [prefix?.trim() || null, year, String(value).padStart(digits, '0')]
    .filter((part): part is string => Boolean(part))
    .join(format.separator);
}
export type Settings = {
  id: string;
  userId: string;
  companyId: string | null;
  currency: string;
  defaultVatRate: number;
  quotePrefix: string;
  invoicePrefix: string;
  quoteValidityDays: number;
  nextQuoteNumber: number;
  nextInvoiceNumber: number;
  locale: string;
  paymentTermsDays: number;
  quoteFooter: string | null;
  invoiceFooter: string | null;
  quoteTemplateId: string;
  invoiceTemplateId: string;
  numberFormat: NumberFormat;
  /** Titre par défaut des factures de l'entreprise (null : « Facture »). */
  invoiceTitle: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SettingsFormValues = {
  currency: string;
  defaultVatRate: string;
  quotePrefix: string;
  invoicePrefix: string;
  quoteValidityDays: string;
  nextQuoteNumber: string;
  nextInvoiceNumber: string;
  locale: string;
  paymentTermsDays: string;
  quoteFooter: string;
  invoiceFooter: string;
  quoteTemplateId: string;
  invoiceTemplateId: string;
  numberIncludeYear: boolean;
  numberSeparator: string;
  numberDigits: string;
  invoiceTitle: string;
};

export function createDefaultSettingsFormValues(): SettingsFormValues {
  return {
    currency: 'EUR',
    defaultVatRate: '20',
    quotePrefix: 'DEV',
    invoicePrefix: 'FAC',
    quoteValidityDays: '30',
    nextQuoteNumber: '1',
    nextInvoiceNumber: '1',
    locale: 'fr-FR',
    paymentTermsDays: '30',
    quoteFooter: '',
    invoiceFooter: '',
    quoteTemplateId: DEFAULT_PDF_TEMPLATE_ID,
    invoiceTemplateId: DEFAULT_PDF_TEMPLATE_ID,
    numberIncludeYear: true,
    numberSeparator: '-',
    numberDigits: '6',
    invoiceTitle: '',
  };
}
