'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { LegalIdsPlacementEditor } from '@/components/app/document-composer/legal-ids-placement-editor';
import { CheckMark, IQ_FIELD, Segmented } from '@/components/app/document-composer/ui';
import type { PdfDocumentInput } from '@/lib/pdf/engine';
import { fetchCompanySiren } from '@/lib/domain/supabase/companies';
import { cn } from '@/lib/utils';
import {
  DEFAULT_INVOICE_TITLE,
  formatIssuerLegalIds,
  INVOICE_TITLE_SUGGESTIONS,
  ISSUER_LEGAL_IDS,
  LEGAL_IDS_PLACEMENT_LABELS,
  STAMP_COLOR_VALUES,
  STAMP_COLORS,
  STAMP_POSITION_LABELS,
  STAMP_POSITIONS,
  type InvoicePdfOptions,
  type IssuerLegalId,
  type StampColor,
} from '@/types/pdf-options';

const STAMP_COLOR_NAMES: Record<StampColor, string> = {
  auto: 'Auto',
  green: 'Vert',
  blue: 'Bleu',
  red: 'Rouge',
  black: 'Noir',
};

/** Ordre du handoff : Auto, Vert, Bleu, Rouge, Noir. */
const STAMP_COLOR_ORDER: StampColor[] = ['auto', 'green', 'blue', 'red', 'black'].filter(
  (entry): entry is StampColor => STAMP_COLORS.includes(entry as StampColor),
);

type IdentifierKey = IssuerLegalId | 'email';

const IDENTIFIERS: { key: IdentifierKey; label: string }[] = [
  { key: 'siren', label: 'SIREN' },
  { key: 'siret', label: 'SIRET' },
  { key: 'vat', label: 'N° de TVA' },
  { key: 'email', label: 'E-mail' },
];

export function optionsSummary(value: InvoicePdfOptions, customNumber: string, paid: boolean) {
  const count = value.legalIds.length + (value.showEmail ? 1 : 0);
  return [
    customNumber.trim() ? 'Numéro personnalisé' : 'Numéro automatique',
    `${count} identifiant${count > 1 ? 's' : ''} affiché${count > 1 ? 's' : ''}`,
    paid && value.stampPosition !== 'none' ? 'Tampon « Payée »' : 'Sans tampon',
  ].join(' · ');
}

/**
 * « Options de présentation » : repliable, fermé par défaut, résumé sur une
 * ligne. Numéro, titre, identifiants affichés et tampon « Facture payée ».
 */
export function ComposerOptionsPanel({
  company,
  forecastNumber,
  number,
  onChange,
  onNumberChange,
  paid,
  previewInput,
  value,
}: {
  company: { id: string; email?: string | null; siret: string | null; vatNumber: string | null } | null;
  forecastNumber: string | null;
  number: string;
  onChange: (value: InvoicePdfOptions) => void;
  onNumberChange: (value: string) => void;
  /** Délai « Déjà payée » : débloque le tampon. */
  paid: boolean;
  /** Document en cours, ouvert en grand pour placer les identifiants à la main. */
  previewInput: PdfDocumentInput | null;
  value: InvoicePdfOptions;
}) {
  const [open, setOpen] = useState(false);
  const [placing, setPlacing] = useState(false);
  const placement = value.legalIdsPlacement;
  const placementMode = typeof placement === 'object' ? 'free' : placement;
  const [customMode, setCustomMode] = useState(() => Boolean(number.trim()));
  const sirenQuery = useQuery({
    queryKey: ['company-siren', company?.id],
    queryFn: () => fetchCompanySiren(company!.id),
    enabled: Boolean(open && company?.id),
  });
  const legalValues = formatIssuerLegalIds(company?.siret, company?.vatNumber, sirenQuery.data);
  const title = value.title ?? '';
  const activeTitle = title.trim() || DEFAULT_INVOICE_TITLE;

  function isChecked(key: IdentifierKey): boolean {
    return key === 'email' ? value.showEmail : value.legalIds.includes(key);
  }

  function toggle(key: IdentifierKey) {
    if (key === 'email') {
      onChange({ ...value, showEmail: !value.showEmail });
      return;
    }
    const checked = !value.legalIds.includes(key);
    onChange({
      ...value,
      legalIds: ISSUER_LEGAL_IDS.filter((entry) =>
        entry === key ? checked : value.legalIds.includes(entry),
      ),
    });
  }

  function identifierHint(key: IdentifierKey): string | null {
    if (key === 'email') return company?.email?.trim() || null;
    return legalValues[key];
  }

  return (
    <section className="rounded-[16px] border border-iq-line bg-iq-surface">
      <button
        aria-controls="composer-options"
        aria-expanded={open}
        className="flex w-full items-center gap-3.5 rounded-[16px] px-5 py-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-iq-accent"
        onClick={() => setOpen((current) => !current)}
        type="button">
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-bold">Options de présentation</span>
          <span className="mt-0.5 block text-[13px] text-iq-ink3">
            {optionsSummary(value, number, paid)}
          </span>
        </span>
        <svg
          aria-hidden
          className={cn('shrink-0 transition-transform duration-200 ease-out', open && 'rotate-180')}
          fill="none"
          height="18"
          stroke="var(--iq-ink3)"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          width="18">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open ? (
        <div
          className="grid grid-cols-1 gap-x-8 gap-y-[26px] border-t border-iq-line2 px-5 pb-[22px] pt-5 sm:grid-cols-2"
          id="composer-options">
          <div>
            <p className="mb-2.5 text-[13.5px] font-bold">Numéro de facture</p>
            <Segmented
              ariaLabel="Numéro de facture"
              onChange={(mode) => {
                setCustomMode(mode === 'custom');
                if (mode === 'auto') onNumberChange('');
              }}
              options={[
                { value: 'auto', label: 'Automatique' },
                { value: 'custom', label: 'Personnalisé' },
              ]}
              value={customMode ? 'custom' : 'auto'}
            />
            {customMode ? (
              <>
                <input
                  aria-label="Numéro personnalisé"
                  autoFocus={!number}
                  className={cn(IQ_FIELD, 'mt-2')}
                  maxLength={40}
                  onChange={(event) => onNumberChange(event.target.value)}
                  placeholder={forecastNumber ? `Ex. ${forecastNumber}` : 'Ex. 2026-ATN-014'}
                  value={number}
                />
                <p className="mt-2 text-[12.5px] text-iq-ink3">Chaque numéro ne peut servir qu’une fois.</p>
              </>
            ) : (
              <p className="mt-2 text-[12.5px] text-iq-ink3">
                Prochain numéro :{' '}
                <span className="font-semibold text-iq-ink2">{forecastNumber ?? 'automatique'}</span>
              </p>
            )}
          </div>

          <div>
            <label className="mb-2.5 block text-[13.5px] font-bold" htmlFor="composer-document-title">
              Titre du document
            </label>
            <input
              className={IQ_FIELD}
              id="composer-document-title"
              maxLength={60}
              onChange={(event) => onChange({ ...value, title: event.target.value })}
              placeholder={DEFAULT_INVOICE_TITLE}
              value={title}
            />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {INVOICE_TITLE_SUGGESTIONS.map((suggestion) => {
                const active = activeTitle === suggestion;
                return (
                  <button
                    aria-pressed={active}
                    className={cn(
                      'h-7 rounded-full border px-2.5 text-[12px] font-semibold transition-colors duration-150',
                      active
                        ? 'border-iq-accent bg-iq-accent-soft text-iq-accent-ink'
                        : 'border-iq-line text-iq-ink3 hover:border-iq-ink3 hover:text-iq-ink2',
                    )}
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
                );
              })}
            </div>
          </div>

          <div>
            <p className="mb-2.5 text-[13.5px] font-bold">Identifiants affichés</p>
            <div className="grid grid-cols-2 gap-2">
              {IDENTIFIERS.map((identifier) => {
                const checked = isChecked(identifier.key);
                const hint = identifierHint(identifier.key);
                return (
                  <button
                    aria-pressed={checked}
                    className="flex h-[38px] min-w-0 items-center gap-2.5 rounded-[10px] border border-iq-line bg-iq-surface px-3 text-left text-[13.5px] transition-colors duration-150 hover:border-iq-ink3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-iq-accent"
                    key={identifier.key}
                    onClick={() => toggle(identifier.key)}
                    title={hint ?? 'Non renseigné dans la page Entreprise : n’apparaîtra pas.'}
                    type="button">
                    <CheckMark checked={checked} />
                    <span className="shrink-0">{identifier.label}</span>
                    {checked && !hint && (identifier.key !== 'siren' || !sirenQuery.isLoading) ? (
                      <span className="min-w-0 truncate text-[11.5px] text-iq-danger">non renseigné</span>
                    ) : null}
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-[12.5px] text-iq-ink3">
              Votre choix est repris pour la facture suivante.
            </p>

            <p className="mb-2 mt-4 text-[13px] font-semibold text-iq-ink2">
              Emplacement du SIREN, SIRET et TVA
            </p>
            <Segmented
              ariaLabel="Emplacement du SIREN, du SIRET et de la TVA"
              itemClassName="h-[30px] text-[12.5px]"
              onChange={(mode) => {
                if (mode === 'free') {
                  setPlacing(true);
                } else {
                  onChange({ ...value, legalIdsPlacement: mode });
                }
              }}
              options={(['auto', 'top', 'bottom', 'free'] as const).map((mode) => ({
                value: mode,
                label: LEGAL_IDS_PLACEMENT_LABELS[mode],
              }))}
              value={placementMode}
            />
            {placementMode === 'free' ? (
              <p className="mt-2 text-[12.5px] text-iq-ink3">
                Placé à la main sur la facture.{' '}
                <button
                  className="font-semibold text-iq-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-iq-accent"
                  onClick={() => setPlacing(true)}
                  type="button">
                  Modifier l’endroit
                </button>
              </p>
            ) : null}
            <LegalIdsPlacementEditor
              initial={typeof placement === 'object' ? placement : null}
              input={previewInput}
              onClose={() => setPlacing(false)}
              onSave={(point) => onChange({ ...value, legalIdsPlacement: point })}
              open={placing}
            />
          </div>

          <div>
            <p className="mb-2.5 text-[13.5px] font-bold">Tampon « Facture payée »</p>
            {paid ? (
              <>
                <div aria-label="Couleur du tampon" className="flex flex-wrap gap-1.5" role="group">
                  {STAMP_COLOR_ORDER.map((entry) => {
                    const active = value.stampColor === entry;
                    return (
                      <button
                        aria-pressed={active}
                        className={cn(
                          'flex h-8 items-center gap-[7px] rounded-full border pl-[7px] pr-2.5 text-[12.5px] font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-iq-accent',
                          active
                            ? 'border-iq-accent bg-iq-accent-soft'
                            : 'border-iq-line bg-iq-surface hover:border-iq-ink3',
                        )}
                        key={entry}
                        onClick={() => onChange({ ...value, stampColor: entry })}
                        type="button">
                        <span
                          aria-hidden
                          className="size-4 rounded-full"
                          style={{
                            background:
                              entry === 'auto' ? 'var(--iq-accent)' : STAMP_COLOR_VALUES[entry],
                          }}
                        />
                        {STAMP_COLOR_NAMES[entry]}
                      </button>
                    );
                  })}
                </div>
                <Segmented
                  ariaLabel="Emplacement du tampon"
                  className="mt-2.5"
                  itemClassName="h-[30px] text-[12.5px]"
                  onChange={(stampPosition) => onChange({ ...value, stampPosition })}
                  options={STAMP_POSITIONS.map((entry) => ({
                    value: entry,
                    label: STAMP_POSITION_LABELS[entry],
                  }))}
                  value={value.stampPosition}
                />
              </>
            ) : (
              <p className="rounded-[10px] bg-iq-soft px-3.5 py-3 text-[13px] leading-normal text-iq-ink3">
                Disponible lorsque le délai de paiement est « Déjà payée ».
              </p>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}
