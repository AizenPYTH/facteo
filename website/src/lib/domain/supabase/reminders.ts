import {
  AUTOMATIC_REMINDER_STAGES,
  type AutomaticReminderStage,
  type ReminderStage,
  type ReminderTemplate,
} from '@/lib/reminders/templates';
import { supabase } from '@/lib/supabase';
import { logSupabaseError } from '@/lib/supabase/errors';

/**
 * Relances des impayés : réglages par entreprise, historique par facture,
 * relance manuelle. Commun au site et à l'application ; les envois sont
 * faits par le serveur (`send-invoice-reminders`).
 */

export type ReminderSettings = {
  enabled: boolean;
  stages: Record<AutomaticReminderStage, boolean>;
  includePaymentLink: boolean;
  templates: Partial<Record<ReminderStage, ReminderTemplate>>;
};

export const DEFAULT_REMINDER_SETTINGS: ReminderSettings = {
  enabled: false,
  stages: { before_due: true, due: true, after_7: true, after_15: true },
  includePaymentLink: true,
  templates: {},
};

type SettingsRow = {
  enabled: boolean;
  before_due_enabled: boolean;
  due_enabled: boolean;
  after_7_enabled: boolean;
  after_15_enabled: boolean;
  include_payment_link: boolean;
  templates: unknown;
};

function parseTemplates(value: unknown): ReminderSettings['templates'] {
  if (!value || typeof value !== 'object') return {};
  const result: ReminderSettings['templates'] = {};
  for (const [stage, entry] of Object.entries(value as Record<string, unknown>)) {
    if (!entry || typeof entry !== 'object') continue;
    const { subject, body } = entry as Record<string, unknown>;
    result[stage as ReminderStage] = {
      subject: typeof subject === 'string' ? subject : '',
      body: typeof body === 'string' ? body : '',
    };
  }
  return result;
}

export async function fetchReminderSettings(companyId: string): Promise<ReminderSettings> {
  const { data, error } = await supabase
    .from('reminder_settings')
    .select('enabled, before_due_enabled, due_enabled, after_7_enabled, after_15_enabled, include_payment_link, templates')
    .eq('company_id', companyId)
    .maybeSingle();
  if (error) {
    logSupabaseError('fetchReminderSettings', error);
    throw new Error('Impossible de charger les réglages des relances.');
  }
  const row = data as SettingsRow | null;
  if (!row) return DEFAULT_REMINDER_SETTINGS;
  return {
    enabled: row.enabled,
    stages: {
      before_due: row.before_due_enabled,
      due: row.due_enabled,
      after_7: row.after_7_enabled,
      after_15: row.after_15_enabled,
    },
    includePaymentLink: row.include_payment_link,
    templates: parseTemplates(row.templates),
  };
}

export async function saveReminderSettings(
  companyId: string,
  userId: string,
  settings: ReminderSettings,
): Promise<void> {
  const templates: Record<string, ReminderTemplate> = {};
  for (const [stage, template] of Object.entries(settings.templates)) {
    const subject = template?.subject.trim().slice(0, 200) ?? '';
    const body = template?.body.trim().slice(0, 5000) ?? '';
    if (subject || body) templates[stage] = { subject, body };
  }
  const { error } = await supabase.from('reminder_settings').upsert(
    {
      company_id: companyId,
      enabled: settings.enabled,
      before_due_enabled: settings.stages.before_due,
      due_enabled: settings.stages.due,
      after_7_enabled: settings.stages.after_7,
      after_15_enabled: settings.stages.after_15,
      include_payment_link: settings.includePaymentLink,
      templates,
      updated_at: new Date().toISOString(),
      updated_by: userId,
    },
    { onConflict: 'company_id' },
  );
  if (error) {
    logSupabaseError('saveReminderSettings', error);
    throw new Error('Impossible d’enregistrer les réglages des relances.');
  }
}

export type InvoiceReminder = {
  id: string;
  stage: ReminderStage;
  status: 'pending' | 'sent' | 'failed';
  recipientEmail: string | null;
  subject: string | null;
  amountDue: number | null;
  error: string | null;
  createdAt: string;
  sentAt: string | null;
};

export async function fetchInvoiceReminders(invoiceId: string): Promise<InvoiceReminder[]> {
  const { data, error } = await supabase
    .from('invoice_reminders')
    .select('id, stage, status, recipient_email, subject, amount_due, error, created_at, sent_at')
    .eq('invoice_id', invoiceId)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) {
    logSupabaseError('fetchInvoiceReminders', error);
    return [];
  }
  return ((data ?? []) as Record<string, unknown>[]).map((row) => ({
    id: String(row.id),
    stage: row.stage as ReminderStage,
    status: row.status as InvoiceReminder['status'],
    recipientEmail: (row.recipient_email as string | null) ?? null,
    subject: (row.subject as string | null) ?? null,
    amountDue: row.amount_due === null || row.amount_due === undefined ? null : Number(row.amount_due),
    error: (row.error as string | null) ?? null,
    createdAt: String(row.created_at),
    sentAt: (row.sent_at as string | null) ?? null,
  }));
}

export type NextReminder = {
  stage: AutomaticReminderStage | null;
  date: string | null;
  reason: string | null;
};

export async function fetchNextReminder(invoiceId: string): Promise<NextReminder | null> {
  const { data, error } = await supabase.rpc('invoice_next_reminder', { p_invoice_id: invoiceId });
  if (error || !data || typeof data !== 'object') {
    if (error) logSupabaseError('fetchNextReminder', error);
    return null;
  }
  const row = data as Record<string, unknown>;
  const stage = AUTOMATIC_REMINDER_STAGES.find((value) => value === row.next_stage) ?? null;
  return {
    stage,
    date: typeof row.next_date === 'string' ? row.next_date : null,
    reason: typeof row.reason === 'string' ? row.reason : null,
  };
}

export async function fetchInvoiceRemindersEnabled(invoiceId: string): Promise<boolean> {
  const { data, error } = await supabase.from('invoices').select('reminders_enabled').eq('id', invoiceId).maybeSingle();
  if (error) {
    logSupabaseError('fetchInvoiceRemindersEnabled', error);
    return true;
  }
  return (data as { reminders_enabled?: boolean } | null)?.reminders_enabled !== false;
}

export async function setInvoiceRemindersEnabled(invoiceId: string, enabled: boolean): Promise<void> {
  const { error } = await supabase.from('invoices').update({ reminders_enabled: enabled }).eq('id', invoiceId);
  if (error) {
    logSupabaseError('setInvoiceRemindersEnabled', error);
    throw new Error('Impossible de modifier les relances de cette facture.');
  }
}

/** Relance immédiate par e-mail (au plus une par 24 h et par facture). */
export async function sendManualReminder(invoiceId: string): Promise<void> {
  const { data, error } = await supabase.functions.invoke('send-invoice-reminders', { body: { invoiceId } });
  if (error) {
    let message = 'La relance n’a pas pu être envoyée.';
    const context = (error as { context?: { json?: () => Promise<unknown> } }).context;
    if (context?.json) {
      const body = (await context.json().catch(() => null)) as { error?: string } | null;
      if (body?.error) message = body.error;
    }
    throw new Error(message);
  }
  if (!data || (data as { sent?: boolean }).sent !== true) {
    throw new Error('La relance n’a pas pu être envoyée.');
  }
}
