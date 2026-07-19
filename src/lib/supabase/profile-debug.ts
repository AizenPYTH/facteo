/**
 * Logs temporaires de diagnostic profil — à supprimer après validation.
 * Actif uniquement en __DEV__.
 */
export function debugProfileTrace(scope: string, payload: Record<string, unknown>): void {
  if (!__DEV__) {
    return;
  }

  console.log(`[Factume:profile-debug] ${scope}`, payload);
}
