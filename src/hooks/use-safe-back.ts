import { router, type Href } from 'expo-router';
import { useCallback } from 'react';

/**
 * Retour nommé gardé par canGoBack — DESIGN §4.
 * Si la pile est vide (deep link / cold start), repli sur la liste racine.
 */
export function useSafeBack(fallbackHref: Href) {
  return useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace(fallbackHref);
  }, [fallbackHref]);
}

export function safeBack(fallbackHref: Href) {
  if (router.canGoBack()) {
    router.back();
    return;
  }

  router.replace(fallbackHref);
}
