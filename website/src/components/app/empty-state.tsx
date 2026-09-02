'use client';

import type { LucideIcon } from 'lucide-react';
import { AlertTriangle, FileQuestion, SearchX } from 'lucide-react';

import { cn } from '@/lib/utils';

export function EmptyState({
  title,
  description,
  icon: Icon = FileQuestion,
  action,
  secondaryAction,
  className,
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
  secondaryAction?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border border-dashed border-app-border-dashed bg-app-subtle px-5 py-7 text-center',
        className,
      )}>
      <span className="flex h-11 w-11 items-center justify-center rounded-[13px] bg-app-accent-tint text-app-accent">
        <Icon size={20} strokeWidth={1.75} />
      </span>
      <p className="mt-3.5 text-[14.5px] font-semibold text-app-text">{title}</p>
      {description ? (
        <p className="mt-1.5 max-w-[290px] text-[13px] leading-relaxed text-app-muted">
          {description}
        </p>
      ) : null}
      {action || secondaryAction ? (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          {action}
          {secondaryAction}
        </div>
      ) : null}
    </div>
  );
}

export function NoResultsState({
  query,
  onClear,
  description,
  className,
}: {
  query: string;
  onClear?: () => void;
  description?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border border-dashed border-app-border-dashed bg-app-subtle px-5 py-7 text-center',
        className,
      )}>
      <span className="flex h-11 w-11 items-center justify-center rounded-[13px] bg-app-border-soft text-app-muted-2">
        <SearchX size={20} strokeWidth={1.75} />
      </span>
      <p className="mt-3.5 text-[14.5px] font-semibold text-app-text">
        {query ? `Aucun résultat pour « ${query} »` : 'Aucun résultat'}
      </p>
      <p className="mt-1.5 max-w-[280px] text-[13px] leading-relaxed text-app-muted">
        {description ?? 'Vérifiez l’orthographe ou retirez les filtres actifs.'}
      </p>
      {onClear ? (
        <button
          className="mt-4 rounded-[10px] border border-app-border bg-app-surface px-3.5 py-[9px] text-[13px] font-semibold text-app-accent transition-colors duration-150 hover:border-app-accent-border hover:bg-app-accent-soft"
          onClick={onClear}
          type="button">
          Effacer les filtres
        </button>
      ) : null}
    </div>
  );
}

export function ErrorState({
  title = 'Une erreur est survenue',
  description,
  onRetry,
  className,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex gap-3 rounded-xl border border-app-danger-border bg-[#fffafa] p-4',
        className,
      )}>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-app-danger-tint text-app-danger">
        <AlertTriangle size={16} strokeWidth={1.75} />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-[#991b1b]">{title}</p>
        {description ? <p className="mt-1 text-[13px] text-[#a15656]">{description}</p> : null}
        {onRetry ? (
          <button
            className="mt-3 rounded-[9px] border border-app-danger-border bg-app-surface px-[13px] py-2 text-[12.5px] font-semibold text-app-danger-text transition-colors duration-150 hover:bg-app-danger-tint"
            onClick={onRetry}
            type="button">
            Réessayer
          </button>
        ) : null}
      </div>
    </div>
  );
}
