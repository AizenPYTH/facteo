import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/**
 * Reflète le réglage système « Réduire les animations » (iOS) / « Supprimer les
 * animations » (Android). Les composants animés doivent le respecter : on coupe
 * le mouvement, jamais le changement d'état.
 */
export function useReduceMotion(): boolean {
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    let mounted = true;

    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (mounted) {
          setReduce(enabled);
        }
      })
      .catch(() => {
        // Réglage indisponible : on garde les animations.
      });

    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', (enabled) => {
      if (mounted) {
        setReduce(enabled);
      }
    });

    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);

  return reduce;
}
