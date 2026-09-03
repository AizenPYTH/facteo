import { useEffect, useRef, useState } from 'react';

type UseCountUpOptions = {
  /** Durée totale de l'animation, en millisecondes. */
  duration?: number;
  /** Met en forme la valeur intermédiaire pour l'affichage. */
  formatter?: (value: number) => string;
  /**
   * À false, renvoie la valeur formatée sans animer. L'ordre des hooks reste
   * stable quand l'appelant n'a pas toujours de cible numérique.
   */
  enabled?: boolean;
};

function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
}

/**
 * Anime un nombre jusqu'à `value` sur le **thread JS** et renvoie la chaîne à
 * afficher dans un `<Text>` ordinaire.
 *
 * Ne PAS repasser par Reanimated `useAnimatedProps({ text })` sur
 * `Animated.Text` : ce chemin plante en release iOS (builds TestFlight 23 et
 * 25) dès qu'un formateur non-worklet — `Intl.NumberFormat`, donc
 * `formatCurrency` — s'exécute sur le thread UI.
 */
export function useCountUp(
  value: number,
  { duration = 900, formatter = (v) => String(Math.round(v)), enabled = true }: UseCountUpOptions = {},
): string {
  // Le formateur est souvent une lambda définie à l'appel : le garder en
  // dépendance relancerait l'animation à chaque rendu. On le range dans une ref
  // mise à jour par un effet — l'assigner pendant le rendu est refusé par le
  // React Compiler. Cet effet est déclaré avant celui qui anime, donc la ref est
  // déjà à jour quand l'animation démarre.
  const formatterRef = useRef(formatter);
  useEffect(() => {
    formatterRef.current = formatter;
  }, [formatter]);

  const [display, setDisplay] = useState(() => formatter(value));
  const fromRef = useRef(0);

  useEffect(() => {
    const format = formatterRef.current;

    if (!enabled) {
      fromRef.current = value;
      setDisplay(format(value));
      return;
    }

    const from = fromRef.current;
    const to = value;
    let frameId = 0;
    let startMs: number | null = null;

    const tick = (now: number) => {
      if (startMs === null) {
        startMs = now;
      }
      const progress = Math.min(1, (now - startMs) / duration);
      setDisplay(format(from + (to - from) * easeOutCubic(progress)));
      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
      } else {
        fromRef.current = to;
      }
    };

    frameId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [value, duration, enabled]);

  return display;
}
