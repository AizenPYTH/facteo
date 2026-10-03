'use client';

import { cn } from '@/lib/utils';

/**
 * Briques visuelles de l'éditeur (handoff « Nouvelle facture »). Toutes lisent
 * les jetons `iq-*`, définis sur `.iq-composer` (globals.css), clair et sombre.
 */

/** Panneau : fond surface, filet, rayon 18, sans ombre. */
export const IQ_PANEL = 'rounded-[18px] border border-iq-line bg-iq-surface';

/** Bouton secondaire bordé (Catalogue, Excel / CSV, Annuler…). */
export const IQ_BUTTON =
  'inline-flex h-[34px] shrink-0 items-center justify-center gap-[7px] rounded-[9px] border border-iq-line bg-iq-surface px-3 text-[13px] font-semibold text-iq-ink transition-colors duration-150 ease-out hover:bg-iq-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-iq-accent disabled:cursor-not-allowed disabled:opacity-50';

/** Bouton principal indigo. */
export const IQ_PRIMARY =
  'iq-shadow-primary inline-flex h-[38px] shrink-0 items-center justify-center gap-[7px] rounded-[10px] bg-iq-accent px-[18px] text-[13.5px] font-bold text-white transition-[filter,opacity] duration-150 ease-out hover:brightness-[1.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-iq-accent focus-visible:ring-offset-2 focus-visible:ring-offset-iq-surface disabled:cursor-not-allowed disabled:opacity-60';

/** Champ de saisie bordé (titre du document, numéro…). */
export const IQ_FIELD =
  'h-[38px] w-full rounded-[10px] border border-iq-line bg-iq-surface px-3 text-[14px] text-iq-ink outline-none transition-[border-color,box-shadow] duration-150 focus:border-iq-accent focus:shadow-[0_0_0_3px_var(--iq-accent-soft)]';

/** Cellule sans bordure du tableau des lignes : fond doux au survol, anneau indigo au focus. */
export const IQ_CELL =
  'h-[34px] w-full min-w-0 rounded-[8px] border-0 bg-transparent px-2 text-[14px] text-iq-ink outline-none transition-[background-color,box-shadow] duration-150 hover:bg-iq-soft focus:bg-iq-surface focus:shadow-[0_0_0_2px_var(--iq-accent)]';

export function Kbd({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex h-5 min-w-5 items-center justify-center rounded-[5px] border border-iq-line px-1.5 text-[11.5px] font-semibold text-iq-ink3',
        className,
      )}>
      {children}
    </span>
  );
}

/** Contrôle segmenté (Automatique / Personnalisé, emplacement du tampon, onglets du catalogue). */
export function Segmented<T extends string>({
  ariaLabel,
  className,
  itemClassName,
  onChange,
  options,
  value,
}: {
  ariaLabel?: string;
  className?: string;
  itemClassName?: string;
  onChange: (value: T) => void;
  options: { label: React.ReactNode; value: T }[];
  value: T;
}) {
  return (
    <div
      aria-label={ariaLabel}
      className={cn('flex flex-wrap gap-[3px] rounded-[10px] bg-iq-soft p-[3px]', className)}
      role="group">
      {options.map((option) => {
        const active = option.value === value;

        return (
          <button
            aria-pressed={active}
            className={cn(
              'h-8 flex-1 whitespace-nowrap rounded-[8px] px-2 text-[13px] font-semibold transition-[background-color,color,box-shadow] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-iq-accent',
              active
                ? 'bg-iq-surface text-iq-ink shadow-[0_1px_2px_var(--iq-shadow)]'
                : 'text-iq-ink3 hover:text-iq-ink2',
              itemClassName,
            )}
            key={option.value}
            onClick={() => onChange(option.value)}
            type="button">
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

/** Case à cocher 18 px du handoff (coche blanche sur indigo). */
export function CheckMark({ checked, className }: { checked: boolean; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        'flex size-[18px] shrink-0 items-center justify-center rounded-[5px] border-[1.5px] transition-colors duration-150',
        checked ? 'border-iq-accent bg-iq-accent' : 'border-iq-line bg-iq-surface',
        className,
      )}>
      <svg
        className={cn('transition-opacity duration-150', checked ? 'opacity-100' : 'opacity-0')}
        fill="none"
        height="12"
        stroke="#fff"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="3.2"
        viewBox="0 0 24 24"
        width="12">
        <path d="M5 12.5l4.5 4.5L19 7.5" />
      </svg>
    </span>
  );
}

/** Pastille 7 px + texte : état d'enregistrement. */
export type ComposerSaveTone = 'neutral' | 'saving' | 'saved' | 'dirty';

const SAVE_DOT: Record<ComposerSaveTone, string> = {
  neutral: 'bg-iq-ink3',
  saving: 'bg-iq-accent animate-pulse',
  saved: 'bg-iq-ok',
  dirty: 'bg-iq-warn',
};

export function SaveIndicator({
  className,
  label,
  tone,
}: {
  className?: string;
  label: string;
  tone: ComposerSaveTone;
}) {
  return (
    <span
      aria-live="polite"
      className={cn('flex items-center gap-2 text-[12.5px] text-iq-ink3', className)}>
      <span aria-hidden className={cn('size-[7px] shrink-0 rounded-full', SAVE_DOT[tone])} />
      {label}
    </span>
  );
}

/** Initiales d'un nom : « Groupe Méridien Bâtiment » → « GM ». */
export function initialsOf(name: string): string {
  const words = name
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .split(/[\s-]+/)
    .filter(Boolean);
  if (words.length === 0) return '·';
  const letters = words.length === 1 ? words[0].slice(0, 2) : words[0][0] + words[1][0];
  return letters.toUpperCase();
}

/** Format court d'un taux de TVA : 5.5 → « 5,5 % ». */
export function vatRateLabel(rate: number): string {
  return `${String(Math.round(rate * 100) / 100).replace('.', ',')} %`;
}
