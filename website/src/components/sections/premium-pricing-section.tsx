'use client';

import { Suspense } from 'react';

import { PricingSection } from '@/components/sections/pricing-section';

/** @deprecated Prefer PricingSection — conserve l’export pour compat landing. */
export function PremiumPricingSection({ showHeader = false }: { showHeader?: boolean }) {
  return (
    <Suspense fallback={<div className="min-h-[24rem] animate-pulse rounded-2xl bg-slate-100" />}>
      <PricingSection showHeader={showHeader} />
    </Suspense>
  );
}
