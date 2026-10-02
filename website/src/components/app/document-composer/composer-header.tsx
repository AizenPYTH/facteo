'use client';

import Link from 'next/link';

import {
  IQ_PRIMARY,
  SaveIndicator,
  type ComposerSaveTone,
} from '@/components/app/document-composer/ui';
import { formatCurrency } from '@/lib/domain/format/currency';
import { cn } from '@/lib/utils';

/** Logo INVEQ du handoff : quatre carrés indigo pivotés. */
function InveqMark() {
  return (
    <span aria-hidden className="grid rotate-45 grid-cols-[repeat(2,7px)] gap-[2px]">
      <span className="size-[7px] rounded-[2px] bg-iq-accent" />
      <span className="size-[7px] rounded-[2px] bg-iq-accent opacity-50" />
      <span className="size-[7px] rounded-[2px] bg-iq-accent opacity-50" />
      <span className="size-[7px] rounded-[2px] bg-iq-accent" />
    </span>
  );
}

/**
 * Barre supérieure collante (64 px) de l'éditeur sur ordinateur : logo, fil
 * d'Ariane, état d'enregistrement, Total TTC toujours visible, Annuler et action
 * principale.
 */
export function ComposerTopBar({
  crumbLabel,
  onCancel,
  onCrumbClick,
  onSubmit,
  pending,
  saveLabel,
  saveTone,
  submitLabel,
  title,
  total,
}: {
  crumbLabel: string;
  onCancel: () => void;
  onCrumbClick: () => void;
  onSubmit: () => void;
  pending?: boolean;
  saveLabel: string;
  saveTone: ComposerSaveTone;
  submitLabel: string;
  title: string;
  total: number;
}) {
  return (
    <header className="flex h-16 shrink-0 items-center gap-[18px] border-b border-iq-line bg-iq-surface px-5 min-[1200px]:px-9">
      <Link
        aria-label="INVEQ, tableau de bord"
        className="hidden items-center gap-[11px] rounded-[6px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-iq-accent min-[1200px]:flex"
        href="/app">
        <InveqMark />
        <span className="text-[16px] font-extrabold tracking-[-0.3px]">INVEQ</span>
      </Link>
      <span aria-hidden className="hidden h-[22px] w-px bg-iq-line min-[1200px]:block" />
      <nav aria-label="Fil d’Ariane" className="flex min-w-0 items-center gap-2 text-[13.5px] text-iq-ink3">
        <button
          className="shrink-0 rounded-[4px] hover:text-iq-ink2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-iq-accent"
          onClick={onCrumbClick}
          type="button">
          {crumbLabel}
        </button>
        <span aria-hidden>/</span>
        <span aria-current="page" className="truncate font-semibold text-iq-ink">
          {title}
        </span>
      </nav>
      <div className="flex-1" />
      <SaveIndicator className="hidden lg:flex" label={saveLabel} tone={saveTone} />
      <div className="flex items-baseline gap-2 border-l border-iq-line pl-[18px]">
        <span className="hidden text-[12px] text-iq-ink3 sm:inline">Total TTC</span>
        <span className="whitespace-nowrap text-[17px] font-extrabold tracking-[-0.3px]">
          {formatCurrency(total)}
        </span>
      </div>
      <button
        className="h-[38px] shrink-0 rounded-[10px] border border-iq-line bg-iq-surface px-4 text-[13.5px] font-semibold text-iq-ink2 transition-colors duration-150 hover:bg-iq-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-iq-accent"
        onClick={onCancel}
        type="button">
        Annuler
      </button>
      <button className={IQ_PRIMARY} disabled={pending} onClick={onSubmit} type="button">
        {submitLabel}
      </button>
    </header>
  );
}

/** En-tête de l'assistant (écran étroit) : retour, titre, étape, progression. */
export function ComposerHeader({
  children,
  meta,
  onBack,
  title,
}: {
  children?: React.ReactNode;
  meta?: string;
  onBack: () => void;
  title: string;
}) {
  return (
    <header className="shrink-0 border-b border-iq-line bg-iq-surface">
      <div className="flex items-center gap-3 px-3.5 py-3">
        <button
          aria-label="Retour"
          className="flex h-10 shrink-0 items-center gap-1.5 rounded-[10px] border border-iq-line bg-iq-surface px-2.5 text-[13px] font-semibold text-iq-ink2 transition-colors duration-150 hover:bg-iq-soft"
          onClick={onBack}
          type="button">
          <svg aria-hidden fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" viewBox="0 0 24 24" width="16">
            <path d="M15 6l-6 6 6 6" />
          </svg>
          <span className="hidden sm:inline">Retour</span>
        </button>
        <div className="min-w-0">
          <h1 className={cn('truncate text-[17px] font-bold tracking-[-0.2px]')}>{title}</h1>
          {meta ? <p className="mt-px truncate text-[12.5px] text-iq-ink3">{meta}</p> : null}
        </div>
      </div>
      {children}
    </header>
  );
}
