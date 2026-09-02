'use client';

import type { LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

type StatAccent = 'primary' | 'warning' | 'success' | 'muted' | 'info';

const STAT_ACCENTS: Record<StatAccent, string> = {
  primary: 'bg-app-accent-tint text-app-accent',
  warning: 'bg-app-warning-tint text-app-warning-text',
  success: 'bg-app-success-tint text-app-success',
  muted: 'bg-app-border-soft text-app-muted',
  info: 'bg-app-accent-violet-tint text-app-accent-violet',
};

export function StatCard({
  label,
  value,
  trend,
  accent = 'primary',
  icon: Icon,
  tone = 'default',
  action,
  className,
}: {
  label: string;
  value: string;
  trend?: React.ReactNode;
  accent?: StatAccent;
  icon?: LucideIcon;
  tone?: 'default' | 'danger';
  action?: React.ReactNode;
  className?: string;
}) {
  const danger = tone === 'danger';

  return (
    <div
      className={cn(
        'rounded-[14px] border bg-app-surface px-[18px] py-4',
        danger ? 'border-app-danger-border' : 'border-app-border',
        className,
      )}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          {Icon ? (
            <span
              className={cn(
                'flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-lg',
                danger ? 'bg-app-danger-tint text-app-danger' : STAT_ACCENTS[accent],
              )}>
              <Icon size={15} strokeWidth={1.75} />
            </span>
          ) : null}
          <p className="truncate text-xs font-semibold text-app-muted">{label}</p>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <p
        className={cn(
          'app-num mt-3 truncate text-[28px] font-semibold tracking-[-0.03em]',
          danger ? 'text-app-danger-text' : 'text-app-text',
        )}>
        {value}
      </p>
      {trend ? <p className="mt-1.5 text-[12.5px] text-app-muted">{trend}</p> : null}
    </div>
  );
}

export function Panel({
  title,
  action,
  children,
  className,
  bodyClassName,
}: {
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <div className={cn('rounded-[14px] border border-app-border bg-app-surface', className)}>
      {title ? (
        <div className="flex items-center justify-between gap-3 border-b border-app-border-soft px-[18px] py-[14px]">
          <h2 className="text-[14.5px] font-semibold tracking-[-0.01em] text-app-text">{title}</h2>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      ) : null}
      <div className={cn('px-[18px] py-4', bodyClassName)}>{children}</div>
    </div>
  );
}

export type DataTableColumn = {
  key: string;
  label: string;
  className?: string;
  align?: 'left' | 'right';
};

export type DataTableRow = Record<string, React.ReactNode>;

const HEAD_CELL =
  'sticky top-0 z-10 border-b border-app-border bg-app-subtle px-3 py-[9px] text-[11px] font-bold uppercase tracking-[0.07em] text-app-muted-2 first:pl-6 last:pr-6';

function rowId(row: DataTableRow, index: number) {
  return typeof row.id === 'string' ? row.id : String(index);
}

export function DataTable({
  columns,
  rows,
  emptyMessage = 'Aucune donnée.',
  selectable = false,
  selectedIds,
  onSelectionChange,
  onRowClick,
  activeRowId,
  className,
}: {
  columns: DataTableColumn[];
  rows: DataTableRow[];
  emptyMessage?: string;
  selectable?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  onRowClick?: (row: DataTableRow, index: number) => void;
  activeRowId?: string | null;
  className?: string;
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-app-border-dashed bg-app-subtle px-6 py-14 text-center text-[13px] text-app-muted">
        {emptyMessage}
      </div>
    );
  }

  const selection = selectedIds ?? [];
  const allIds = rows.map((row, index) => rowId(row, index));
  const allSelected = selection.length > 0 && allIds.every((id) => selection.includes(id));

  const toggleAll = () => onSelectionChange?.(allSelected ? [] : allIds);
  const toggleRow = (id: string) =>
    onSelectionChange?.(
      selection.includes(id) ? selection.filter((item) => item !== id) : [...selection, id],
    );

  return (
    <div className={cn('sb overflow-auto rounded-xl border border-app-border', className)}>
      <table className="w-full border-collapse text-left text-[13.5px] text-app-text">
        <thead>
          <tr>
            {selectable ? (
              <th className={cn(HEAD_CELL, 'w-[38px] pr-0')}>
                <input
                  aria-label="Tout sélectionner"
                  checked={allSelected}
                  className="h-[15px] w-[15px] [accent-color:var(--app-accent)]"
                  onChange={toggleAll}
                  type="checkbox"
                />
              </th>
            ) : null}
            {columns.map((col) => (
              <th
                className={cn(HEAD_CELL, col.align === 'right' && 'text-right', col.className)}
                key={col.key}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => {
            const id = rowId(row, index);
            const active = activeRowId != null && activeRowId === id;

            return (
              <tr
                className={cn(
                  'border-l-[3px] transition-colors duration-150',
                  active
                    ? 'border-l-app-accent bg-app-accent-soft'
                    : 'border-l-transparent hover:bg-app-hover',
                  onRowClick && 'cursor-pointer',
                )}
                key={id}
                onClick={onRowClick ? () => onRowClick(row, index) : undefined}>
                {selectable ? (
                  <td className="border-b border-app-border-soft py-0 pl-[21px]">
                    <input
                      aria-label="Sélectionner la ligne"
                      checked={selection.includes(id)}
                      className="h-[15px] w-[15px] [accent-color:var(--app-accent)]"
                      onChange={() => toggleRow(id)}
                      onClick={(event) => event.stopPropagation()}
                      type="checkbox"
                    />
                  </td>
                ) : null}
                {columns.map((col) => (
                  <td
                    className={cn(
                      'border-b border-app-border-soft px-3 py-[11px] text-app-text-2 first:pl-6 last:pr-6',
                      col.align === 'right' && 'app-num text-right font-semibold text-app-text',
                      col.className,
                    )}
                    key={col.key}>
                    {row[col.key]}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

const BADGE_VARIANTS = {
  default: { bg: '#f3f5fa', fg: '#4a5268', dot: '#a3aabd' },
  info: { bg: '#f1efff', fg: '#4338ca', dot: '#4f46e5' },
  success: { bg: '#ecfdf5', fg: '#047857', dot: '#059669' },
  warning: { bg: '#fffbeb', fg: '#b45309', dot: '#f59e0b' },
  danger: { bg: '#fef2f2', fg: '#b91c1c', dot: '#dc2626' },
} as const;

export function Badge({
  children,
  variant = 'default',
  className,
}: {
  children: React.ReactNode;
  variant?: keyof typeof BADGE_VARIANTS;
  className?: string;
}) {
  const tone = BADGE_VARIANTS[variant];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-[9px] py-[3px] text-[11.5px] font-semibold',
        className,
      )}
      style={{ background: tone.bg, color: tone.fg }}>
      <span
        className="h-[5px] w-[5px] shrink-0 rounded-full"
        style={{ background: tone.dot }}
      />
      {children}
    </span>
  );
}

export function LoadingState({ message = 'Chargement…' }: { message?: string }) {
  return (
    <div className="flex flex-1 items-center justify-center py-24">
      <div className="flex flex-col items-center gap-3">
        <div className="relative h-9 w-9">
          <div className="absolute inset-0 rounded-full border-2 border-app-accent/15" />
          <div className="absolute inset-0 animate-spin rounded-full border-2 border-app-accent border-t-transparent" />
        </div>
        <p className="text-[13px] text-app-muted">{message}</p>
      </div>
    </div>
  );
}
