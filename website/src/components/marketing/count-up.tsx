'use client';

import { useEffect, useRef, useState } from 'react';
import { useInView } from 'framer-motion';

function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
}

export function CountUp({
  value,
  suffix = '',
  duration = 1.6,
  className,
}: {
  value: number;
  suffix?: string;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-40px' });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!isInView) return;

    const start = performance.now();
    let frame = 0;

    function tick(now: number) {
      const progress = Math.min(1, (now - start) / (duration * 1000));
      setDisplay(Math.round(easeOutCubic(progress) * value));
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    }

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [isInView, value, duration]);

  return (
    <span className={className} ref={ref}>
      {display.toLocaleString('fr-FR')}
      {suffix}
    </span>
  );
}
