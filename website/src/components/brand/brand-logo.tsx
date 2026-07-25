'use client';

import Image from 'next/image';

import { cn } from '@/lib/utils';

/** Logo horizontal officiel (897×240). */
export const BRAND_LOGO_SRC = '/logo-inveq.png';
/** Icône carrée (facture + €). */
export const BRAND_ICON_SRC = '/icon.png';

const LOGO_WIDTH = 897;
const LOGO_HEIGHT = 240;

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
      className={cn('shrink-0', className)}
      height={size}
      priority
      src={BRAND_ICON_SRC}
      width={size}
    />
  );
}

/**
 * Logo principal horizontal : icône + INVEQ (+ tagline).
 * Largeur ~220–252 px selon le viewport.
 */
export function BrandWordmark({
  className,
  priority = true,
}: {
  className?: string;
  /** @deprecated Conservé pour compatibilité des appels existants. */
  markSize?: number;
  showMark?: boolean;
  priority?: boolean;
}) {
  return (
    <Image
      alt="INVEQ — Facturation, devis et gestion"
      className={cn(
        'h-auto w-[220px] max-w-full shrink-0 sm:w-[240px] lg:w-[252px]',
        className,
      )}
      height={LOGO_HEIGHT}
      priority={priority}
      sizes="(max-width: 640px) 220px, (max-width: 1024px) 240px, 252px"
      src={BRAND_LOGO_SRC}
      width={LOGO_WIDTH}
    />
  );
}
