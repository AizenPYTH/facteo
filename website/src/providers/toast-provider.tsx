'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { AlertCircle, Check, Info, X } from 'lucide-react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';

import { GENERIC_ERROR_MESSAGE } from '@/lib/errors/messages';
import { cn } from '@/lib/utils';

type ToastType = 'success' | 'error' | 'info';

type Toast = {
  id: number;
  type: ToastType;
  message: string;
};

type ToastContextValue = {
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showInfo: (message: string) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const TOAST_DURATION_MS = 4000;

const TONES: Record<ToastType, { border: string; icon: string; text: string }> = {
  success: {
    border: 'border-[#d6f0e3]',
    icon: 'bg-app-success-tint text-app-success',
    text: 'text-[#065f46]',
  },
  error: {
    border: 'border-app-danger-border',
    icon: 'bg-app-danger-tint text-app-danger',
    text: 'text-app-danger-text',
  },
  info: {
    border: 'border-app-accent-border',
    icon: 'bg-app-accent-tint text-app-accent',
    text: 'text-app-text-2',
  },
};

const ICONS: Record<ToastType, typeof Check> = {
  success: Check,
  error: AlertCircle,
  info: Info,
};

export function ToastProvider({ children }: PropsWithChildren) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timeoutsRef = useRef(new Map<number, ReturnType<typeof setTimeout>>());
  const reduceMotion = useReducedMotion();

  const dismiss = useCallback((id: number) => {
    const timeout = timeoutsRef.current.get(id);
    if (timeout) {
      clearTimeout(timeout);
      timeoutsRef.current.delete(id);
    }
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const show = useCallback(
    (type: ToastType, message: string) => {
      const id = Date.now() + Math.random();
      setToasts((current) => [...current, { id, type, message }]);
      timeoutsRef.current.set(
        id,
        setTimeout(() => {
          timeoutsRef.current.delete(id);
          setToasts((current) => current.filter((toast) => toast.id !== id));
        }, TOAST_DURATION_MS),
      );
    },
    [],
  );

  useEffect(() => {
    const timeouts = timeoutsRef.current;
    return () => {
      timeouts.forEach((timeout) => clearTimeout(timeout));
      timeouts.clear();
    };
  }, []);

  const value = useMemo<ToastContextValue>(
    () => ({
      showSuccess: (message) => show('success', message.trim() || 'Action réussie.'),
      showError: (message) => show('error', message.trim() || GENERIC_ERROR_MESSAGE),
      showInfo: (message) => show('info', message.trim()),
    }),
    [show],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-[22px] right-[22px] z-[70] flex w-[min(360px,calc(100vw-44px))] flex-col items-end gap-2"
        role="status">
        <AnimatePresence initial={false}>
          {toasts.map((toast) => {
            const tone = TONES[toast.type];
            const Icon = ICONS[toast.type];
            return (
              <motion.div
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={cn(
                  'pointer-events-auto flex w-full items-center gap-[11px] rounded-app-modal border bg-app-surface px-[15px] py-3 shadow-app-float',
                  tone.border,
                )}
                exit={{ opacity: 0, y: reduceMotion ? 0 : 6, scale: reduceMotion ? 1 : 0.98 }}
                initial={reduceMotion ? false : { opacity: 0, y: 8, scale: 0.98 }}
                key={toast.id}
                layout={!reduceMotion}
                transition={{ duration: reduceMotion ? 0 : 0.18, ease: [0.22, 1, 0.36, 1] }}>
                <span
                  className={cn(
                    'flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-app-icon',
                    tone.icon,
                  )}>
                  <Icon size={15} strokeWidth={2} />
                </span>
                <p className={cn('min-w-0 flex-1 text-[13px] font-medium', tone.text)}>
                  {toast.message}
                </p>
                <button
                  aria-label="Fermer la notification"
                  className="shrink-0 text-app-faint transition-colors duration-150 hover:text-app-text-2"
                  onClick={() => dismiss(toast.id)}
                  type="button">
                  <X size={15} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error('useToast doit être utilisé dans ToastProvider.');
  }

  return context;
}
