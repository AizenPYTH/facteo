'use client';

import { cn } from '@/lib/utils';

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-lg bg-slate-200/80', className)} />;
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton className="h-12 w-full" key={i} />
      ))}
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="space-y-4 p-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

export function PdfSkeleton() {
  return (
    <div className="flex h-full items-center justify-center bg-slate-100 p-8">
      <div className="w-full max-w-2xl space-y-4 rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="mt-8 h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    </div>
  );
}
