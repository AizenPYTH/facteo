export type DashboardStats = {
  monthlyRevenue: number;
  unpaidInvoices: number;
  paidInvoices: number;
  totalClients: number;
};

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue';

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
    unpaidInvoices: 0,
    paidInvoices: 0,
    totalClients: 0,
  };
}

/** @deprecated Use createEmptyDashboardStats() */
export const EMPTY_DASHBOARD_STATS = createEmptyDashboardStats();
