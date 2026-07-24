'use client';

import { useEffect, useState } from 'react';

type Item = { label: string; price: number };

export function useInvoiceSimulation() {
  const [items] = useState<Item[]>(() => [
    { label: 'Conception site web', price: 650.0 },
    { label: 'Maintenance (1 an)', price: 150.0 },
    { label: 'Hébergement', price: 49.0 },
  ]);

  const [revealedCount, setRevealedCount] = useState(0);
  const [showPdf, setShowPdf] = useState(false);
  const [signed, setSigned] = useState(false);
  const [paid, setPaid] = useState(false);
  const tvaRate = 0.2;

  useEffect(() => {
    const timers: number[] = [];
    const base = 600;

    items.forEach((_, i) => {
      const id = window.setTimeout(() => setRevealedCount((c) => c + 1), base + i * 400);
      timers.push(id);
    });

    // show PDF after items
    timers.push(window.setTimeout(() => setShowPdf(true), base + items.length * 420 + 300));

    // signature after total
    timers.push(window.setTimeout(() => setSigned(true), base + items.length * 420 + 900));

    // paid stamp
    timers.push(window.setTimeout(() => setPaid(true), base + items.length * 420 + 1400));

    return () => {
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, [items]);

  const subtotal = items.reduce((s, it) => s + it.price, 0);

  return { items, revealedCount, showPdf, signed, paid, subtotal, tvaRate, client: { name: 'Société Durand' } } as const;
}
