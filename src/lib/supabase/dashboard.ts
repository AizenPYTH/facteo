import { supabase } from '@/lib/supabase';
import { getCountFromQuery, getSumFromRows, logSupabaseError } from '@/lib/supabase/errors';
import { mapInvoiceRowToInvoice } from '@/lib/supabase/mappers';
import { fetchUserProfile } from '@/lib/supabase/profiles';
import { createEmptyDashboardStats, type DashboardStats, type Invoice } from '@/types/dashboard';
import type { InvoiceWithClient, Profile } from '@/types/database';

export type DashboardProfile = {
  firstName?: string;
  lastName?: string;
  companyName?: string;
};

export type DashboardData = {
  profile: Profile | null;
  display: DashboardProfile;
  stats: DashboardStats;
  recentInvoices: Invoice[];
};

type UserMetadata = Record<string, unknown>;

const RECENT_INVOICE_COLUMNS = 'id, number, status, total, issued_at, clients(name)';
const RECENT_INVOICES_LIMIT = 5;

const UNPAID_INVOICE_STATUSES = ['sent', 'overdue'] as const;

function getMonthStartIso(): string {
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  return monthStart.toISOString();
}

function readMetadataString(metadata: UserMetadata, key: string): string | undefined {
  const value = metadata[key];
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

export function resolveDashboardProfile(
  profile: Profile | null,
  metadata: UserMetadata,
): DashboardProfile {
  return {
    firstName: profile?.first_name ?? readMetadataString(metadata, 'first_name'),
    lastName: profile?.last_name ?? readMetadataString(metadata, 'last_name'),
    companyName: profile?.company_name ?? readMetadataString(metadata, 'company_name'),
  };
}

export function createEmptyDashboardData(metadata: UserMetadata = {}): DashboardData {
  return {
    profile: null,
    display: resolveDashboardProfile(null, metadata),
    stats: createEmptyDashboardStats(),
    recentInvoices: [],
  };
}

export async function fetchDashboardStats(userId: string): Promise<DashboardStats> {
  const monthStart = getMonthStartIso();

  const [monthlyRevenueResult, unpaidResult, paidResult, clientsResult] = await Promise.all([
    supabase
      .from('invoices')
      .select('total')
      .eq('user_id', userId)
      .eq('status', 'paid')
      .gte('issued_at', monthStart),
    supabase
      .from('invoices')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .in('status', [...UNPAID_INVOICE_STATUSES]),
    supabase
      .from('invoices')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'paid'),
    supabase
      .from('clients')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId),
  ]);

  return {
    monthlyRevenue: getSumFromRows(
      monthlyRevenueResult.data,
      monthlyRevenueResult.error,
      'fetchDashboardStats.monthlyRevenue',
    ),
    unpaidInvoices: getCountFromQuery(
      unpaidResult.count,
      unpaidResult.error,
      'fetchDashboardStats.unpaidInvoices',
    ),
    paidInvoices: getCountFromQuery(
      paidResult.count,
      paidResult.error,
      'fetchDashboardStats.paidInvoices',
    ),
    totalClients: getCountFromQuery(
      clientsResult.count,
      clientsResult.error,
      'fetchDashboardStats.totalClients',
    ),
  };
}

export async function fetchRecentInvoices(userId: string): Promise<Invoice[]> {
  const { data, error } = await supabase
    .from('invoices')
    .select(RECENT_INVOICE_COLUMNS)
    .eq('user_id', userId)
    .order('issued_at', { ascending: false, nullsFirst: false })
    .limit(RECENT_INVOICES_LIMIT);

  if (error) {
    logSupabaseError('fetchRecentInvoices', error);
    return [];
  }

  return (data as InvoiceWithClient[] | null)?.map(mapInvoiceRowToInvoice) ?? [];
}

export async function fetchDashboardData(
  userId: string,
  metadata: UserMetadata,
): Promise<DashboardData> {
  const [profile, stats, recentInvoices] = await Promise.all([
    fetchUserProfile(userId),
    fetchDashboardStats(userId),
    fetchRecentInvoices(userId),
  ]);

  return {
    profile,
    display: resolveDashboardProfile(profile, metadata),
    stats,
    recentInvoices,
  };
}
