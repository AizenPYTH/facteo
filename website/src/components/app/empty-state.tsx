'use client';

import type { LucideIcon } from 'lucide-react';
import { FileQuestion } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';

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
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200/90 bg-gradient-to-b from-slate-50/90 to-white px-8 py-16 text-center',
        className,
      )}
      initial={reduceMotion ? false : { opacity: 0, y: 6 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      viewport={{ once: true }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}>
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-[0_8px_24px_-12px_rgba(15,23,42,0.35)] ring-1 ring-slate-200/80">
        <Icon size={24} strokeWidth={1.75} />
      </div>
      <h3 className="mt-5 text-base font-semibold tracking-tight text-slate-900">{title}</h3>
      {description ? (
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-500">{description}</p>
      ) : null}
      {action ? <div className="mt-7">{action}</div> : null}
    </motion.div>
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
    <div className="flex flex-col items-center justify-center rounded-2xl border border-red-100 bg-gradient-to-b from-red-50/70 to-white px-8 py-12 text-center shadow-[0_8px_24px_-18px_rgba(185,28,28,0.35)]">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-sm font-bold text-red-600 ring-1 ring-red-100">
        !
      </div>
      <h3 className="mt-4 text-base font-semibold text-red-900">{title}</h3>
      {description ? <p className="mt-2 max-w-sm text-sm text-red-700/90">{description}</p> : null}
      {onRetry ? (
        <button
          className="mt-5 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-red-700 shadow-sm ring-1 ring-red-200 transition hover:-translate-y-0.5 hover:bg-red-50 active:translate-y-0"
          onClick={onRetry}
          type="button">
          Réessayer
        </button>
      ) : null}
    </div>
  );
}
