'use client';

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
    // eslint-disable-next-line @next/next/no-img-element -- servi directement depuis /public (évite /_next/image)
    <img
      alt="INVEQ"
      className={cn('shrink-0', className)}
      height={size}
      src={BRAND_ICON_SRC}
      width={size}
    />
  );
}

/**
 * Logo principal horizontal : icône + INVEQ (+ tagline).
 * <img> direct depuis /public pour Content-Type image/png fiable (SEO / bots).
 */
export function BrandWordmark({
  className,
}: {
  className?: string;
  /** @deprecated Conservé pour compatibilité des appels existants. */
  markSize?: number;
  showMark?: boolean;
  priority?: boolean;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- servi directement depuis /public (évite /_next/image)
    <img
      alt="INVEQ — Facturation, devis et gestion"
      className={cn(
        'h-auto w-[148px] max-w-full shrink-0 sm:w-[164px] lg:w-[176px]',
        className,
      )}
      decoding="async"
      height={LOGO_HEIGHT}
      src={BRAND_LOGO_SRC}
      width={LOGO_WIDTH}
    />
  );
}
