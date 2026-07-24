'use client';

import { motion, useReducedMotion } from 'framer-motion';

import { cn } from '@/lib/utils';

export function StatCard({
  label,
  value,
  trend,
  accent = 'primary',
}: {
  label: string;
  value: string;
  trend?: string;
  accent?: 'primary' | 'warning' | 'success' | 'muted' | 'info';
}) {
  const reduceMotion = useReducedMotion();
  const accents = {
    primary:
      'border-blue-100/80 bg-gradient-to-br from-blue-50/90 via-white to-white shadow-[0_1px_0_rgba(37,99,235,0.06)]',
    warning:
      'border-amber-100/80 bg-gradient-to-br from-amber-50/80 via-white to-white shadow-[0_1px_0_rgba(245,158,11,0.06)]',
    success:
      'border-emerald-100/80 bg-gradient-to-br from-emerald-50/80 via-white to-white shadow-[0_1px_0_rgba(16,185,129,0.06)]',
    muted: 'border-slate-200/90 bg-white shadow-[0_1px_0_rgba(15,23,42,0.03)]',
    info: 'border-sky-100/80 bg-gradient-to-br from-sky-50/90 via-white to-white shadow-[0_1px_0_rgba(14,165,233,0.06)]',
  };
  const dots = {
    primary: 'bg-primary',
    warning: 'bg-amber-500',
    success: 'bg-emerald-500',
    muted: 'bg-slate-300',
    info: 'bg-sky-500',
  };

  return (
    <motion.div
      className={cn(
        'group rounded-2xl border p-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-28px_rgba(15,23,42,0.35)]',
        accents[accent],
      )}
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      viewport={{ once: true }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}>
      <div className="flex items-center gap-2">
        <span className={cn('h-1.5 w-1.5 rounded-full', dots[accent])} />
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
          {label}
        </p>
      </div>
          <p className="mt-3 truncate text-[1.35rem] font-semibold tracking-[-0.03em] text-slate-900 tabular-nums sm:text-[1.75rem]">
        {value}
      </p>
      {trend ? <p className="mt-1.5 text-xs text-slate-500">{trend}</p> : null}
    </motion.div>
  );
}

export function Panel({
  title,
  children,
  className,
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-slate-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-16px_rgba(15,23,42,0.12)]',
        className,
      )}>
      {title ? (
        <div className="flex items-center justify-between border-b border-slate-100/90 px-6 py-4">
          <h2 className="text-[15px] font-semibold tracking-tight text-slate-900">{title}</h2>
        </div>
      ) : null}
      <div className="p-6">{children}</div>
    </div>
  );
}

export function DataTable({
  columns,
  rows,
  emptyMessage = 'Aucune donnée.',
}: {
  columns: { key: string; label: string; className?: string }[];
  rows: Record<string, React.ReactNode>[];
  emptyMessage?: string;
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-6 py-14 text-center text-sm text-slate-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200/90 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-slate-200/90 bg-slate-50/90">
          <tr>
            {columns.map((col) => (
              <th
                className={cn(
                  'px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500',
                  col.className,
                )}
                key={col.key}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100/90 bg-white">
          {rows.map((row, index) => (
            <tr
              className="transition-colors duration-150 hover:bg-slate-50/90"
              key={index}>
              {columns.map((col) => (
                <td
                  className={cn('px-4 py-3.5 text-slate-700', col.className)}
                  key={col.key}>
                  {row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Badge({
  children,
  variant = 'default',
  className,
}: {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
}) {
  const variants = {
    default: 'bg-slate-100/90 text-slate-700 ring-1 ring-slate-200/80',
    success: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100',
    warning: 'bg-amber-50 text-amber-800 ring-1 ring-amber-100',
    danger: 'bg-red-50 text-red-700 ring-1 ring-red-100',
    info: 'bg-blue-50 text-blue-700 ring-1 ring-blue-100',
  };
  const dots = {
    default: 'bg-slate-400',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-red-500',
    info: 'bg-primary',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-tight',
        variants[variant],
        className,
      )}>
      <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', dots[variant])} />
      {children}
    </span>
  );
}

export function LoadingState({ message = 'Chargement…' }: { message?: string }) {
  return (
    <div className="flex flex-1 items-center justify-center py-24">
      <div className="flex flex-col items-center gap-3">
        <div className="relative h-9 w-9">
          <div className="absolute inset-0 rounded-full border-2 border-primary/15" />
          <div className="absolute inset-0 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
        <p className="text-sm text-slate-500">{message}</p>
      </div>
    </div>
  );
}
