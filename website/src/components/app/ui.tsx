'use client';

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
  accent?: 'primary' | 'warning' | 'success' | 'muted';
}) {
  const accents = {
    primary: 'border-blue-100 bg-blue-50/50',
    warning: 'border-amber-100 bg-amber-50/50',
    success: 'border-emerald-100 bg-emerald-50/50',
    muted: 'border-slate-200 bg-white',
  };

  return (
    <div className={cn('rounded-2xl border p-5', accents[accent])}>
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
      {trend ? <p className="mt-1 text-xs text-slate-500">{trend}</p> : null}
    </div>
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
    <div className={cn('rounded-2xl border border-slate-200 bg-white shadow-sm', className)}>
      {title ? (
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="font-semibold text-slate-900">{title}</h2>
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
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center text-sm text-slate-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50">
          <tr>
            {columns.map((col) => (
              <th
                className={cn('px-4 py-3 font-semibold text-slate-600', col.className)}
                key={col.key}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr className="border-b border-slate-100 last:border-0 hover:bg-slate-50/80" key={index}>
              {columns.map((col) => (
                <td className={cn('px-4 py-3 text-slate-700', col.className)} key={col.key}>
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
    default: 'bg-slate-100 text-slate-700',
    success: 'bg-emerald-50 text-emerald-700',
    warning: 'bg-amber-50 text-amber-700',
    danger: 'bg-red-50 text-red-700',
    info: 'bg-blue-50 text-blue-700',
  };

  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold',
        variants[variant],
        className,
      )}>
      {children}
    </span>
  );
}

export function LoadingState({ message = 'Chargement…' }: { message?: string }) {
  return (
    <div className="flex flex-1 items-center justify-center py-24">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-sm text-slate-500">{message}</p>
      </div>
    </div>
  );
}
