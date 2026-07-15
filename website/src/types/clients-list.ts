import type { Client } from '@/types/client';

export const CLIENTS_PAGE_SIZE = 20;

export type ClientsPageParams = {
  search?: string;
  page?: number;
  pageSize?: number;
};

export type ClientsPage = {
  clients: Client[];
  nextPage: number | null;
  totalCount: number | null;
};
