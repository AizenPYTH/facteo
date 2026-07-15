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
    quoteTemplateId: 'classic-blue',
    invoiceTemplateId: 'classic-blue',
  };
}
