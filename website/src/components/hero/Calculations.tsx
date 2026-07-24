'use client';

import React, { useEffect, useState } from 'react';

import TotalCounter from '@/components/hero/TotalCounter';

export default function Calculations({
  subtotal,
  tvaRate = 0.2,
  showTva = true,
}: {
  subtotal: number;
  tvaRate?: number;
  showTva?: boolean;
}) {
  const [tva, setTva] = useState(0);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const nextTva = Math.round(subtotal * tvaRate * 100) / 100;
    setTva(nextTva);
    setTotal(Math.round((subtotal + nextTva) * 100) / 100);
  }, [subtotal, tvaRate]);

  return (
    <div className="w-full max-w-[17.5rem] rounded-2xl border border-[rgba(15,23,42,0.07)] bg-white/80 p-4 text-right shadow-[0_8px_24px_-16px_rgba(15,23,42,0.35)] backdrop-blur-sm sm:p-5">
      <div className="flex justify-between gap-6 text-sm text-muted">
        <span>Sous-total</span>
        <span className="font-mono tabular-nums text-foreground/80">{subtotal.toFixed(2)} €</span>
      </div>
      {showTva ? (
        <div className="mt-2.5 flex justify-between gap-6 text-sm text-muted">
          <span>TVA ({Math.round(tvaRate * 100)}%)</span>
          <span className="font-mono tabular-nums text-foreground/80">{tva.toFixed(2)} €</span>
        </div>
      ) : null}
      <div className="mt-3.5 border-t border-[rgba(15,23,42,0.08)] pt-3.5">
        <div className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted">Total TTC</div>
        <div className="mt-1 text-2xl font-semibold tracking-tight text-foreground sm:text-[1.75rem]">
          <TotalCounter value={total} />
        </div>
      </div>
    </div>
  );
}
