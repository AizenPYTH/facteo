import { StatusFilterBar } from '@/components/ui/status-filter-bar';
import type { QuoteStatusFilter } from '@/types/quotes-list';
import { QUOTE_STATUS_FILTER_OPTIONS } from '@/types/quotes-list';

type QuoteStatusFilterBarProps = {
  value: QuoteStatusFilter;
  onChange: (value: QuoteStatusFilter) => void;
};

export function QuoteStatusFilterBar({ value, onChange }: QuoteStatusFilterBarProps) {
  return <StatusFilterBar onChange={onChange} options={QUOTE_STATUS_FILTER_OPTIONS} value={value} />;
}
