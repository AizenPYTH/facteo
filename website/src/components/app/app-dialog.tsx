'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { useEffect } from 'react';
import { X } from 'lucide-react';

import { cn } from '@/lib/utils';

const ease = [0.22, 1, 0.36, 1] as const;

export function AppDialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  icon: Icon,
  tone = 'default',
  className,
  size = 'md',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  icon?: LucideIcon;
  tone?: 'default' | 'danger';
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}) {
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const widths = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-3xl',
    xl: 'max-w-5xl',
  };

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.button
            animate={{ opacity: 1 }}
            aria-label="Fermer"
            className="absolute inset-0 bg-[rgba(15,21,51,0.34)] backdrop-blur-[3px]"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            onClick={onClose}
            transition={{ duration: reduceMotion ? 0 : 0.2 }}
            type="button"
          />
          <motion.div
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className={cn(
              'relative flex max-h-[88vh] w-full flex-col overflow-hidden rounded-2xl border border-app-border bg-app-surface shadow-app-float',
              widths[size],
              className,
            )}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            initial={reduceMotion ? false : { opacity: 0, y: 10, scale: 0.98 }}
            role="dialog"
            transition={{ duration: reduceMotion ? 0 : 0.22, ease }}>
            <div className="flex shrink-0 items-start justify-between gap-4 px-[22px] pb-4 pt-5">
              <div className="min-w-0">
                {Icon ? (
                  <span
                    className={cn(
                      'mb-3.5 flex h-[38px] w-[38px] items-center justify-center rounded-[11px]',
                      tone === 'danger'
                        ? 'bg-app-danger-tint text-app-danger'
                        : 'bg-app-accent-tint text-app-accent',
                    )}>
                    <Icon size={18} strokeWidth={1.75} />
                  </span>
                ) : null}
                <h3 className="text-base font-semibold tracking-[-0.01em] text-app-text">{title}</h3>
                {description ? (
                  <p className="mt-1.5 text-[13px] leading-relaxed text-app-muted">{description}</p>
                ) : null}
              </div>
              <button
                aria-label="Fermer"
                className="-mr-1 shrink-0 rounded-lg p-2 text-app-muted-2 transition-colors duration-150 hover:bg-app-border-soft hover:text-app-text-2"
                onClick={onClose}
                type="button">
                <X size={18} />
              </button>
            </div>
            {children ? <div className="min-h-0 flex-1 overflow-y-auto">{children}</div> : null}
            {footer ? (
              <div className="flex shrink-0 items-center justify-end gap-2 border-t border-app-border-soft bg-app-subtle px-[22px] py-3.5">
                {footer}
              </div>
            ) : null}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
