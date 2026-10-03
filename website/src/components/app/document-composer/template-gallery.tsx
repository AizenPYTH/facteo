'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';

import {
  PdfSheet,
  TemplateThumbnail,
  useRenderedPdfHtml,
} from '@/components/app/document-composer/preview';
import { findComposerTemplate } from '@/components/app/document-composer/preview-column';
import { IQ_PRIMARY } from '@/components/app/document-composer/ui';
import {
  COMPOSER_TEMPLATE_GROUPS,
  COMPOSER_TEMPLATES,
} from '@/lib/domain/pdf/composer-templates';
import type { PdfDocumentInput } from '@/lib/pdf/engine';
import {
  TEMPLATE_CATEGORY_LABELS,
  type TemplateCategory,
} from '@/lib/pdf/engine/templates/types';
import { cn } from '@/lib/utils';

type CategoryFilter = 'all' | TemplateCategory;

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

/**
 * Galerie des modèles (1200 × 800) : catégories avec compteurs, grille de
 * miniatures réelles, grand aperçu du modèle sélectionné, « Utiliser ce modèle ».
 * Montée seulement quand elle est ouverte : la sélection repart du modèle courant.
 */
export function ComposerTemplateGallery({
  input,
  onApply,
  onClose,
  value,
}: {
  input: PdfDocumentInput | null;
  onApply: (templateId: string) => void;
  onClose: () => void;
  value: string;
}) {
  const reduceMotion = useReducedMotion();
  const initial = findComposerTemplate(value);
  const [selected, setSelected] = useState(initial?.id ?? COMPOSER_TEMPLATES[0]?.id ?? '');
  const [category, setCategory] = useState<CategoryFilter>(initial?.category ?? 'all');
  const [search, setSearch] = useState('');
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    }
    window.addEventListener('keydown', onKey);
    const previous = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();
    return () => {
      window.removeEventListener('keydown', onKey);
      previous?.focus?.();
    };
  }, [onClose]);

  const items = useMemo(() => {
    const wanted = normalize(search.trim());
    return COMPOSER_TEMPLATES.filter(
      (template) =>
        (category === 'all' || template.category === category) &&
        (!wanted ||
          normalize(`${template.label} ${template.description}`).includes(wanted)),
    );
  }, [category, search]);

  const selectedTemplate = findComposerTemplate(selected);
  const previewInput = useMemo(
    () => (input && selected ? { ...input, templateId: selected } : null),
    [input, selected],
  );
  const previewHtml = useRenderedPdfHtml(previewInput);

  const categories: { id: CategoryFilter; label: string; count: number }[] = [
    { id: 'all', label: 'Tous', count: COMPOSER_TEMPLATES.length },
    ...COMPOSER_TEMPLATE_GROUPS.map((group) => ({
      id: group.category,
      label: group.label,
      count: group.templates.length,
    })),
  ];
  const title =
    search.trim() ? 'Résultats' : category === 'all' ? 'Tous les modèles' : TEMPLATE_CATEGORY_LABELS[category];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
      <motion.button
        animate={{ opacity: 1 }}
        aria-label="Fermer la galerie"
        className="absolute inset-0 bg-iq-scrim"
        initial={reduceMotion ? false : { opacity: 0 }}
        onClick={onClose}
        tabIndex={-1}
        transition={{ duration: 0.18 }}
        type="button"
      />
      <motion.div
        animate={{ opacity: 1, y: 0, scale: 1 }}
        aria-label="Modèles de document"
        aria-modal="true"
        className="relative grid h-[min(800px,calc(100dvh-24px))] w-[min(1200px,100%)] grid-cols-1 overflow-hidden rounded-[22px] bg-iq-surface text-iq-ink shadow-[0_40px_100px_-30px_var(--iq-shadow)] outline-none md:grid-cols-[200px_minmax(0,1fr)] lg:grid-cols-[220px_minmax(0,1fr)_340px]"
        initial={reduceMotion ? false : { opacity: 0, y: 12, scale: 0.985 }}
        ref={dialogRef}
        role="dialog"
        tabIndex={-1}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}>
        <nav className="hidden overflow-y-auto border-r border-iq-line2 bg-iq-soft px-3.5 py-6 md:block">
          <p className="px-2.5 text-[19px] font-extrabold tracking-[-0.4px]">Modèles</p>
          <p className="px-2.5 pb-4 pt-1 text-[12.5px] text-iq-ink3">
            {COMPOSER_TEMPLATES.length} modèles, {COMPOSER_TEMPLATE_GROUPS.length} catégories
          </p>
          {categories.map((entry) => {
            const active = entry.id === category && !search.trim();
            return (
              <button
                aria-pressed={active}
                className={cn(
                  'flex h-9 w-full items-center justify-between rounded-[9px] px-2.5 text-left text-[13.5px] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-iq-accent',
                  active
                    ? 'bg-iq-surface font-bold text-iq-ink shadow-[0_1px_2px_var(--iq-shadow)]'
                    : 'font-medium text-iq-ink2 hover:bg-iq-surface/60',
                )}
                key={entry.id}
                onClick={() => {
                  setCategory(entry.id);
                  setSearch('');
                }}
                type="button">
                <span>{entry.label}</span>
                <span className="text-[12px] font-medium text-iq-ink3">{entry.count}</span>
              </button>
            );
          })}
        </nav>

        <div className="flex min-h-0 min-w-0 flex-col">
          <div className="flex flex-wrap items-center gap-3 px-6 pb-4 pt-[22px]">
            <h2 className="text-[16px] font-bold">{title}</h2>
            <span className="text-[13px] text-iq-ink3">
              {items.length} modèle{items.length > 1 ? 's' : ''}
            </span>
            <div className="flex-1" />
            <label className="flex h-9 w-full items-center gap-2 rounded-[10px] border border-iq-line px-3 text-iq-ink3 focus-within:border-iq-accent sm:w-[220px]">
              <svg aria-hidden className="shrink-0" fill="none" height="15" stroke="currentColor" strokeLinecap="round" strokeWidth="2" viewBox="0 0 24 24" width="15">
                <circle cx="11" cy="11" r="6.5" />
                <path d="M20 20l-4-4" />
              </svg>
              <input
                aria-label="Rechercher un modèle"
                className="min-w-0 flex-1 border-0 bg-transparent text-[13px] text-iq-ink outline-none"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Rechercher un modèle"
                value={search}
              />
            </label>
            <button
              aria-label="Fermer"
              className="flex size-[34px] items-center justify-center rounded-[9px] bg-iq-soft text-iq-ink2 lg:hidden"
              onClick={onClose}
              type="button">
              <CloseIcon />
            </button>
          </div>
          {/* Catégories en pastilles quand la colonne latérale est masquée. */}
          <div className="flex gap-1.5 overflow-x-auto px-6 pb-3 md:hidden">
            {categories.map((entry) => (
              <button
                aria-pressed={entry.id === category}
                className={cn(
                  'h-8 shrink-0 rounded-full border px-3 text-[12.5px] font-semibold',
                  entry.id === category
                    ? 'border-iq-accent bg-iq-accent-soft text-iq-accent-ink'
                    : 'border-iq-line text-iq-ink2',
                )}
                key={entry.id}
                onClick={() => setCategory(entry.id)}
                type="button">
                {entry.label}
              </button>
            ))}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6 pt-1">
            {items.length === 0 ? (
              <p className="py-16 text-center text-[13.5px] text-iq-ink3">Aucun modèle ne correspond.</p>
            ) : (
              <div className="grid grid-cols-2 gap-x-[18px] gap-y-5 sm:grid-cols-3 xl:grid-cols-4">
                {items.map((template) => {
                  const active = template.id === selected;
                  return (
                    <button
                      aria-pressed={active}
                      className="group text-left focus-visible:outline-none"
                      key={template.id}
                      onClick={() => setSelected(template.id)}
                      onDoubleClick={() => onApply(template.id)}
                      type="button">
                      <span
                        className={cn(
                          'relative block rounded-[9px] bg-iq-soft p-1 transition-shadow duration-150',
                          active
                            ? 'shadow-[0_0_0_2px_var(--iq-accent)]'
                            : 'group-hover:shadow-[0_0_0_2px_var(--iq-line)] group-focus-visible:shadow-[0_0_0_2px_var(--iq-accent)]',
                        )}>
                        <span className="block overflow-hidden rounded-[5px] shadow-[0_0_0_1px_rgba(20,18,40,.08)]">
                          <TemplateThumbnail input={input} templateId={template.id} />
                        </span>
                        {active ? (
                          <span className="absolute right-2.5 top-2.5 flex size-[22px] items-center justify-center rounded-full bg-iq-accent">
                            <svg aria-hidden fill="none" height="12" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.2" viewBox="0 0 24 24" width="12">
                              <path d="M5 12.5l4.5 4.5L19 7.5" />
                            </svg>
                          </span>
                        ) : null}
                      </span>
                      <span className="mt-2 block truncate text-[13px] font-bold">{template.label}</span>
                      <span className="block text-[12px] text-iq-ink3">
                        {TEMPLATE_CATEGORY_LABELS[template.category]}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          {/* Action en bas sur écran moyen, quand le panneau de droite est masqué. */}
          <div className="flex items-center gap-3 border-t border-iq-line2 px-6 py-3.5 lg:hidden">
            <p className="min-w-0 flex-1 truncate text-[13px] text-iq-ink2">
              <span className="font-bold text-iq-ink">{selectedTemplate?.label}</span>
              {selectedTemplate ? ` · ${TEMPLATE_CATEGORY_LABELS[selectedTemplate.category]}` : null}
            </p>
            <button className={IQ_PRIMARY} onClick={() => onApply(selected)} type="button">
              Utiliser ce modèle
            </button>
          </div>
        </div>

        <aside className="hidden min-h-0 flex-col border-l border-iq-line2 px-6 py-[22px] lg:flex">
          <div className="flex justify-end">
            <button
              aria-label="Fermer"
              className="flex size-[34px] items-center justify-center rounded-[9px] bg-iq-soft text-iq-ink2 transition-colors duration-150 hover:text-iq-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-iq-accent"
              onClick={onClose}
              type="button">
              <CloseIcon />
            </button>
          </div>
          <div className="mt-1.5 overflow-hidden rounded-[6px] shadow-[0_0_0_1px_rgba(20,18,40,.08),0_16px_36px_-14px_rgba(20,18,40,.35)]">
            <PdfSheet html={previewHtml} title="Aperçu du modèle sélectionné" />
          </div>
          <p className="mt-5 text-[18px] font-extrabold tracking-[-0.3px]">{selectedTemplate?.label}</p>
          <p className="mt-0.5 text-[13px] text-iq-ink3">
            {selectedTemplate ? TEMPLATE_CATEGORY_LABELS[selectedTemplate.category] : null}
          </p>
          <p className="mt-3 text-[13.5px] leading-[1.55] text-iq-ink2 [text-wrap:pretty]">
            {selectedTemplate?.description}
          </p>
          <div className="min-h-4 flex-1" />
          <button
            className={cn(IQ_PRIMARY, 'h-11 w-full rounded-[11px] text-[14px]')}
            onClick={() => onApply(selected)}
            type="button">
            Utiliser ce modèle
          </button>
          <p className="mt-2.5 text-center text-[12.5px] text-iq-ink3">
            Le modèle reste modifiable jusqu’à l’envoi.
          </p>
        </aside>
      </motion.div>
    </div>
  );
}

function CloseIcon() {
  return (
    <svg aria-hidden fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeWidth="2.2" viewBox="0 0 24 24" width="16">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}
