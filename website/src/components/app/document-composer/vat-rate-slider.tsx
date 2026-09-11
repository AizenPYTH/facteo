'use client';

import { parseVatRateInput } from '@/lib/domain/format/decimal';
import { cn } from '@/lib/utils';

export function VatRateSlider({
  className,
  compact = false,
  onChange,
  value,
}: {
  className?: string;
  compact?: boolean;
  onChange: (next: string) => void;
  value: string;
}) {
  const numeric = clampVatRate(parseVatRateInput(value));

  return (
    <div className={cn('flex min-w-0 flex-col gap-1', className)}>
      <div className="flex items-center justify-between gap-2">
        {compact ? null : (
          <span className="text-[10.5px] font-bold uppercase tracking-[0.07em] text-app-muted-2">
            TVA
          </span>
        )}
        <span
          className={cn(
            'app-num text-[12px] font-semibold text-app-text',
            compact ? 'ml-auto' : undefined,
          )}>
          {numeric} %
        </span>
      </div>
      <input
        aria-label="Taux de TVA"
        aria-valuemax={100}
        aria-valuemin={0}
        aria-valuenow={numeric}
        className="app-vat-slider"
        max={100}
        min={0}
        onChange={(event) => onChange(event.target.value)}
        step={1}
        type="range"
        value={numeric}
      />
    </div>
  );
}

function clampVatRate(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.min(100, Math.max(0, Math.round(value)));
}
