'use client';

import { ComposerCard } from '@/components/app/document-composer/composer-card';
import { TextInput } from '@/components/app/form-fields';
import { cn } from '@/lib/utils';
import {
  DEFAULT_INVOICE_TITLE,
  INVOICE_TITLE_SUGGESTIONS,
  ISSUER_LEGAL_ID_LABELS,
  ISSUER_LEGAL_IDS,
  STAMP_COLOR_LABELS,
  STAMP_COLOR_VALUES,
  STAMP_COLORS,
  STAMP_POSITION_LABELS,
  STAMP_POSITIONS,
  type InvoicePdfOptions,
  type IssuerLegalId,
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
  forecastNumber,
  number,
  onChange,
  onNumberChange,
  value,
}: {
  /** Numéro automatique qui sera attribué si le champ reste vide. */
  forecastNumber: string | null;
  number: string;
  onChange: (value: InvoicePdfOptions) => void;
  onNumberChange: (value: string) => void;
  value: InvoicePdfOptions;
}) {
  const title = value.title ?? '';
  const activeTitle = title.trim() || DEFAULT_INVOICE_TITLE;

  function toggleLegalId(id: IssuerLegalId) {
    const legalIds = value.legalIds.includes(id)
      ? value.legalIds.filter((entry) => entry !== id)
      : ISSUER_LEGAL_IDS.filter((entry) => entry === id || value.legalIds.includes(entry));
    onChange({ ...value, legalIds });
  }

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
          <p className="mb-1.5 text-[12px] font-medium text-app-text-3" id="composer-legal-ids">
            En tête de la facture
          </p>
          <div aria-labelledby="composer-legal-ids" className="flex gap-1.5" role="group">
            {ISSUER_LEGAL_IDS.map((id) => {
              const active = value.legalIds.includes(id);

              return (
                <button
                  aria-pressed={active}
                  className={cn(CHIP, 'flex-1 text-center', active ? CHIP_ON : CHIP_OFF)}
                  key={id}
                  onClick={() => toggleLegalId(id)}
                  type="button">
                  {ISSUER_LEGAL_ID_LABELS[id]}
                </button>
              );
            })}
          </div>
          <p className="mt-1.5 text-[11.5px] leading-relaxed text-app-muted-2">
            Ceux de votre entreprise, repris de la page Entreprise. Le SIREN vient du SIRET.
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

        <div>
          <p className="mb-1.5 text-[12px] font-medium text-app-text-3" id="composer-stamp-color">
            Tampon « Facture payée » : couleur
          </p>
          <div aria-labelledby="composer-stamp-color" className="flex flex-wrap gap-1.5" role="group">
            {STAMP_COLORS.map((color) => {
              const active = value.stampColor === color;

              return (
                <button
                  aria-pressed={active}
                  className={cn(CHIP, 'inline-flex items-center gap-1.5', active ? CHIP_ON : CHIP_OFF)}
                  key={color}
                  onClick={() => onChange({ ...value, stampColor: color })}
                  type="button">
                  <span
                    aria-hidden
                    className="size-2.5 rounded-full border border-black/10"
                    style={{
                      background:
                        color === 'auto'
                          ? 'conic-gradient(#0B7A4B, #1F4FD1, #C0392B, #0B7A4B)'
                          : STAMP_COLOR_VALUES[color],
                    }}
                  />
                  {STAMP_COLOR_LABELS[color]}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p className="mb-1.5 text-[12px] font-medium text-app-text-3" id="composer-stamp-position">
            Tampon « Facture payée » : emplacement
          </p>
          <div aria-labelledby="composer-stamp-position" className="flex gap-1.5" role="group">
            {STAMP_POSITIONS.map((position) => {
              const active = value.stampPosition === position;

              return (
                <button
                  aria-pressed={active}
                  className={cn(CHIP, 'flex-1 px-1.5 text-center', active ? CHIP_ON : CHIP_OFF)}
                  key={position}
                  onClick={() => onChange({ ...value, stampPosition: position })}
                  type="button">
                  {STAMP_POSITION_LABELS[position]}
                </button>
              );
            })}
          </div>
          <p className="mt-1.5 text-[11.5px] leading-relaxed text-app-muted-2">
            Le tampon apparaît dès que la facture est payée. « Près des totaux » s’adapte au modèle choisi.
          </p>
        </div>
      </div>
    </ComposerCard>
  );
}
