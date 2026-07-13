export type MonthlyRevenue = {
  month: string;
  amount: number;
};

export type TopClient = {
  name: string;
  revenue: number;
};

export type TopPrestation = {
  name: string;
  revenue: number;
};

export type ActivityType = 'invoice' | 'quote';

export type ActivityItem = {
  id: string;
  type: ActivityType;
  label: string;
  date: string;
};

export type DashboardStats = {
  monthlyRevenue: number;
  weeklyRevenue: number;
  yearlyRevenue: number;
  unpaidInvoices: number;
  paidInvoices: number;
  totalClients: number;
  todayRevenue: number;
  outstandingInvoices: number;
  outstandingAmount: number;
  lateInvoices: number;
  pendingQuotes: number;
  averagePaymentDelayDays: number;
  averageInvoiceAmount: number;
};

export type ExtendedDashboardData = {
  revenueByMonth: MonthlyRevenue[];
  topClients: TopClient[];
  topPrestations: TopPrestation[];
  recentActivity: ActivityItem[];
};

export type InvoiceStatus =
  | 'draft'
  | 'sent'
  | 'partially_paid'
  | 'paid'
  | 'overdue'
  | 'canceled';

export type Invoice = {
  id: string;
  number: string;
  clientName: string;
  amount: number;
  status: InvoiceStatus;
  issuedAt: string;
};

export function createEmptyDashboardStats(): DashboardStats {
  return {
    monthlyRevenue: 0,
    weeklyRevenue: 0,
    yearlyRevenue: 0,
    unpaidInvoices: 0,
    paidInvoices: 0,
    totalClients: 0,
    todayRevenue: 0,
    outstandingInvoices: 0,
    outstandingAmount: 0,
    lateInvoices: 0,
    pendingQuotes: 0,
    averagePaymentDelayDays: 0,
    averageInvoiceAmount: 0,
  };
}

export function createEmptyExtendedDashboardData(): ExtendedDashboardData {
  return {
    revenueByMonth: [],
    topClients: [],
    topPrestations: [],
    recentActivity: [],
  };
}

/** @deprecated Use createEmptyDashboardStats() */
export const EMPTY_DASHBOARD_STATS = createEmptyDashboardStats();
