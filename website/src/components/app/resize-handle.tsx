'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { cn } from '@/lib/utils';

export function ResizeHandle({
  onResize,
  className,
}: {
  onResize: (deltaX: number) => void;
  className?: string;
}) {
  const dragging = useRef(false);
  const lastX = useRef(0);

  const onMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!dragging.current) return;
      const delta = lastX.current - e.clientX;
      lastX.current = e.clientX;
      onResize(delta);
    },
    [onResize],
  );

  const onMouseUp = useCallback(() => {
    dragging.current = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
  }, [onMouseMove]);

  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = true;
    lastX.current = e.clientX;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  useEffect(() => () => onMouseUp(), [onMouseUp]);

  return (
    <div
      className={cn(
        'group relative z-10 hidden w-1.5 shrink-0 cursor-col-resize bg-transparent lg:block',
        'hover:bg-primary/20 active:bg-primary/30',
        className,
      )}
      onMouseDown={onMouseDown}
      role="separator"
      aria-orientation="vertical"
      aria-label="Redimensionner l'aperçu">
      <div className="absolute inset-y-0 -left-1 -right-1" />
      <div className="absolute left-1/2 top-1/2 h-8 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-slate-300 opacity-0 transition group-hover:opacity-100" />
    </div>
  );
}

const STORAGE_KEY = 'factume-composer-preview-width';
const WORKSPACE_SIDEBAR_KEY = 'factume-workspace-sidebar-width';

function useStoredWidth(storageKey: string, defaultWidth: number, min: number, max: number) {
  const [width, setWidthState] = useState(defaultWidth);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = Number(stored);
        if (Number.isFinite(parsed) && parsed >= min) setWidthState(parsed);
      }
    } catch {
      /* ignore */
    }
  }, [min, storageKey]);

  const setWidth = useCallback(
    (next: number | ((w: number) => number)) => {
      setWidthState((prev) => {
        const value = typeof next === 'function' ? next(prev) : next;
        const clamped = Math.min(Math.max(value, min), max);
        try {
          localStorage.setItem(storageKey, String(clamped));
        } catch {
          /* ignore */
        }
        return clamped;
      });
    },
    [max, min, storageKey],
  );

  return [width, setWidth] as const;
}

export function usePreviewPanelWidth(defaultWidth = 480) {
  return useStoredWidth(STORAGE_KEY, defaultWidth, 320, 900);
}

export function useWorkspaceSidebarWidth(defaultWidth = 340) {
  return useStoredWidth(WORKSPACE_SIDEBAR_KEY, defaultWidth, 280, 520);
}
