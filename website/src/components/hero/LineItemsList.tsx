'use client';

import React from 'react';

import LineItem from '@/components/hero/LineItem';

export default function LineItemsList({
  items,
  revealedCount,
}: {
  items: { label: string; price: number }[];
  revealedCount: number;
}) {
  return (
    <div>
      <div className="mb-2 hidden grid-cols-[1fr_auto] gap-4 px-1 text-[10px] font-medium uppercase tracking-[0.14em] text-muted sm:grid">
        <span>Prestation</span>
        <span>Montant HT</span>
      </div>
      <div className="overflow-hidden rounded-xl border border-[rgba(15,23,42,0.06)] bg-white/70">
        {items.map((it, i) => (
          <LineItem
            delay={i * 0.08}
            key={it.label}
            label={it.label}
            value={it.price}
            visible={i < revealedCount}
          />
        ))}
      </div>
    </div>
  );
}
