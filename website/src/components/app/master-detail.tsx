'use client';

import { ResizeHandle } from '@/components/app/resize-handle';
import { cn } from '@/lib/utils';

export function MasterDetailLayout({
  list,
  detail,
  sidebar,
  className,
  sidebarWidth,
  onSidebarResize,
}: {
  list: React.ReactNode;
  detail: React.ReactNode;
  sidebar?: React.ReactNode;
  className?: string;
  sidebarWidth?: number;
  onSidebarResize?: (delta: number) => void;
}) {
  const resizable = Boolean(sidebar && sidebarWidth != null && onSidebarResize);

  return (
    <div className={cn('flex h-full min-h-0 w-full', className)}>
      <div className="flex w-[340px] shrink-0 flex-col border-r border-slate-200/90 bg-white xl:w-[380px]">
        {list}
      </div>
      <div className="flex min-w-0 flex-1 flex-col bg-[linear-gradient(180deg,#f8fafc_0%,#f1f5f9_100%)]">
        {detail}
      </div>
      {sidebar ? (
        <>
          {resizable ? <ResizeHandle onResize={onSidebarResize!} /> : null}
          <div
            className={cn(
              'hidden min-h-0 shrink-0 flex-col border-l border-slate-200/90 bg-white xl:flex',
              !resizable && 'w-[320px] 2xl:w-[360px]',
            )}
            style={resizable ? { width: sidebarWidth } : undefined}>
            {sidebar}
          </div>
        </>
      ) : null}
    </div>
  );
}

export function WorkspaceToolbar({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex shrink-0 items-center justify-between gap-4 border-b border-slate-200/90 bg-white/95 px-5 py-3.5 backdrop-blur-sm">
      <div className="min-w-0">
        <h1 className="truncate text-lg font-semibold tracking-tight text-slate-900">{title}</h1>
        {subtitle ? <p className="truncate text-sm text-slate-500">{subtitle}</p> : null}
      </div>
      {children ? <div className="flex shrink-0 items-center gap-2">{children}</div> : null}
    </div>
  );
}
