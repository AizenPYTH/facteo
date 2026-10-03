'use client';

import { useSyncExternalStore } from 'react';

import {
  PdfSheet,
  TemplateThumbnail,
  useRenderedPdfHtml,
} from '@/components/app/document-composer/preview';
import {
  COMPOSER_TEMPLATE_GROUPS,
  COMPOSER_TEMPLATES,
  type ComposerTemplateOption,
} from '@/lib/domain/pdf/composer-templates';
import type { PdfDocumentInput } from '@/lib/pdf/engine';
import { TEMPLATE_CATEGORY_LABELS } from '@/lib/pdf/engine/templates/types';
import { cn } from '@/lib/utils';

const RECENT_KEY = 'inveq:composer-recent-templates';
const RECENT_EVENT = 'inveq:composer-recent-templates';

function readRecentRaw(): string {
  try {
    return window.localStorage.getItem(RECENT_KEY) ?? '';
  } catch {
    return '';
  }
}

function subscribeRecent(onChange: () => void) {
  window.addEventListener(RECENT_EVENT, onChange);
  window.addEventListener('storage', onChange);
  return () => {
    window.removeEventListener(RECENT_EVENT, onChange);
    window.removeEventListener('storage', onChange);
  };
}

/** Modèles récemment choisis dans ce navigateur (du plus récent au plus ancien). */
export function useRecentTemplateIds(): string[] {
  const raw = useSyncExternalStore(subscribeRecent, readRecentRaw, () => '');
  return raw ? raw.split(',').filter(Boolean) : [];
}

export function rememberTemplate(templateId: string) {
  try {
    const next = [templateId, ...readRecentRaw().split(',').filter((id) => id && id !== templateId)]
      .slice(0, 8)
      .join(',');
    window.localStorage.setItem(RECENT_KEY, next);
    window.dispatchEvent(new Event(RECENT_EVENT));
  } catch {
    // Stockage indisponible : la rangée retombe sur les modèles par défaut.
  }
}

export function findComposerTemplate(templateId: string): ComposerTemplateOption | null {
  return COMPOSER_TEMPLATES.find((template) => template.id === templateId) ?? null;
}

/** Quatre vignettes stables : récents, complétés par un modèle de chaque famille. */
function rowTemplateIds(current: string, recent: string[]): string[] {
  const defaults = COMPOSER_TEMPLATE_GROUPS.map((group) => group.templates[0]?.id).filter(
    (id): id is string => Boolean(id),
  );
  const ids = [...new Set([...recent, ...defaults])].filter((id) => findComposerTemplate(id));
  const row = ids.slice(0, 4);
  if (current && !row.includes(current) && findComposerTemplate(current)) {
    row[row.length - 1] = current;
  }
  return row;
}

/**
 * Colonne droite : aperçu réel du document (feuille A4 mise à jour en direct),
 * modèle courant, modèles récents et accès à la galerie.
 */
export function ComposerPreviewColumn({
  className,
  input,
  onOpenGallery,
  onTemplateChange,
  templateId,
  thumbnailsInput,
}: {
  className?: string;
  /** Entrée du moteur PDF : `null` tant que l'entreprise n'est pas chargée. */
  input: PdfDocumentInput | null;
  onOpenGallery: () => void;
  onTemplateChange: (templateId: string) => void;
  templateId: string;
  /** Même entrée, retardée : les miniatures ne suivent pas chaque frappe. */
  thumbnailsInput: PdfDocumentInput | null;
}) {
  const html = useRenderedPdfHtml(input);
  const recent = useRecentTemplateIds();
  const current = findComposerTemplate(templateId);
  const row = rowTemplateIds(templateId, recent);

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div className="rounded-[18px] border border-iq-line bg-iq-surface px-3.5 pb-3.5 pt-3">
        <div className="flex items-center gap-2.5 px-0.5 pb-3 pt-0.5">
          <h2 className="text-[14px] font-bold">Aperçu</h2>
          <span className="flex shrink-0 items-center gap-1.5 whitespace-nowrap text-[12px] text-iq-ink3">
            <span aria-hidden className="size-1.5 rounded-full bg-iq-ok" />
            En direct
          </span>
          <div className="flex-1" />
          <button
            aria-haspopup="dialog"
            className="flex h-8 min-w-0 max-w-[60%] items-center gap-2 rounded-[9px] border border-iq-line bg-iq-surface pl-1.5 pr-2.5 text-[12.5px] font-semibold transition-colors duration-150 hover:border-iq-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-iq-accent"
            onClick={onOpenGallery}
            title="Changer de modèle"
            type="button">
            <span
              aria-hidden
              className="size-5 shrink-0 rounded-[5px] ring-1 ring-black/5"
              style={{ background: current?.primary ?? 'var(--iq-accent)' }}
            />
            <span className="truncate">
              {current
                ? `${TEMPLATE_CATEGORY_LABELS[current.category]} · ${current.label}`
                : 'Modèle'}
            </span>
            <svg aria-hidden className="shrink-0" fill="none" height="13" stroke="var(--iq-ink3)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.4" viewBox="0 0 24 24" width="13">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
        </div>
        <div className="overflow-hidden rounded-[6px] shadow-[0_0_0_1px_rgba(20,18,40,.06),0_10px_30px_-10px_rgba(20,18,40,.25)]">
          <PdfSheet html={html} title="Aperçu en direct du document" />
        </div>
      </div>

      <div className="flex items-center gap-2 px-0.5">
        {row.map((id) => {
          const template = findComposerTemplate(id);
          const active = id === templateId;
          return (
            <button
              aria-label={`Modèle ${template?.label ?? id}`}
              aria-pressed={active}
              className={cn(
                'w-[46px] shrink-0 overflow-hidden rounded-[6px] p-0 transition-shadow duration-150 focus-visible:outline-none',
                active
                  ? 'shadow-[0_0_0_2px_var(--iq-accent)]'
                  : 'shadow-[0_0_0_1px_rgba(20,18,40,.1)] hover:shadow-[0_0_0_2px_var(--iq-line)] focus-visible:shadow-[0_0_0_2px_var(--iq-accent)]',
              )}
              key={id}
              onClick={() => onTemplateChange(id)}
              title={template?.label}
              type="button">
              <TemplateThumbnail input={thumbnailsInput} templateId={id} />
            </button>
          );
        })}
        <div className="flex-1" />
        <button
          className="flex h-[34px] items-center gap-[7px] rounded-[9px] bg-iq-accent-soft px-3 text-[13px] font-bold text-iq-accent-ink transition-[filter] duration-150 hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-iq-accent"
          onClick={onOpenGallery}
          type="button">
          <svg aria-hidden fill="none" height="15" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="15">
            <rect height="7" rx="1.5" width="7" x="4" y="4" />
            <rect height="7" rx="1.5" width="7" x="13" y="4" />
            <rect height="7" rx="1.5" width="7" x="4" y="13" />
            <rect height="7" rx="1.5" width="7" x="13" y="13" />
          </svg>
          Les {COMPOSER_TEMPLATES.length} modèles
        </button>
      </div>
    </div>
  );
}
