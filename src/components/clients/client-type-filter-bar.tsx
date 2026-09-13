import { FilterChipBar } from '@/components/ui/filter-chip';

export type ClientTypeFilter = 'all' | 'company' | 'individual';

const OPTIONS: { value: ClientTypeFilter; label: string }[] = [
  { value: 'all', label: 'Tous' },
  { value: 'company', label: 'Professionnels' },
  { value: 'individual', label: 'Particuliers' },
];

type ClientTypeFilterBarProps = {
  value: ClientTypeFilter;
  onChange: (value: ClientTypeFilter) => void;
};

/** Filtres de type de client. Délègue au socle, comme factures et devis. */
export function ClientTypeFilterBar({ value, onChange }: ClientTypeFilterBarProps) {
  return <FilterChipBar onChange={onChange} options={OPTIONS} value={value} />;
}
