'use client';

import { MoreHorizontal, type LucideIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { cn } from '@/lib/utils';

export type ActionMenuItem = {
  key: string;
  label: string;
  icon?: LucideIcon;
  onSelect: () => void;
  disabled?: boolean;
  tone?: 'default' | 'danger';
};

/**
 * Menu « … ». Le panneau est monté dans un portail car les déclencheurs vivent
 * dans des conteneurs à `overflow:auto` (lignes de tableau, panneau de détail)
 * qui rogneraient un positionnement absolu.
 */
export function ActionMenu({
  items,
  label = 'Autres actions',
  triggerClassName,
  iconSize = 15,
}: {
  items: ActionMenuItem[];
  label?: string;
  triggerClassName?: string;
  iconSize?: number;
}) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [anchor, setAnchor] = useState<{ top: number; right: number } | null>(null);
  const open = anchor !== null;

  useEffect(() => {
    if (!open) return;

    const close = () => setAnchor(null);

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (menuRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
      close();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', close);
    window.addEventListener('scroll', close, true);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', close);
      window.removeEventListener('scroll', close, true);
    };
  }, [open]);

  function toggle(event: React.MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    if (open) {
      setAnchor(null);
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    setAnchor({ top: rect.bottom + 4, right: Math.max(8, window.innerWidth - rect.right) });
  }

  return (
    <>
      <button
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={label}
        className={cn(
          'flex h-7 w-7 items-center justify-center rounded-app-icon text-app-muted-2 transition-colors duration-150 hover:bg-app-border-soft hover:text-app-accent',
          open && 'bg-app-border-soft text-app-accent',
          triggerClassName,
        )}
        onClick={toggle}
        ref={triggerRef}
        title={label}
        type="button">
        <MoreHorizontal size={iconSize} />
      </button>

      {anchor
        ? createPortal(
            <div
              className="fixed z-50 min-w-[212px] rounded-app-control border border-app-border bg-app-surface p-1.5 shadow-app-float"
              onClick={(event) => event.stopPropagation()}
              ref={menuRef}
              role="menu"
              style={{ top: anchor.top, right: anchor.right }}>
              {items.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    className={cn(
                      'flex w-full items-center gap-2.5 rounded-app-field px-2.5 py-2 text-left text-[13px] font-medium transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-45',
                      item.tone === 'danger'
                        ? 'text-app-danger hover:bg-app-danger-tint'
                        : 'text-app-text-2 hover:bg-app-accent-soft hover:text-app-accent',
                    )}
                    disabled={item.disabled}
                    key={item.key}
                    onClick={(event) => {
                      event.stopPropagation();
                      setAnchor(null);
                      item.onSelect();
                    }}
                    role="menuitem"
                    type="button">
                    {Icon ? (
                      <Icon className="shrink-0 text-app-muted-2" size={15} strokeWidth={1.75} />
                    ) : null}
                    <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
