'use client';

import React, { useEffect, useState } from 'react';
import { animate } from 'framer-motion';

export default function TotalCounter({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const controls = animate(display, value, {
      duration: 0.9,
      ease: [0.22, 1, 0.36, 1],
      onUpdate(v) {
        setDisplay(Number(v.toFixed(2)));
      },
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return <span>{display.toFixed(2)} €</span>;
}
