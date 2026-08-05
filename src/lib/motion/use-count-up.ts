import { useEffect, useRef, useState } from 'react';

type UseCountUpOptions = {
  /** Total animation duration in ms. */
  duration?: number;
  /** Formats the in-progress numeric value into display text. */
  formatter?: (value: number) => string;
  /**
   * When false, returns a formatted `value` without animating.
   * Keeps hook order stable when the caller sometimes has no numeric target.
   */
  enabled?: boolean;
};

function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
}

/**
 * Animates a numeric value to `value` on the **JS thread** and returns the
 * current display string for a normal `<Text>`.
 *
 * Do NOT drive this via Reanimated `useAnimatedProps({ text })` on
 * `Animated.Text`: that path crashes in iOS release (TF builds 23 & 25) when
 * a non-worklet formatter (e.g. `Intl.NumberFormat` / `formatCurrency`) runs
 * on the UI thread.
 */
export function useCountUp(
  value: number,
  {
    duration = 900,
    formatter = (v) => String(Math.round(v)),
    enabled = true,
  }: UseCountUpOptions = {},
): string {
  const formatterRef = useRef(formatter);
  formatterRef.current = formatter;

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
      const current = from + (to - from) * easeOutCubic(progress);
      setDisplay(format(current));
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
