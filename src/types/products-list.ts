import type { Product } from '@/types/product';

export const PRODUCTS_PAGE_SIZE = 20;

export type ProductsPageParams = {
  search?: string;
  page?: number;
  pageSize?: number;
};

export type ProductsPage = {
  products: Product[];
  nextPage: number | null;
  totalCount: number | null;
};
