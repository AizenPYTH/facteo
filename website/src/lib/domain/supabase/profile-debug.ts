import { IS_DEV } from '@/lib/runtime';

/**
 * Logs temporaires de diagnostic profil — à supprimer après validation.
 * Actif uniquement en développement.
 */
export function debugProfileTrace(scope: string, payload: Record<string, unknown>): void {
  if (!IS_DEV) {
    return;
  }

  console.log(`[Factume:profile-debug] ${scope}`, payload);
}
