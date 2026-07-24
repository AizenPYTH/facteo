'use client';

import Image from 'next/image';

import { cn } from '@/lib/utils';

export function BrandMark({
  size = 32,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <Image
      alt="INVEQ"
      className={cn('shrink-0 rounded-lg', className)}
      height={size}
      priority
      src="/icon.png"
      width={size}
    />
  );
}

export function BrandWordmark({
  className,
  showMark = true,
  markSize = 32,
}: {
  className?: string;
  showMark?: boolean;
  markSize?: number;
}) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      {showMark ? <BrandMark size={markSize} /> : null}
      <span className="text-lg font-bold tracking-tight text-foreground">INVEQ</span>
    </span>
  );
}
