import type { DataScope } from '@/types/tenant';

export function requireScope(scope: DataScope | null): DataScope {
  if (!scope?.userId || !scope.companyId) {
    throw new Error('Aucune entreprise active.');
  }

  return scope;
}
