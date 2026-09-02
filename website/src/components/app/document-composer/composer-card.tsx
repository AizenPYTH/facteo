'use client';

import { cn } from '@/lib/utils';

export function ComposerCard({
  action,
  children,
  className,
  containerRef,
  title,
}: {
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  containerRef?: React.Ref<HTMLElement>;
  title?: string;
}) {
  return (
    <section
      className={cn(
        'rounded-app-card border border-app-border bg-app-surface px-4 py-[14px]',
        className,
      )}
      ref={containerRef}>
      {title ? (
        <div className="mb-2.5 flex items-center justify-between gap-2">
          <h2 className="text-[13px] font-semibold tracking-[-0.01em] text-app-text">{title}</h2>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function ComposerReadOnlyValue({
  label,
  muted,
  value,
}: {
  label: string;
  muted?: boolean;
  value: string;
}) {
  return (
    <div>
      <p className="mb-1.5 text-[12px] font-medium text-app-text-3">{label}</p>
      <p
        className={cn(
          'app-num rounded-app-field border border-app-border bg-app-subtle px-[11px] py-[9px] text-[13px]',
          muted ? 'text-app-muted-2' : 'text-app-text-2',
        )}>
        {value}
      </p>
    </div>
  );
}
