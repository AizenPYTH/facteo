'use client';

import { useEffect, useState } from 'react';

export function useInvoiceSimulation() {
  const [items] = useState(() => [
    { label: 'Installation électrique — 3 pièces', price: 1280.0 },
    { label: 'Mise en conformité tableau', price: 420.0 },
    { label: 'Déplacement & diagnostic', price: 95.0 },
  ]);

  const [revealedCount, setRevealedCount] = useState(0);
  const [showPdf, setShowPdf] = useState(false);
  const [signed, setSigned] = useState(false);
  const [paid, setPaid] = useState(false);
  const tvaRate = 0.20;

  useEffect(() => {
    let time = 600;
    items.forEach((_, i) => {
      setTimeout(() => setRevealedCount((c) => c + 1), time + i * 400);
    });

    // show TVA and PDF after items
    setTimeout(() => setShowPdf(true), time + items.length * 420 + 300);

    // signature after total
    setTimeout(() => setSigned(true), time + items.length * 420 + 900);

    // paid stamp
    setTimeout(() => setPaid(true), time + items.length * 420 + 1400);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const subtotal = items.reduce((s, it) => s + it.price, 0);

  return {
    items,
    revealedCount,
    showPdf,
    signed,
    paid,
    subtotal,
    tvaRate,
    client: { name: 'Martin SARL' },
  };
}
