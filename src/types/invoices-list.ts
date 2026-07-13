import type { Invoice, InvoiceStatus } from '@/types/invoice';

export const INVOICES_PAGE_SIZE = 20;

export type InvoiceStatusFilter = 'all' | InvoiceStatus;

export const INVOICE_STATUS_FILTER_OPTIONS: {
  value: InvoiceStatusFilter;
  label: string;
}[] = [
  { value: 'all', label: 'Tous' },
  { value: 'paid', label: 'Payées' },
  { value: 'sent', label: 'Envoyées' },
  { value: 'canceled', label: 'Annulées' },
  { value: 'draft', label: 'Brouillons' },
  { value: 'partially_paid', label: 'Partiellement payées' },
  { value: 'overdue', label: 'En retard' },
];

export type InvoicesPageParams = {
  search?: string;
  status?: InvoiceStatusFilter;
  page?: number;
  pageSize?: number;
};

export type InvoicesPage = {
  invoices: Invoice[];
  nextPage: number | null;
  totalCount: number | null;
};
