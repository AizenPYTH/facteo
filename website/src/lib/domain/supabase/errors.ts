import type { PostgrestError } from '@supabase/supabase-js';

type LoggableError = Pick<PostgrestError, 'message'> | { message?: string } | string | null | undefined;

export function logSupabaseError(context: string, error: LoggableError): void {
  const message =
    typeof error === 'string'
      ? error
      : error && typeof error === 'object' && 'message' in error && typeof error.message === 'string'
        ? error.message
        : 'Erreur Supabase inconnue.';

  console.error(`[Supabase] ${context}:`, message, error);
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
