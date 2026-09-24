'use client';

import { useId } from 'react';

import { cn } from '@/lib/utils';
import {
  STAMP_COLOR_LABELS,
  STAMP_COLOR_VALUES,
  STAMP_COLORS,
  STAMP_POSITION_LABELS,
  STAMP_POSITIONS,
  type StampColor,
  type StampPosition,
} from '@/types/pdf-options';

const CHIP =
  'rounded-app-field border px-2.5 py-[6px] text-[12.5px] font-semibold transition-[background-color,border-color,color] duration-150';
const CHIP_ON = 'border-app-accent-border bg-app-accent-tint text-app-accent-strong';
const CHIP_OFF = 'border-app-border text-app-muted hover:border-app-accent hover:text-app-text';

/** Couleur et emplacement du tampon « Facture payée ». À la création comme après. */
export function StampPicker({
  color,
  onColorChange,
  onPositionChange,
  position,
}: {
  color: StampColor;
  onColorChange: (value: StampColor) => void;
  onPositionChange: (value: StampPosition) => void;
  position: StampPosition;
}) {
  const idPrefix = useId();

  return (
    <div className="space-y-3.5">
      <div>
        <p className="mb-1.5 text-[12px] font-medium text-app-text-3" id={`${idPrefix}-stamp-color`}>
          Tampon « Facture payée » : couleur
        </p>
        <div aria-labelledby={`${idPrefix}-stamp-color`} className="flex flex-wrap gap-1.5" role="group">
          {STAMP_COLORS.map((entry) => {
            const active = color === entry;

            return (
              <button
                aria-pressed={active}
                className={cn(CHIP, 'inline-flex items-center gap-1.5', active ? CHIP_ON : CHIP_OFF)}
                key={entry}
                onClick={() => onColorChange(entry)}
                type="button">
                <span
                  aria-hidden
                  className="size-2.5 rounded-full border border-black/10"
                  style={{
                    background:
                      entry === 'auto'
                        ? 'conic-gradient(#0B7A4B, #1F4FD1, #C0392B, #0B7A4B)'
                        : STAMP_COLOR_VALUES[entry],
                  }}
                />
                {STAMP_COLOR_LABELS[entry]}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-[12px] font-medium text-app-text-3" id={`${idPrefix}-stamp-position`}>
          Tampon « Facture payée » : emplacement
        </p>
        <div aria-labelledby={`${idPrefix}-stamp-position`} className="flex gap-1.5" role="group">
          {STAMP_POSITIONS.map((entry) => {
            const active = position === entry;

            return (
              <button
                aria-pressed={active}
                className={cn(CHIP, 'flex-1 px-1.5 text-center', active ? CHIP_ON : CHIP_OFF)}
                key={entry}
                onClick={() => onPositionChange(entry)}
                type="button">
                {STAMP_POSITION_LABELS[entry]}
              </button>
            );
          })}
        </div>
        <p className="mt-1.5 text-[11.5px] leading-relaxed text-app-muted-2">
          Le tampon apparaît dès que la facture est payée. « Près des totaux » s’adapte au modèle choisi.
        </p>
      </div>
    </div>
  );
}
