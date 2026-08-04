import { useEffect } from 'react';
import { Easing, useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';

type UseCountUpOptions = {
  /** Total animation duration in ms. */
  duration?: number;
  /** Formats the in-progress numeric value into display text. */
  formatter?: (value: number) => string;
};

/**
 * Animates a numeric value from its previous value to `value` on the UI
 * thread and patches the result straight onto a native Text node's `text`
 * prop — no React re-render per frame. Pair with `<Animated.Text />`:
 *
 *   const animatedProps = useCountUp(stats.monthlyRevenue, { formatter: formatCurrency });
 *   <Animated.Text animatedProps={animatedProps}>{formatCurrency(stats.monthlyRevenue)}</Animated.Text>
 *
 * The static children act as the pre-mount/SSR fallback; animatedProps takes
 * over once the UI thread starts committing frames.
 */
export function useCountUp(
  value: number,
  { duration = 900, formatter = (v) => String(Math.round(v)) }: UseCountUpOptions = {},
) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(value, {
      duration,
      easing: Easing.out(Easing.cubic),
    });
    // Intentionally omit `progress` from deps: reassigning a shared value's
    // `.value` must not restart the effect, only `value`/`duration` should.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration]);

  return useAnimatedProps(() => {
    return { text: formatter(progress.value) } as Record<string, unknown>;
  });
}
