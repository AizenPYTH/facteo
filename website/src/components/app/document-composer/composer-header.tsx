'use client';

import { ArrowLeft, Check, Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils';

export type ComposerSaveState = 'draft' | 'saving' | 'saved';

const SAVE_STATES: Record<ComposerSaveState, { label: string; className: string }> = {
  draft: {
    label: 'Brouillon non enregistré',
    className: 'bg-app-border-soft text-app-muted',
  },
  saving: {
    label: 'Enregistrement…',
    className: 'bg-app-accent-tint text-app-accent-strong',
  },
  saved: {
    label: 'Enregistré',
    className: 'bg-app-success-tint text-app-success-text',
  },
};

export function ComposerSaveIndicator({
  className,
  state,
}: {
  className?: string;
  state: ComposerSaveState;
}) {
  const tone = SAVE_STATES[state];

  return (
    <span
      className={cn(
        'flex items-center gap-1.5 rounded-app-chip px-2.5 py-[5px] text-[12px] font-semibold',
        tone.className,
        className,
      )}>
      {state === 'saving' ? (
        <Loader2 className="animate-spin" size={13} strokeWidth={2} />
      ) : state === 'saved' ? (
        <Check size={13} strokeWidth={2.25} />
      ) : (
        <span className="h-[5px] w-[5px] rounded-full bg-app-faint" />
      )}
      {tone.label}
    </span>
  );
}

export function ComposerHeader({
  actions,
  children,
  meta,
  onBack,
  title,
}: {
  actions?: React.ReactNode;
  children?: React.ReactNode;
  meta?: string;
  onBack: () => void;
  title: string;
}) {
  return (
    <header className="shrink-0 border-b border-app-border bg-app-surface">
      <div className="flex items-center justify-between gap-4 px-3.5 py-3 lg:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <button
            aria-label="Retour"
            className="flex h-9 shrink-0 items-center gap-1.5 rounded-app-field border border-app-border bg-app-surface px-2.5 text-[12.5px] font-semibold text-app-text-3 transition-[background-color,border-color,color] duration-150 hover:bg-app-hover"
            onClick={onBack}
            type="button">
            <ArrowLeft size={15} strokeWidth={1.9} />
            <span className="hidden sm:inline">Retour</span>
          </button>
          <div className="min-w-0">
            <h1 className="truncate text-[17px] font-semibold tracking-[-0.01em] text-app-text">
              {title}
            </h1>
            {meta ? <p className="mt-px truncate text-[12px] text-app-muted-2">{meta}</p> : null}
          </div>
        </div>
        {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
      </div>
      {children}
    </header>
  );
}
