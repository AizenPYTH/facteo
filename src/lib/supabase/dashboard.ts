import { supabase } from '@/lib/supabase';
import { getCountFromQuery, getSumFromRows, logSupabaseError } from '@/lib/supabase/errors';
import { mapInvoiceRowToDashboardInvoice } from '@/lib/supabase/mappers';
import { fetchUserProfile } from '@/lib/supabase/profiles';
import {
  createEmptyDashboardStats,
  createEmptyExtendedDashboardData,
  type ActivityItem,
  type DashboardStats,
  type ExtendedDashboardData,
  type Invoice,
  type MonthlyRevenue,
  type TopClient,
  type TopPrestation,
} from '@/types/dashboard';
import type { InvoiceWithClient, Profile } from '@/types/database';
import type { DataScope } from '@/types/tenant';

export type DashboardProfile = {
  firstName?: string;
  lastName?: string;
  companyName?: string;
};

export type DashboardData = {
  profile: Profile | null;
  display: DashboardProfile;
  stats: DashboardStats;
  extended: ExtendedDashboardData;
  recentInvoices: Invoice[];
};

type UserMetadata = Record<string, unknown>;

const RECENT_INVOICE_COLUMNS =
  'id, number, status, total_ttc, total, issued_at, created_at, client_id, clients(name)';
const RECENT_INVOICES_LIMIT = 5;
const RECENT_ACTIVITY_LIMIT = 8;
const TOP_ITEMS_LIMIT = 5;
const REVENUE_MONTHS = 12;

const UNPAID_INVOICE_STATUSES = ['sent', 'partially_paid', 'overdue'] as const;

type OutstandingInvoiceRow = {
  total_ttc: number | null;
  total: number | null;
  status: string;
  invoice_payments: { amount: number }[] | { amount: number } | null;
};

type PaidInvoiceDelayRow = {
  issued_at: string | null;
  paid_at: string | null;
};

type AverageInvoiceRow = {
  total_ttc: number | null;
  total: number | null;
};

type PaidInvoiceWithClient = {
  total: number | null;
  clients:
    | { name: string | null; company: string | null }
    | { name: string | null; company: string | null }[]
    | null;
};

type InvoiceItemWithStatus = {
  description: string;
  line_total_ht: number;
  invoices: { status: string } | { status: string }[];
};

type ActivityRow = {
  id: string;
  number: string;
  status: string;
  created_at: string;
  issued_at: string | null;
  clients:
    | { name: string | null; company: string | null }
    | { name: string | null; company: string | null }[]
    | null;
};

function getMonthStartIso(): string {
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  return monthStart.toISOString();
}

function getTodayStartIso(): string {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  return todayStart.toISOString();
}

function getWeekStartIso(): string {
  const weekStart = new Date();
  const day = weekStart.getDay();
  const diff = day === 0 ? 6 : day - 1;
  weekStart.setDate(weekStart.getDate() - diff);
  weekStart.setHours(0, 0, 0, 0);
  return weekStart.toISOString();
}

function getWeekEndIso(): string {
  const weekStart = new Date(getWeekStartIso());
  weekStart.setDate(weekStart.getDate() + 7);
  return weekStart.toISOString();
}

function getDaysAgoIso(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(0, 0, 0, 0);
  return date.toISOString();
}

function getYearStartIso(): string {
  const yearStart = new Date();
  yearStart.setMonth(0, 1);
  yearStart.setHours(0, 0, 0, 0);
  return yearStart.toISOString();
}

function getTwelveMonthsAgoIso(): string {
  const date = new Date();
  date.setMonth(date.getMonth() - (REVENUE_MONTHS - 1));
  date.setDate(1);
  date.setHours(0, 0, 0, 0);
  return date.toISOString();
}

function readMetadataString(metadata: UserMetadata, key: string): string | undefined {
  const value = metadata[key];
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function resolveClientName(
  clients: PaidInvoiceWithClient['clients'] | ActivityRow['clients'],
): string {
  if (!clients) {
    return 'Client inconnu';
  }

  const client = Array.isArray(clients) ? clients[0] : clients;

  if (!client) {
    return 'Client inconnu';
  }

  return client.company?.trim() || client.name?.trim() || 'Client inconnu';
}

function buildLastMonthKeys(): string[] {
  const keys: string[] = [];
  const now = new Date();

  for (let index = REVENUE_MONTHS - 1; index >= 0; index -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - index, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    keys.push(key);
  }

  return keys;
}

function readInvoiceTotal(row: { total_ttc: number | null; total: number | null }): number {
  return row.total_ttc ?? row.total ?? 0;
}

function computeOutstandingAmount(rows: OutstandingInvoiceRow[]): number {
  return rows.reduce((sum, row) => {
    const total = readInvoiceTotal(row);
    const payments = Array.isArray(row.invoice_payments)
      ? row.invoice_payments
      : row.invoice_payments
        ? [row.invoice_payments]
        : [];
    const paid = payments.reduce((paymentSum, payment) => paymentSum + payment.amount, 0);
    return sum + Math.max(0, total - paid);
  }, 0);
}

function computeAveragePaymentDelayDays(rows: PaidInvoiceDelayRow[]): number {
  const delays: number[] = [];

  for (const row of rows) {
    if (!row.issued_at || !row.paid_at) {
      continue;
    }

    const issued = new Date(row.issued_at).getTime();
    const paid = new Date(row.paid_at).getTime();
    const days = Math.max(0, Math.round((paid - issued) / (1000 * 60 * 60 * 24)));
    delays.push(days);
  }

  if (delays.length === 0) {
    return 0;
  }

  return Math.round(delays.reduce((sum, value) => sum + value, 0) / delays.length);
}

function computeAverageInvoiceAmount(rows: AverageInvoiceRow[]): number {
  if (rows.length === 0) {
    return 0;
  }

  const total = rows.reduce((sum, row) => sum + readInvoiceTotal(row), 0);
  return total / rows.length;
}

function formatMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-').map(Number);
  const date = new Date(year, month - 1, 1);

  return new Intl.DateTimeFormat('fr-FR', { month: 'short' }).format(date);
}

function aggregateTopClients(rows: PaidInvoiceWithClient[]): TopClient[] {
  const totals = new Map<string, number>();

  for (const row of rows) {
    const name = resolveClientName(row.clients);
    totals.set(name, (totals.get(name) ?? 0) + (row.total ?? 0));
  }

  return [...totals.entries()]
    .map(([name, revenue]) => ({ name, revenue }))
    .sort((left, right) => right.revenue - left.revenue)
    .slice(0, TOP_ITEMS_LIMIT);
}

function aggregateTopPrestations(rows: InvoiceItemWithStatus[]): TopPrestation[] {
  const totals = new Map<string, number>();

  for (const row of rows) {
    const invoice = Array.isArray(row.invoices) ? row.invoices[0] : row.invoices;

    if (invoice?.status !== 'paid') {
      continue;
    }

    const name = row.description.trim() || 'Prestation sans nom';
    totals.set(name, (totals.get(name) ?? 0) + row.line_total_ht);
  }

  return [...totals.entries()]
    .map(([name, revenue]) => ({ name, revenue }))
    .sort((left, right) => right.revenue - left.revenue)
    .slice(0, TOP_ITEMS_LIMIT);
}

function mapActivityRows(rows: ActivityRow[], type: ActivityItem['type']): ActivityItem[] {
  return rows.map((row) => ({
    id: row.id,
    type,
    label:
      type === 'invoice'
        ? `Facture ${row.number} · ${resolveClientName(row.clients)}`
        : `Devis ${row.number} · ${resolveClientName(row.clients)}`,
    date: row.issued_at ?? row.created_at,
  }));
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
    extended: createEmptyExtendedDashboardData(),
    recentInvoices: [],
  };
}

export async function fetchDashboardStats(scope: DataScope): Promise<DashboardStats> {
  const monthStart = getMonthStartIso();
  const weekStart = getWeekStartIso();
  const weekEnd = getWeekEndIso();
  const yearStart = getYearStartIso();
  const todayStart = getTodayStartIso();
  const nowIso = new Date().toISOString();
  const sevenDaysAgo = getDaysAgoIso(7);

  const [
    monthlyRevenueResult,
    weeklyRevenueResult,
    yearlyRevenueResult,
    todayRevenueResult,
    unpaidResult,
    outstandingResult,
    outstandingAmountResult,
    lateResult,
    paidResult,
    clientsResult,
    pendingQuotesResult,
    draftInvoicesResult,
    draftQuotesResult,
    dueThisWeekResult,
    staleQuotesResult,
    paymentDelayResult,
    averageInvoiceResult,
  ] = await Promise.all([
    supabase
      .from('invoices')
      .select('total')
      .eq('company_id', scope.companyId)
      .eq('status', 'paid')
      .gte('issued_at', monthStart),
    supabase
      .from('invoices')
      .select('total')
      .eq('company_id', scope.companyId)
      .eq('status', 'paid')
      .gte('paid_at', weekStart),
    supabase
      .from('invoices')
      .select('total')
      .eq('company_id', scope.companyId)
      .eq('status', 'paid')
      .gte('paid_at', yearStart),
    supabase
      .from('invoices')
      .select('total')
      .eq('company_id', scope.companyId)
      .eq('status', 'paid')
      .gte('paid_at', todayStart),
    supabase
      .from('invoices')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', scope.companyId)
      .in('status', [...UNPAID_INVOICE_STATUSES]),
    supabase
      .from('invoices')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', scope.companyId)
      .in('status', [...UNPAID_INVOICE_STATUSES]),
    supabase
      .from('invoices')
      .select('total_ttc, total, status, invoice_payments(amount)')
      .eq('company_id', scope.companyId)
      .in('status', [...UNPAID_INVOICE_STATUSES]),
    supabase
      .from('invoices')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', scope.companyId)
      .or(`status.eq.overdue,status.eq.partially_paid,and(due_at.lt.${nowIso},status.neq.paid,status.neq.canceled)`),
    supabase
      .from('invoices')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', scope.companyId)
      .eq('status', 'paid'),
    supabase
      .from('clients')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', scope.companyId)
      .is('deleted_at', null),
    supabase
      .from('quotes')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', scope.companyId)
      .eq('status', 'sent'),
    supabase
      .from('invoices')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', scope.companyId)
      .eq('status', 'draft'),
    supabase
      .from('quotes')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', scope.companyId)
      .eq('status', 'draft'),
    supabase
      .from('invoices')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', scope.companyId)
      .in('status', [...UNPAID_INVOICE_STATUSES])
      .gte('due_at', weekStart)
      .lt('due_at', weekEnd),
    supabase
      .from('quotes')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', scope.companyId)
      .eq('status', 'sent')
      .lt('issued_at', sevenDaysAgo),
    supabase
      .from('invoices')
      .select('issued_at, paid_at')
      .eq('company_id', scope.companyId)
      .eq('status', 'paid')
      .not('paid_at', 'is', null),
    supabase
      .from('invoices')
      .select('total_ttc, total')
      .eq('company_id', scope.companyId)
      .neq('status', 'canceled')
      .neq('status', 'draft'),
  ]);

  const outstandingRows = (outstandingAmountResult.data as OutstandingInvoiceRow[] | null) ?? [];

  return {
    monthlyRevenue: getSumFromRows(
      monthlyRevenueResult.data,
      monthlyRevenueResult.error,
      'fetchDashboardStats.monthlyRevenue',
    ),
    weeklyRevenue: getSumFromRows(
      weeklyRevenueResult.data,
      weeklyRevenueResult.error,
      'fetchDashboardStats.weeklyRevenue',
    ),
    yearlyRevenue: getSumFromRows(
      yearlyRevenueResult.data,
      yearlyRevenueResult.error,
      'fetchDashboardStats.yearlyRevenue',
    ),
    todayRevenue: getSumFromRows(
      todayRevenueResult.data,
      todayRevenueResult.error,
      'fetchDashboardStats.todayRevenue',
    ),
    unpaidInvoices: getCountFromQuery(
      unpaidResult.count,
      unpaidResult.error,
      'fetchDashboardStats.unpaidInvoices',
    ),
    outstandingInvoices: getCountFromQuery(
      outstandingResult.count,
      outstandingResult.error,
      'fetchDashboardStats.outstandingInvoices',
    ),
    outstandingAmount: computeOutstandingAmount(outstandingRows),
    lateInvoices: getCountFromQuery(
      lateResult.count,
      lateResult.error,
      'fetchDashboardStats.lateInvoices',
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
    pendingQuotes: getCountFromQuery(
      pendingQuotesResult.count,
      pendingQuotesResult.error,
      'fetchDashboardStats.pendingQuotes',
    ),
    draftInvoices: getCountFromQuery(
      draftInvoicesResult.count,
      draftInvoicesResult.error,
      'fetchDashboardStats.draftInvoices',
    ),
    draftQuotes: getCountFromQuery(
      draftQuotesResult.count,
      draftQuotesResult.error,
      'fetchDashboardStats.draftQuotes',
    ),
    dueThisWeek: getCountFromQuery(
      dueThisWeekResult.count,
      dueThisWeekResult.error,
      'fetchDashboardStats.dueThisWeek',
    ),
    staleQuotes: getCountFromQuery(
      staleQuotesResult.count,
      staleQuotesResult.error,
      'fetchDashboardStats.staleQuotes',
    ),
    averagePaymentDelayDays: computeAveragePaymentDelayDays(
      (paymentDelayResult.data as PaidInvoiceDelayRow[] | null) ?? [],
    ),
    averageInvoiceAmount: computeAverageInvoiceAmount(
      (averageInvoiceResult.data as AverageInvoiceRow[] | null) ?? [],
    ),
  };
}

export async function fetchExtendedDashboardData(scope: DataScope): Promise<ExtendedDashboardData> {
  const twelveMonthsAgo = getTwelveMonthsAgoIso();
  const monthKeys = buildLastMonthKeys();

  const [
    revenueByMonthResult,
    topClientsResult,
    topPrestationsResult,
    recentInvoicesResult,
    recentQuotesResult,
  ] = await Promise.all([
    supabase
      .from('invoices')
      .select('total, paid_at, issued_at')
      .eq('company_id', scope.companyId)
      .eq('status', 'paid')
      .gte('issued_at', twelveMonthsAgo),
    supabase
      .from('invoices')
      .select('total, clients(name, company)')
      .eq('company_id', scope.companyId)
      .eq('status', 'paid'),
    supabase
      .from('invoice_items')
      .select('description, line_total_ht, invoices!inner(status, company_id)')
      .eq('invoices.company_id', scope.companyId),
    supabase
      .from('invoices')
      .select('id, number, status, created_at, issued_at, clients(name, company)')
      .eq('company_id', scope.companyId)
      .order('created_at', { ascending: false })
      .limit(RECENT_ACTIVITY_LIMIT),
    supabase
      .from('quotes')
      .select('id, number, status, created_at, issued_at, clients(name, company)')
      .eq('company_id', scope.companyId)
      .order('created_at', { ascending: false })
      .limit(RECENT_ACTIVITY_LIMIT),
  ]);

  if (revenueByMonthResult.error) {
    logSupabaseError('fetchExtendedDashboardData.revenueByMonth', revenueByMonthResult.error);
  }

  if (topClientsResult.error) {
    logSupabaseError('fetchExtendedDashboardData.topClients', topClientsResult.error);
  }

  if (topPrestationsResult.error) {
    logSupabaseError('fetchExtendedDashboardData.topPrestations', topPrestationsResult.error);
  }

  if (recentInvoicesResult.error) {
    logSupabaseError('fetchExtendedDashboardData.recentInvoices', recentInvoicesResult.error);
  }

  if (recentQuotesResult.error) {
    logSupabaseError('fetchExtendedDashboardData.recentQuotes', recentQuotesResult.error);
  }

  const revenueTotals = new Map(monthKeys.map((month) => [month, 0]));

  for (const row of revenueByMonthResult.data ?? []) {
    const sourceDate = row.paid_at ?? row.issued_at;

    if (!sourceDate) {
      continue;
    }

    const date = new Date(sourceDate);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    if (revenueTotals.has(key)) {
      revenueTotals.set(key, (revenueTotals.get(key) ?? 0) + (row.total ?? 0));
    }
  }

  const revenueByMonth: MonthlyRevenue[] = monthKeys.map((month) => ({
    month: formatMonthLabel(month),
    amount: revenueTotals.get(month) ?? 0,
  }));

  const topClients = aggregateTopClients((topClientsResult.data as PaidInvoiceWithClient[] | null) ?? []);
  const topPrestations = aggregateTopPrestations(
    (topPrestationsResult.data as InvoiceItemWithStatus[] | null) ?? [],
  );

  const recentActivity = [
    ...mapActivityRows((recentInvoicesResult.data as ActivityRow[] | null) ?? [], 'invoice'),
    ...mapActivityRows((recentQuotesResult.data as ActivityRow[] | null) ?? [], 'quote'),
  ]
    .sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime())
    .slice(0, RECENT_ACTIVITY_LIMIT);

  return {
    revenueByMonth,
    topClients,
    topPrestations,
    recentActivity,
  };
}

export async function fetchRecentInvoices(scope: DataScope): Promise<Invoice[]> {
  const { data, error } = await supabase
    .from('invoices')
    .select(RECENT_INVOICE_COLUMNS)
    .eq('company_id', scope.companyId)
    .order('issued_at', { ascending: false, nullsFirst: false })
    .limit(RECENT_INVOICES_LIMIT);

  if (error) {
    logSupabaseError('fetchRecentInvoices', error);
    return [];
  }

  return (data as unknown as InvoiceWithClient[] | null)?.map(mapInvoiceRowToDashboardInvoice) ?? [];
}

export async function fetchDashboardData(
  scope: DataScope,
  metadata: UserMetadata,
): Promise<DashboardData> {
  const [profile, stats, extended, recentInvoices] = await Promise.all([
    fetchUserProfile(scope.userId),
    fetchDashboardStats(scope),
    fetchExtendedDashboardData(scope),
    fetchRecentInvoices(scope),
  ]);

  return {
    profile,
    display: resolveDashboardProfile(profile, metadata),
    stats,
    extended,
    recentInvoices,
  };
}
