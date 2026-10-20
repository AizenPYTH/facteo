import { supabase } from '@/lib/supabase';
import { logSupabaseError } from '@/lib/supabase/errors';
import { DEFAULT_PDF_TEMPLATE_ID } from '@/lib/pdf/engine/templates';
import type { DataScope } from '@/types/tenant';
import { DEFAULT_NUMBER_FORMAT, type Settings, type SettingsFormValues } from '@/types/settings';
import type { SettingsRow, SettingsUpdate } from '@/types/database';

const LEGACY_SETTINGS_COLUMNS =
  'id, user_id, company_id, currency, default_vat_rate, quote_prefix, invoice_prefix, quote_validity_days, next_quote_number, next_invoice_number, locale, payment_terms_days, quote_footer, invoice_footer, quote_template_id, invoice_template_id, created_at, updated_at' as const;

export const SETTINGS_COLUMNS =
  `${LEGACY_SETTINGS_COLUMNS}, number_include_year, number_separator, number_digits, invoice_title, show_logo` as const;

/** Colonnes ajoutées par la migration « réglages par entreprise » : absentes tant qu'elle n'est pas appliquée. */
const NEW_SETTINGS_FIELDS = [
  'number_include_year',
  'number_separator',
  'number_digits',
  'invoice_title',
  'show_logo',
] as const;

function isMissingColumn(error: { code?: string } | null): boolean {
  return error?.code === '42703' || error?.code === 'PGRST204';
}

/**
 * Chaque entreprise a sa propre ligne de réglages. Une entreprise ajoutée
 * avant la correction n'en avait pas : la base la crée à la demande.
 */
async function ensureCompanySettings(companyId: string): Promise<void> {
  const { error } = await supabase.rpc('ensure_company_settings', { p_company_id: companyId });
  if (error && error.code !== 'PGRST202') {
    logSupabaseError('ensureCompanySettings', error);
  }
}

export function mapSettingsRow(row: Partial<SettingsRow> & Omit<SettingsRow, (typeof NEW_SETTINGS_FIELDS)[number]>): Settings {
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
    numberFormat: {
      includeYear: row.number_include_year ?? DEFAULT_NUMBER_FORMAT.includeYear,
      separator: row.number_separator ?? DEFAULT_NUMBER_FORMAT.separator,
      digits: row.number_digits ?? DEFAULT_NUMBER_FORMAT.digits,
    },
    invoiceTitle: row.invoice_title?.trim() || null,
    showLogo: row.show_logo === true,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function selectSettings(companyId: string) {
  const result = await supabase
    .from('settings')
    .select(SETTINGS_COLUMNS)
    .eq('company_id', companyId)
    .maybeSingle();
  if (!isMissingColumn(result.error)) return result;
  return supabase
    .from('settings')
    .select(LEGACY_SETTINGS_COLUMNS)
    .eq('company_id', companyId)
    .maybeSingle();
}

export async function fetchSettings(scope: DataScope): Promise<Settings | null> {
  let { data, error } = await selectSettings(scope.companyId);

  if (!error && !data) {
    await ensureCompanySettings(scope.companyId);
    ({ data, error } = await selectSettings(scope.companyId));
  }

  if (error) {
    logSupabaseError('fetchSettings', error);
    return null;
  }

  return data ? mapSettingsRow(data as SettingsRow) : null;
}

/** Mise à jour des réglages de l'entreprise active, créés au besoin. */
async function updateCompanySettings(companyId: string, payload: SettingsUpdate): Promise<Settings> {
  await ensureCompanySettings(companyId);

  const run = (values: SettingsUpdate, columns: string) =>
    supabase.from('settings').update(values).eq('company_id', companyId).select(columns).single();

  let { data, error } = await run(payload, SETTINGS_COLUMNS);
  if (isMissingColumn(error)) {
    const legacy = { ...payload };
    for (const field of NEW_SETTINGS_FIELDS) delete legacy[field];
    ({ data, error } = await run(legacy, LEGACY_SETTINGS_COLUMNS));
  }

  if (error || !data) {
    logSupabaseError('updateCompanySettings', error);
    throw error ?? new Error('Réglages introuvables pour cette entreprise.');
  }

  return mapSettingsRow(data as unknown as SettingsRow);
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
    numberIncludeYear: settings.numberFormat.includeYear,
    numberSeparator: settings.numberFormat.separator,
    numberDigits: String(settings.numberFormat.digits),
    invoiceTitle: settings.invoiceTitle ?? '',
  };
}

function toPositiveInteger(value: string, fallback: number): number {
  const parsed = Math.floor(Number(value.trim()));
  return Number.isFinite(parsed) && parsed >= 1 ? parsed : fallback;
}

function mapFormValuesToUpdate(values: SettingsFormValues): SettingsUpdate {
  return {
    currency: values.currency.trim().toUpperCase(),
    default_vat_rate: Number(values.defaultVatRate.replace(',', '.')),
    quote_prefix: values.quotePrefix.trim(),
    invoice_prefix: values.invoicePrefix.trim(),
    quote_validity_days: Number(values.quoteValidityDays),
    next_quote_number: toPositiveInteger(values.nextQuoteNumber, 1),
    next_invoice_number: toPositiveInteger(values.nextInvoiceNumber, 1),
    locale: values.locale.trim(),
    payment_terms_days: Number(values.paymentTermsDays),
    quote_footer: values.quoteFooter.trim() || null,
    invoice_footer: values.invoiceFooter.trim() || null,
    quote_template_id: values.quoteTemplateId,
    invoice_template_id: values.invoiceTemplateId,
    number_include_year: values.numberIncludeYear,
    number_separator: values.numberSeparator,
    number_digits: Math.min(10, toPositiveInteger(values.numberDigits, 6)),
    invoice_title: values.invoiceTitle.trim().slice(0, 60) || null,
    updated_at: new Date().toISOString(),
  };
}

export async function updateSettings(
  scope: DataScope,
  values: SettingsFormValues,
): Promise<Settings> {
  return updateCompanySettings(scope.companyId, mapFormValuesToUpdate(values));
}

export async function updateDocumentTemplates(
  scope: DataScope,
  templates: { quoteTemplateId: string; invoiceTemplateId: string },
): Promise<Settings> {
  return updateCompanySettings(scope.companyId, {
    quote_template_id: templates.quoteTemplateId,
    invoice_template_id: templates.invoiceTemplateId,
    updated_at: new Date().toISOString(),
  });
}

/** Afficher ou masquer le logo sur les documents de l'entreprise active. */
export async function updateShowLogo(scope: DataScope, showLogo: boolean): Promise<Settings> {
  return updateCompanySettings(scope.companyId, {
    show_logo: showLogo,
    updated_at: new Date().toISOString(),
  });
}
