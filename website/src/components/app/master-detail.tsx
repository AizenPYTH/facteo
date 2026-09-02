'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { X } from 'lucide-react';
import { useCallback, useEffect, useRef, useSyncExternalStore } from 'react';

import { cn } from '@/lib/utils';

const DOCKED_PANEL_QUERY = '(min-width: 1280px)';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

function useDockedPanel() {
  const subscribe = useCallback((onStoreChange: () => void) => {
    const query = window.matchMedia(DOCKED_PANEL_QUERY);
    query.addEventListener('change', onStoreChange);
    return () => query.removeEventListener('change', onStoreChange);
  }, []);

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(DOCKED_PANEL_QUERY).matches,
    () => true,
  );
}

/** Échap, verrou de défilement, focus piégé et retour du focus à l'élément d'origine. */
function useOverlayPanel(active: boolean, onClose?: () => void) {
  const panelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!active || !onClose) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [active, onClose]);

  useEffect(() => {
    if (!active) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [active]);

  useEffect(() => {
    if (!active) return;
    const panel = panelRef.current;
    if (!panel) return;

    const origin = document.activeElement as HTMLElement | null;
    const focusables = () =>
      Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
        (node) => node.offsetWidth > 0 || node.offsetHeight > 0,
      );

    const initial = focusables()[0];
    if (initial) initial.focus();
    else panel.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;
      const nodes = focusables();
      if (nodes.length === 0) {
        event.preventDefault();
        panel.focus();
        return;
      }
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const current = document.activeElement;
      if (event.shiftKey && (current === first || current === panel)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && current === last) {
        event.preventDefault();
        first.focus();
      }
    };

    panel.addEventListener('keydown', onKeyDown);
    return () => {
      panel.removeEventListener('keydown', onKeyDown);
      if (origin?.isConnected) origin.focus();
    };
  }, [active]);

  return panelRef;
}

export function MasterDetailLayout({
  list,
  detail,
  detailOpen = false,
  onCloseDetail,
  detailTitle = 'Détail',
  className,
}: {
  list: React.ReactNode;
  detail: React.ReactNode;
  /** Le panneau n'est monté que lorsqu'un élément est sélectionné. */
  detailOpen?: boolean;
  onCloseDetail?: () => void;
  detailTitle?: string;
  className?: string;
  /** @deprecated inerte : le panneau de détail est fixé à 392px. */
  sidebarWidth?: number;
  /** @deprecated inerte : le panneau de détail est fixé à 392px. */
  onSidebarResize?: (delta: number) => void;
}) {
  const docked = useDockedPanel();
  const reduceMotion = useReducedMotion();
  const overlayActive = detailOpen && !docked;
  const panelRef = useOverlayPanel(overlayActive, onCloseDetail);

  return (
    <div className={cn('flex h-full min-h-0 w-full bg-app-canvas', className)}>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-app-surface">{list}</div>

      {detailOpen && docked ? (
        <aside
          aria-label={detailTitle}
          className="sb flex w-[392px] shrink-0 flex-col overflow-y-auto border-l border-app-border bg-app-surface">
          {detail}
        </aside>
      ) : null}

      <AnimatePresence>
        {overlayActive ? (
          <>
            <motion.button
              animate={{ opacity: 1 }}
              aria-label="Fermer le panneau"
              className="fixed inset-0 z-40 bg-app-scrim"
              exit={{ opacity: 0 }}
              initial={{ opacity: 0 }}
              onClick={onCloseDetail}
              transition={{ duration: reduceMotion ? 0 : 0.18 }}
              type="button"
            />
            <motion.aside
              animate={{ x: 0 }}
              aria-label={detailTitle}
              aria-modal="true"
              className="fixed inset-y-0 right-0 z-40 flex w-[420px] max-w-full flex-col border-l border-app-border bg-app-surface shadow-app-float outline-none max-[899px]:w-full"
              exit={{ x: reduceMotion ? 0 : '100%' }}
              initial={reduceMotion ? false : { x: '100%' }}
              ref={panelRef}
              role="dialog"
              tabIndex={-1}
              transition={{ duration: reduceMotion ? 0 : 0.22, ease: [0.22, 1, 0.36, 1] }}>
              <div className="flex shrink-0 items-center justify-between gap-3 border-b border-app-border-soft px-4 py-2">
                <p className="truncate text-[11px] font-bold uppercase tracking-[0.12em] text-app-faint">
                  {detailTitle}
                </p>
                <button
                  aria-label="Fermer le panneau"
                  className="-mr-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-app-field text-app-muted-2 transition-colors duration-150 hover:bg-app-border-soft hover:text-app-text-2"
                  onClick={onCloseDetail}
                  type="button">
                  <X size={18} />
                </button>
              </div>
              <div className="sb min-h-0 flex-1 overflow-y-auto">{detail}</div>
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export function WorkspaceToolbar({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex shrink-0 items-center justify-between gap-4 border-b border-app-border bg-app-surface px-5 py-3.5">
      <div className="min-w-0">
        <h1 className="truncate text-[19px] font-semibold tracking-[-0.01em] text-app-text">
          {title}
        </h1>
        {subtitle ? <p className="truncate text-[13px] text-app-muted">{subtitle}</p> : null}
      </div>
      {children ? <div className="flex shrink-0 items-center gap-2">{children}</div> : null}
    </div>
  );
}
