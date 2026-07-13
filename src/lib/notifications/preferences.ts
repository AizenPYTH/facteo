import { supabase } from '@/lib/supabase';
import { logSupabaseError } from '@/lib/supabase/errors';

export type NotificationPreferences = {
  invoiceOverdueEnabled: boolean;
  quoteAcceptedEnabled: boolean;
  paymentReceivedEnabled: boolean;
  dueDateReminderEnabled: boolean;
  dueDateReminderDays: number;
};

const DEFAULT_PREFERENCES: NotificationPreferences = {
  invoiceOverdueEnabled: true,
  quoteAcceptedEnabled: true,
  paymentReceivedEnabled: true,
  dueDateReminderEnabled: true,
  dueDateReminderDays: 3,
};

type NotificationPreferencesRow = {
  invoice_overdue_enabled: boolean;
  quote_accepted_enabled: boolean;
  payment_received_enabled: boolean;
  due_date_reminder_enabled: boolean;
  due_date_reminder_days: number;
};

function mapRow(row: NotificationPreferencesRow): NotificationPreferences {
  return {
    invoiceOverdueEnabled: row.invoice_overdue_enabled,
    quoteAcceptedEnabled: row.quote_accepted_enabled,
    paymentReceivedEnabled: row.payment_received_enabled,
    dueDateReminderEnabled: row.due_date_reminder_enabled,
    dueDateReminderDays: row.due_date_reminder_days,
  };
}

export async function fetchNotificationPreferences(
  userId: string,
): Promise<NotificationPreferences> {
  const { data, error } = await supabase
    .from('notification_preferences')
    .select(
      'invoice_overdue_enabled, quote_accepted_enabled, payment_received_enabled, due_date_reminder_enabled, due_date_reminder_days',
    )
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    logSupabaseError('fetchNotificationPreferences', error);
    return DEFAULT_PREFERENCES;
  }

  if (!data) {
    return DEFAULT_PREFERENCES;
  }

  return mapRow(data as NotificationPreferencesRow);
}

export async function upsertNotificationPreferences(
  userId: string,
  preferences: NotificationPreferences,
): Promise<NotificationPreferences> {
  const { data, error } = await supabase
    .from('notification_preferences')
    .upsert(
      {
        user_id: userId,
        invoice_overdue_enabled: preferences.invoiceOverdueEnabled,
        quote_accepted_enabled: preferences.quoteAcceptedEnabled,
        payment_received_enabled: preferences.paymentReceivedEnabled,
        due_date_reminder_enabled: preferences.dueDateReminderEnabled,
        due_date_reminder_days: preferences.dueDateReminderDays,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    )
    .select(
      'invoice_overdue_enabled, quote_accepted_enabled, payment_received_enabled, due_date_reminder_enabled, due_date_reminder_days',
    )
    .single();

  if (error) {
    logSupabaseError('upsertNotificationPreferences', error);
    throw error;
  }

  return mapRow(data as NotificationPreferencesRow);
}
