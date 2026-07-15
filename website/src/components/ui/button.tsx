'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

type ButtonProps = {
  href: string;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  className?: string;
  external?: boolean;
};

export function Button({ href, children, variant = 'primary', className, external }: ButtonProps) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-200';

  const variants = {
    primary: 'bg-primary text-white shadow-lg shadow-primary/25 hover:bg-primary-dark hover:shadow-primary/30',
    secondary: 'bg-surface text-foreground border border-border hover:border-primary/40 hover:bg-blue-50/50',
    ghost: 'text-muted hover:text-foreground hover:bg-slate-100',
  };

  const classes = cn(base, variants[variant], className);

  if (external) {
    return (
      <motion.a
        className={classes}
        href={href}
        rel="noopener noreferrer"
        target="_blank"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}>
        {children}
      </motion.a>
    );
  }

  return (
    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
      <Link className={classes} href={href}>
        {children}
      </Link>
    </motion.div>
  );
}
