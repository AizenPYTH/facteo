'use client';

import React from 'react';
import LineItem from '@/components/hero/LineItem';

export default function LineItemsList({ items, revealedCount }: { items: { label: string; price: number }[]; revealedCount: number; }) {
  return (
    <div className="rounded-lg bg-white/0 p-2">
      {items.map((it, i) => (
        <LineItem key={it.label} label={it.label} value={it.price} delay={i * 0.12} />
      ))}
    </div>
  );
}
