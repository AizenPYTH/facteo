import { FilterChipBar } from '@/components/ui/filter-chip';
import type { InvoiceStatusFilter } from '@/types/invoices-list';
import { INVOICE_STATUS_FILTER_OPTIONS } from '@/types/invoices-list';

type InvoiceStatusFilterBarProps = {
  value: InvoiceStatusFilter;
  onChange: (value: InvoiceStatusFilter) => void;
};

/** Filtres de statut. Délègue au socle : la barre n'a plus de style propre. */
export function InvoiceStatusFilterBar({ value, onChange }: InvoiceStatusFilterBarProps) {
  return (
    <FilterChipBar
      onChange={onChange}
      options={INVOICE_STATUS_FILTER_OPTIONS}
      value={value}
    />
  );
}
