'use client';

import { motion, useReducedMotion } from 'framer-motion';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

type ButtonProps = {
  href: string;
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'md' | 'lg';
  className?: string;
  /** Occupe toute la largeur disponible — pieds de page, menu mobile. */
  fullWidth?: boolean;
  external?: boolean;
};

const BASE =
  'focus-ring inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-[background-color,border-color,box-shadow,color] duration-200 disabled:opacity-60';

const SIZES = {
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-6 py-3 text-[15px]',
} as const;

const VARIANTS = {
  primary:
    'bg-primary text-white shadow-[0_1px_2px_rgba(15,23,42,0.08),0_10px_24px_-12px_rgba(79,70,229,0.75)] hover:bg-primary-dark',
  secondary:
    'border border-border bg-surface text-foreground hover:border-primary/40 hover:bg-indigo-50/60',
  ghost: 'text-muted hover:bg-slate-100 hover:text-foreground',
} as const;

/**
 * Bouton du site vitrine.
 *
 * Le retrait au survol est porté par un `motion` englobant plutôt que par une
 * transition CSS sur le lien : cela évite d'animer une propriété de mise en
 * page, et le mouvement disparaît entièrement sous `prefers-reduced-motion`.
 */
export function Button({
  href,
  children,
  variant = 'primary',
  size = 'md',
  className,
  fullWidth = false,
  external,
}: ButtonProps) {
  const reduce = useReducedMotion();
  const classes = cn(BASE, SIZES[size], VARIANTS[variant], fullWidth && 'w-full', className);

  const hover = reduce ? undefined : { y: -1 };
  const tap = reduce ? undefined : { y: 0, scale: 0.985 };

  if (external) {
    return (
      <motion.a
        className={classes}
        href={href}
        rel="noopener noreferrer"
        target="_blank"
        whileHover={hover}
        whileTap={tap}>
        {children}
      </motion.a>
    );
  }

  return (
    <motion.span
      className={cn('inline-flex', fullWidth && 'w-full')}
      whileHover={hover}
      whileTap={tap}>
      <Link className={classes} href={href}>
        {children}
      </Link>
    </motion.span>
  );
}
