import type { Quote } from '@/types/quote';

export const QUOTES_PAGE_SIZE = 20;

export type QuotesPageParams = {
  search?: string;
  page?: number;
  pageSize?: number;
};

export type QuotesPage = {
  quotes: Quote[];
  nextPage: number | null;
  totalCount: number | null;
};
