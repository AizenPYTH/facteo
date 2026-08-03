import { StatusFilterBar } from '@/components/ui/status-filter-bar';
import type { InvoiceStatusFilter } from '@/types/invoices-list';
import { INVOICE_STATUS_FILTER_OPTIONS } from '@/types/invoices-list';

type InvoiceStatusFilterBarProps = {
  value: InvoiceStatusFilter;
  onChange: (value: InvoiceStatusFilter) => void;
};

export function InvoiceStatusFilterBar({ value, onChange }: InvoiceStatusFilterBarProps) {
  return (
    <StatusFilterBar onChange={onChange} options={INVOICE_STATUS_FILTER_OPTIONS} value={value} />
  );
}
