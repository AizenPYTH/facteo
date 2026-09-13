import { FilterChipBar } from '@/components/ui/filter-chip';
import type { QuoteStatusFilter } from '@/types/quotes-list';
import { QUOTE_STATUS_FILTER_OPTIONS } from '@/types/quotes-list';

type QuoteStatusFilterBarProps = {
  value: QuoteStatusFilter;
  onChange: (value: QuoteStatusFilter) => void;
};

/** Filtres de statut. Délègue au socle : la barre n'a plus de style propre. */
export function QuoteStatusFilterBar({ value, onChange }: QuoteStatusFilterBarProps) {
  return (
    <FilterChipBar onChange={onChange} options={QUOTE_STATUS_FILTER_OPTIONS} value={value} />
  );
}
