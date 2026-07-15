'use client';

import type { LucideIcon } from 'lucide-react';
import { FileQuestion } from 'lucide-react';

import { cn } from '@/lib/utils';

export function EmptyState({
  title,
  description,
  icon: Icon = FileQuestion,
  action,
  className,
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-8 py-16 text-center',
        className,
      )}>
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm">
        <Icon size={24} />
      </div>
      <h3 className="mt-4 text-base font-semibold text-slate-900">{title}</h3>
      {description ? <p className="mt-2 max-w-sm text-sm text-slate-500">{description}</p> : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}

export function ErrorState({
  title = 'Une erreur est survenue',
  description,
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-red-100 bg-red-50/50 px-8 py-12 text-center">
      <h3 className="text-base font-semibold text-red-900">{title}</h3>
      {description ? <p className="mt-2 max-w-sm text-sm text-red-700">{description}</p> : null}
      {onRetry ? (
        <button
          className="mt-4 rounded-xl bg-white px-4 py-2 text-sm font-medium text-red-700 shadow-sm ring-1 ring-red-200 transition hover:bg-red-50"
          onClick={onRetry}
          type="button">
          Réessayer
        </button>
      ) : null}
    </div>
  );
}
