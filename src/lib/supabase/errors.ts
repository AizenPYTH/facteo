import type { PostgrestError } from '@supabase/supabase-js';

export function logSupabaseError(context: string, error: PostgrestError): void {
  console.error(`[Supabase] ${context}:`, error.message);
}

export function getCountFromQuery(
  count: number | null | undefined,
  error: PostgrestError | null,
  context: string,
): number {
  if (error) {
    logSupabaseError(context, error);
    return 0;
  }

  return count ?? 0;
}

export function getSumFromRows<T extends { total: number | null }>(
  rows: T[] | null,
  error: PostgrestError | null,
  context: string,
): number {
  if (error) {
    logSupabaseError(context, error);
    return 0;
  }

  if (!rows?.length) {
    return 0;
  }

  return rows.reduce((sum, row) => sum + (row.total ?? 0), 0);
}
