'use client';

import { cn } from '@/lib/utils';

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton-shimmer rounded-lg', className)} />;
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton className="h-14 w-full rounded-xl" key={i} />
      ))}
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="space-y-4 p-6">
      <Skeleton className="h-8 w-48 rounded-xl" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-72 w-full rounded-2xl" />
    </div>
  );
}

export function PdfSkeleton() {
  return (
    <div className="flex h-full items-center justify-center bg-[radial-gradient(ellipse_at_top,rgba(37,99,235,0.06),transparent_55%),linear-gradient(180deg,#f1f5f9,#e2e8f0)] p-8">
      <div className="w-full max-w-2xl space-y-4 rounded-xl border border-white/80 bg-white p-8 shadow-[0_24px_60px_-28px_rgba(15,23,42,0.35)] ring-1 ring-slate-200/70">
        <div className="flex items-start justify-between gap-6">
          <Skeleton className="h-10 w-28" />
          <div className="space-y-2 text-right">
            <Skeleton className="ml-auto h-5 w-36" />
            <Skeleton className="ml-auto h-3 w-24" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 pt-2">
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
        </div>
        <Skeleton className="mt-4 h-28 w-full rounded-xl" />
        <Skeleton className="h-28 w-full rounded-xl" />
        <Skeleton className="ml-auto h-16 w-40 rounded-xl" />
      </div>
    </div>
  );
}
