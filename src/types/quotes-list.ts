import type { Quote, QuoteStatus } from '@/types/quote';

export const QUOTES_PAGE_SIZE = 20;

export type QuoteStatusFilter = 'all' | QuoteStatus;

export const QUOTE_STATUS_FILTER_OPTIONS: {
  value: QuoteStatusFilter;
  label: string;
}[] = [
  { value: 'all', label: 'Tous' },
  { value: 'draft', label: 'Brouillons' },
  { value: 'sent', label: 'Envoyés' },
  { value: 'accepted', label: 'Acceptés' },
  { value: 'rejected', label: 'Refusés' },
  { value: 'expired', label: 'Expirés' },
];

export type QuotesPageParams = {
  search?: string;
  status?: QuoteStatusFilter;
  page?: number;
  pageSize?: number;
};

export type QuotesPage = {
  quotes: Quote[];
  nextPage: number | null;
  totalCount: number | null;
};
