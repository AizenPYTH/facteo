'use client';

import React, { useEffect, useState } from 'react';
import TotalCounter from '@/components/hero/TotalCounter';

export default function Calculations({ subtotal, tvaRate = 0.2, showTva = true }: { subtotal: number; tvaRate?: number; showTva?: boolean }) {
  const [tva, setTva] = useState(0);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const _tva = Math.round(subtotal * tvaRate * 100) / 100;
    setTva(_tva);
    setTotal(Math.round((subtotal + _tva) * 100) / 100);
  }, [subtotal, tvaRate]);

  return (
    <div className="w-64 rounded-lg border border-border bg-surface p-4 text-right">
      <div className="flex justify-between text-sm text-muted"><span>Sous-total</span><span>{subtotal.toFixed(2)} €</span></div>
      {showTva ? <div className="mt-2 flex justify-between text-sm text-muted"><span>TVA ({Math.round(tvaRate * 100)}%)</span><span>{tva.toFixed(2)} €</span></div> : null}
      <div className="mt-3 border-t border-border pt-3">
        <div className="text-xs text-muted">Total</div>
        <div className="text-2xl font-bold text-foreground"><TotalCounter value={total} /></div>
      </div>
    </div>
  );
}
