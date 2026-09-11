'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { Camera, FileText, Package, Receipt, Table, Upload, UserPlus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { downloadSpreadsheetTemplate } from '@/lib/domain/catalog/spreadsheet-import';
import { cn } from '@/lib/utils';

const ease = [0.22, 1, 0.36, 1] as const;

type CreateEntry = {
  id: string;
  label: string;
  hint: string;
  icon: LucideIcon;
  accent?: boolean;
  href?: string;
  run?: () => void | Promise<void>;
};

/** Ordre imposé par le handoff v2 (§12) : les trois entrées IA ferment la liste. */
const CREATE_ENTRIES: CreateEntry[] = [
  {
    id: 'quote',
    label: 'Devis',
    hint: 'Depuis le catalogue ou une ligne libre',
    icon: FileText,
    href: '/app/quotes?create=1',
  },
  {
    id: 'invoice',
    label: 'Facture',
    hint: 'Ou convertir un devis accepté',
    icon: Receipt,
    href: '/app/invoices?create=1',
  },
  {
    id: 'client',
    label: 'Client',
    hint: 'Recherche SIRET automatique',
    icon: UserPlus,
    href: '/app/clients/new',
  },
  {
    id: 'product',
    label: 'Produit ou prestation',
    hint: 'Fiche manuelle',
    icon: Package,
    href: '/app/products?create=1',
  },
  {
    id: 'ai-image',
    label: 'Créer depuis une image',
    hint: 'IA · fiche produit, catalogue ou étiquette',
    icon: Camera,
    accent: true,
    href: '/app/ai?tool=image',
  },
  {
    id: 'template',
    label: 'Télécharger le modèle de tableur',
    hint: 'Étape 1 avant tout import Excel ou CSV',
    icon: Table,
    accent: true,
    run: () => downloadSpreadsheetTemplate('products'),
  },
  {
    id: 'ai-spreadsheet',
    label: 'Importer le modèle rempli',
    hint: 'IA · vos lignes arrivent dans le catalogue',
    icon: Upload,
    accent: true,
    href: '/app/ai?tool=spreadsheet',
  },
];

export function CreateMenuModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose, open]);

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.button
            animate={{ opacity: 1 }}
            aria-label="Fermer"
            className="absolute inset-0 bg-app-scrim"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            onClick={onClose}
            transition={{ duration: reduceMotion ? 0 : 0.16 }}
            type="button"
          />
          <motion.div
            animate={{ opacity: 1, y: 0, scale: 1 }}
            aria-label="Créer"
            aria-modal="true"
            className="relative w-[420px] max-w-[92vw] overflow-hidden rounded-app-card border border-app-border bg-app-surface shadow-app-float"
            exit={{ opacity: 0, y: 6, scale: 0.99 }}
            initial={reduceMotion ? false : { opacity: 0, y: 8, scale: 0.99 }}
            role="dialog"
            transition={{ duration: reduceMotion ? 0 : 0.16, ease }}>
            <p className="border-b border-app-border-soft px-4 py-3.5 text-[15px] font-semibold tracking-[-0.01em] text-app-text">
              Créer
            </p>
            <div className="sb max-h-[70vh] overflow-y-auto p-2">
              {CREATE_ENTRIES.map((entry) => {
                const Icon = entry.icon;
                return (
                  <button
                    className="flex w-full items-center gap-[11px] rounded-app-field px-2.5 py-2.5 text-left transition-colors duration-150 hover:bg-app-accent-soft"
                    key={entry.id}
                    onClick={() => {
                      onClose();
                      if (entry.href) router.push(entry.href);
                      else void entry.run?.();
                    }}
                    type="button">
                    <span
                      className={cn(
                        'flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-app-icon',
                        entry.accent
                          ? 'border border-app-accent-border bg-app-accent-violet-tint text-app-accent-strong'
                          : 'bg-app-accent-tint text-app-accent',
                      )}>
                      <Icon size={15} strokeWidth={1.75} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13.5px] font-semibold text-app-text">
                        {entry.label}
                      </span>
                      <span className="block truncate text-[11.5px] text-app-muted-2">
                        {entry.hint}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
