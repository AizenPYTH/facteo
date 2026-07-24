'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
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
  className,
  size = 'md',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
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
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            onClick={onClose}
            transition={{ duration: reduceMotion ? 0 : 0.2 }}
            type="button"
          />
          <motion.div
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className={cn(
              'relative flex max-h-[88vh] w-full flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_32px_80px_-24px_rgba(15,23,42,0.45)]',
              widths[size],
              className,
            )}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            initial={reduceMotion ? false : { opacity: 0, y: 10, scale: 0.98 }}
            role="dialog"
            transition={{ duration: reduceMotion ? 0 : 0.22, ease }}>
            <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
              <div className="min-w-0">
                <h3 className="text-base font-semibold tracking-tight text-slate-900">{title}</h3>
                {description ? (
                  <p className="mt-0.5 text-sm text-slate-500">{description}</p>
                ) : null}
              </div>
              <button
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                onClick={onClose}
                type="button">
                <X size={18} />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
