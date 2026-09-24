'use client';

import { ComposerCard } from '@/components/app/document-composer/composer-card';
import { LegalIdsPicker } from '@/components/app/document-composer/legal-ids-picker';
import { StampPicker } from '@/components/app/document-composer/stamp-picker';
import { TextInput } from '@/components/app/form-fields';
import { cn } from '@/lib/utils';
import {
  DEFAULT_INVOICE_TITLE,
  INVOICE_TITLE_SUGGESTIONS,
  type InvoicePdfOptions,
} from '@/types/pdf-options';

const CHIP =
  'rounded-app-field border px-2.5 py-[6px] text-[12.5px] font-semibold transition-[background-color,border-color,color] duration-150';
const CHIP_ON = 'border-app-accent-border bg-app-accent-tint text-app-accent-strong';
const CHIP_OFF = 'border-app-border text-app-muted hover:border-app-accent hover:text-app-text';

/**
 * Numéro, titre du document et identifiants de l'entreprise émettrice (SIREN, SIRET,
 * TVA) affichés en tête de la facture.
 */
export function ComposerPresentationCard({
  company,
  forecastNumber,
  number,
  onChange,
  onNumberChange,
  value,
}: {
  /** Entreprise émettrice : ses SIRET et TVA sont montrés à côté des cases. */
  company: { id: string; siret: string | null; vatNumber: string | null } | null;
  /** Numéro automatique qui sera attribué si le champ reste vide. */
  forecastNumber: string | null;
  number: string;
  onChange: (value: InvoicePdfOptions) => void;
  onNumberChange: (value: string) => void;
  value: InvoicePdfOptions;
}) {
  const title = value.title ?? '';
  const activeTitle = title.trim() || DEFAULT_INVOICE_TITLE;

  return (
    <ComposerCard title="Présentation de la facture">
      <div className="space-y-3.5">
        <div>
          <label
            className="mb-1.5 block text-[12px] font-medium text-app-text-3"
            htmlFor="composer-document-number">
            Numéro de la facture
          </label>
          <TextInput
            className="app-num"
            id="composer-document-number"
            maxLength={40}
            onChange={(event) => onNumberChange(event.target.value)}
            placeholder={forecastNumber ?? 'Automatique'}
            value={number}
          />
          <p className="mt-1.5 text-[11.5px] leading-relaxed text-app-muted-2">
            Laissez vide pour le numéro automatique. Chaque numéro ne peut servir qu’une fois.
          </p>
        </div>

        <div>
          <label
            className="mb-1.5 block text-[12px] font-medium text-app-text-3"
            htmlFor="composer-document-title">
            Titre du document
          </label>
          <TextInput
            id="composer-document-title"
            maxLength={60}
            onChange={(event) => onChange({ ...value, title: event.target.value })}
            placeholder={DEFAULT_INVOICE_TITLE}
            value={title}
          />
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {INVOICE_TITLE_SUGGESTIONS.map((suggestion) => (
              <button
                aria-pressed={activeTitle === suggestion}
                className={cn(CHIP, activeTitle === suggestion ? CHIP_ON : CHIP_OFF)}
                key={suggestion}
                onClick={() =>
                  onChange({
                    ...value,
                    title: suggestion === DEFAULT_INVOICE_TITLE ? null : suggestion,
                  })
                }
                type="button">
                {suggestion}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-1.5 text-[12px] font-medium text-app-text-3">
            En tête de la facture : cochez ce qui doit apparaître
          </p>
          <LegalIdsPicker
            company={company}
            onChange={(legalIds) => onChange({ ...value, legalIds })}
            value={value.legalIds}
          />
          <p className="mt-1.5 text-[11.5px] leading-relaxed text-app-muted-2">
            Votre choix est repris pour la facture suivante et reste modifiable après création.
          </p>
        </div>

        <label className="flex cursor-pointer items-center gap-2.5 text-[12.5px] font-medium text-app-text-3">
          <input
            checked={value.showEmail}
            className="h-[14px] w-[14px] [accent-color:var(--app-accent)]"
            onChange={(event) => onChange({ ...value, showEmail: event.target.checked })}
            type="checkbox"
          />
          Afficher mon e-mail sur la facture
        </label>

        <StampPicker
          color={value.stampColor}
          onColorChange={(stampColor) => onChange({ ...value, stampColor })}
          onPositionChange={(stampPosition) => onChange({ ...value, stampPosition })}
          position={value.stampPosition}
        />
      </div>
    </ComposerCard>
  );
}
