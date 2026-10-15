import { useEffect } from 'react';
import { AppState } from 'react-native';

import { trackSessionActive } from '@/lib/analytics/product-events';

/**
 * Présence quotidienne (suivi d'utilisation) : à l'ouverture de l'app et à
 * chaque retour au premier plan. Dédupliquée en base (une par jour).
 */
export function useActivityPing(userId: string | null | undefined) {
  useEffect(() => {
    if (!userId) return;
    trackSessionActive();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') trackSessionActive();
    });
    return () => subscription.remove();
  }, [userId]);
}
