import { DEFAULT_PDF_TEMPLATE_ID } from '@/lib/pdf/engine/templates';
import { demoSettings, isScreenshotDemo } from '@/lib/screenshot-demo';
import { supabase } from '@/lib/supabase';
import { logSupabaseError } from '@/lib/supabase/errors';
import type { DataScope } from '@/types/tenant';
import type { Settings, SettingsFormValues } from '@/types/settings';
import type { SettingsRow, SettingsUpdate } from '@/types/database';

export const SETTINGS_COLUMNS =
  'id, user_id, company_id, currency, default_vat_rate, quote_prefix, invoice_prefix, quote_validity_days, next_quote_number, next_invoice_number, locale, payment_terms_days, quote_footer, invoice_footer, quote_template_id, invoice_template_id, created_at, updated_at' as const;

export function mapSettingsRow(row: SettingsRow & {
  company_id?: string | null;
  quote_template_id?: string | null;
  invoice_template_id?: string | null;
}): Settings {
  return {
    id: row.id,
    userId: row.user_id,
    companyId: row.company_id ?? null,
    currency: row.currency,
    defaultVatRate: row.default_vat_rate,
    quotePrefix: row.quote_prefix,
    invoicePrefix: row.invoice_prefix,
    quoteValidityDays: row.quote_validity_days,
    nextQuoteNumber: row.next_quote_number,
    nextInvoiceNumber: row.next_invoice_number,
    locale: row.locale,
    paymentTermsDays: row.payment_terms_days,
    quoteFooter: row.quote_footer,
    invoiceFooter: row.invoice_footer,
    quoteTemplateId: row.quote_template_id ?? DEFAULT_PDF_TEMPLATE_ID,
    invoiceTemplateId: row.invoice_template_id ?? DEFAULT_PDF_TEMPLATE_ID,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function fetchSettings(scope: DataScope): Promise<Settings | null> {
  if (isScreenshotDemo()) {
    void scope;
    return demoSettings;
  }

  const { data, error } = await supabase
    .from('settings')
    .select(SETTINGS_COLUMNS)
    .eq('company_id', scope.companyId)
    .maybeSingle();

  if (error) {
    logSupabaseError('fetchSettings', error);
    return null;
  }

  return data ? mapSettingsRow(data as SettingsRow) : null;
}

export async function reserveNextQuoteNumber(companyId: string): Promise<string> {
  const { data, error } = await supabase.rpc('reserve_next_quote_number', {
    p_company_id: companyId,
  });

  if (error || typeof data !== 'string') {
    logSupabaseError('reserveNextQuoteNumber', error);
    throw error ?? new Error('Unable to reserve quote number.');
  }

  return data;
}

export async function reserveNextInvoiceNumber(companyId: string): Promise<string> {
  const { data, error } = await supabase.rpc('reserve_next_invoice_number', {
    p_company_id: companyId,
  });

  if (error || typeof data !== 'string') {
    logSupabaseError('reserveNextInvoiceNumber', error);
    throw error ?? new Error('Unable to reserve invoice number.');
  }

  return data;
}

export function computeValidUntil(validityDays: number): string {
  const date = new Date();
  date.setDate(date.getDate() + validityDays);
  return date.toISOString();
}

export function computeDueDate(paymentTermsDays: number): string {
  const date = new Date();
  date.setDate(date.getDate() + paymentTermsDays);
  return date.toISOString();
}

export function mapSettingsToFormValues(settings: Settings): SettingsFormValues {
  return {
    currency: settings.currency,
    defaultVatRate: String(settings.defaultVatRate),
    quotePrefix: settings.quotePrefix,
    invoicePrefix: settings.invoicePrefix,
    quoteValidityDays: String(settings.quoteValidityDays),
    nextQuoteNumber: String(settings.nextQuoteNumber),
    nextInvoiceNumber: String(settings.nextInvoiceNumber),
    locale: settings.locale,
    paymentTermsDays: String(settings.paymentTermsDays),
    quoteFooter: settings.quoteFooter ?? '',
    invoiceFooter: settings.invoiceFooter ?? '',
    quoteTemplateId: settings.quoteTemplateId,
    invoiceTemplateId: settings.invoiceTemplateId,
  };
}

function mapFormValuesToUpdate(values: SettingsFormValues): SettingsUpdate & {
  quote_template_id?: string;
  invoice_template_id?: string;
} {
  return {
    currency: values.currency.trim().toUpperCase(),
    default_vat_rate: Number(values.defaultVatRate.replace(',', '.')),
    quote_prefix: values.quotePrefix.trim(),
    invoice_prefix: values.invoicePrefix.trim(),
    quote_validity_days: Number(values.quoteValidityDays),
    next_quote_number: Number(values.nextQuoteNumber),
    next_invoice_number: Number(values.nextInvoiceNumber),
    locale: values.locale.trim(),
    payment_terms_days: Number(values.paymentTermsDays),
    quote_footer: values.quoteFooter.trim() || null,
    invoice_footer: values.invoiceFooter.trim() || null,
    quote_template_id: values.quoteTemplateId,
    invoice_template_id: values.invoiceTemplateId,
    updated_at: new Date().toISOString(),
  };
}

export async function updateSettings(
  scope: DataScope,
  values: SettingsFormValues,
): Promise<Settings> {
  const payload = mapFormValuesToUpdate(values);

  const { data, error } = await supabase
    .from('settings')
    .update(payload)
    .eq('company_id', scope.companyId)
    .select(SETTINGS_COLUMNS)
    .single();

  if (error) {
    logSupabaseError('updateSettings', error);
    throw error;
  }

  return mapSettingsRow(data as SettingsRow);
}

export async function updateDocumentTemplates(
  scope: DataScope,
  templates: { quoteTemplateId: string; invoiceTemplateId: string },
): Promise<Settings> {
  const { data, error } = await supabase
    .from('settings')
    .update({
      quote_template_id: templates.quoteTemplateId,
      invoice_template_id: templates.invoiceTemplateId,
      updated_at: new Date().toISOString(),
    })
    .eq('company_id', scope.companyId)
    .select(SETTINGS_COLUMNS)
    .single();

  if (error) {
    logSupabaseError('updateDocumentTemplates', error);
    throw error;
  }

  return mapSettingsRow(data as SettingsRow);
}
