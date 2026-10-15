import { supabase } from '@/lib/supabase';

/**
 * Espace administrateur « Activité utilisateurs ». Chaque RPC vérifie en base
 * que l'appelant est administrateur de la plateforme (table platform_admins) :
 * aucun accès par la clé service_role côté navigateur.
 */

export type ActivityOverview = {
  generated_at: string;
  tracking_since: string | null;
  registered_users: number;
  active_users_24h: number;
  active_users_7d: number;
  active_users_30d: number;
  invoices_total: number;
  invoices_today: number;
  invoices_7d: number;
  invoices_30d: number;
  last_invoice: {
    id: string;
    number: string;
    created_at: string;
    user_id: string;
    email: string | null;
  } | null;
  invoices_by_platform: Record<string, number> | null;
  invoices_by_method: Record<string, number> | null;
  users_with_invoice: number;
  voice_users_saved: number;
  voice_users_tried: number;
  voice_totals: Record<string, number>;
  voice_30d: Record<string, number>;
  voice_errors_30d: { error_code: string; total: number }[];
};

export type InvoiceHistoryRow = {
  created_at: string;
  invoice_id: string;
  invoice_number: string;
  user_id: string;
  user_email: string | null;
  platform: string;
  creation_method: string;
  deleted: boolean;
  total_count: number;
};

export type UserActivityRow = {
  user_id: string;
  user_email: string | null;
  signed_up_at: string;
  last_activity_at: string | null;
  invoices_total: number;
  invoices_in_period: number;
  last_invoice_at: string | null;
  voice_saved: number;
  voice_failed: number;
  last_voice_at: string | null;
  platforms: string[];
};

export type UserEventRow = {
  occurred_at: string;
  event_name: string;
  platform: string;
  attempt_id: string | null;
  invoice_id: string | null;
  invoice_number: string | null;
  outcome: string | null;
  creation_method: string | null;
  error_code: string | null;
};

export type PeriodRange = { from: string | null; to: string | null };

export const ADMIN_PAGE_SIZE = 50;

function unwrap<T>(result: { data: T | null; error: { message: string; code?: string } | null }): T {
  if (result.error) {
    if (result.error.code === '42501') throw new Error('Accès réservé aux administrateurs.');
    throw new Error(result.error.message);
  }
  if (result.data === null) throw new Error('Réponse vide.');
  return result.data;
}

export async function fetchActivityOverview(): Promise<ActivityOverview> {
  return unwrap(await supabase.rpc('admin_activity_overview')) as ActivityOverview;
}

export async function fetchInvoiceHistory(filters: {
  page: number;
  range: PeriodRange;
  platform?: string | null;
  method?: string | null;
  userId?: string | null;
}): Promise<InvoiceHistoryRow[]> {
  return unwrap(
    await supabase.rpc('admin_invoice_history', {
      p_limit: ADMIN_PAGE_SIZE,
      p_offset: filters.page * ADMIN_PAGE_SIZE,
      p_from: filters.range.from,
      p_to: filters.range.to,
      p_platform: filters.platform ?? null,
      p_method: filters.method ?? null,
      p_user_id: filters.userId ?? null,
    }),
  );
}

export async function fetchUserActivity(range: PeriodRange): Promise<UserActivityRow[]> {
  return unwrap(await supabase.rpc('admin_user_activity', { p_from: range.from, p_to: range.to }));
}

export async function fetchUserEvents(
  userId: string,
  range: PeriodRange,
  event: string | null,
): Promise<UserEventRow[]> {
  return unwrap(
    await supabase.rpc('admin_user_events', {
      p_user_id: userId,
      p_from: range.from,
      p_to: range.to,
      p_event: event,
      p_limit: 300,
    }),
  );
}
