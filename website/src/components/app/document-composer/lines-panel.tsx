'use client';

import { useEffect, useRef, useState } from 'react';

import type { FieldErrors, LineValue } from '@/components/app/document-composer/validation';
import {
  IQ_BUTTON,
  IQ_CELL,
  IQ_PANEL,
  IQ_PRIMARY,
  Kbd,
  vatRateLabel,
} from '@/components/app/document-composer/ui';
import { formatCurrency } from '@/lib/domain/format/currency';
import { cn } from '@/lib/utils';

export type LineFieldName = 'description' | 'quantity' | 'unitPrice';

export type ComposerTotals = {
  subtotal: number;
  vat: number;
  total: number;
  discount: number;
  /** Total HT de chaque ligne (après remise). */
  perLineHt: Record<string, number>;
  /** TVA par taux, du plus élevé au plus bas. */
  vatGroups: { rate: number; base: number; amount: number }[];
};

const UNITS = ['unité', 'h', 'jour', 'm²', 'm', 'ml', 'kg', 'forfait', 'lot', 'trajet', 'mois'];
const VAT_RATES = [20, 10, 8.5, 5.5, 2.1, 0];

/**
 * Désignation | Qté | Unité | Prix HT | TVA | Remise | Total HT | suppr.
 * Largeurs du handoff dès 860 px de panneau, colonnes resserrées en dessous
 * (ordinateur 1200–1360 px) pour laisser de la place à la désignation.
 */
const GRID =
  'grid grid-cols-[minmax(0,1fr)_48px_68px_80px_64px_52px_92px_24px] gap-2 px-5 @min-[860px]/lines:grid-cols-[minmax(0,1fr)_56px_76px_90px_66px_62px_98px_24px]';

function parseNumber(value: string): number {
  const parsed = Number(value.replace(/\s/g, '').replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function unitOptions(current: string): string[] {
  const trimmed = current.trim();
  return trimmed && !UNITS.includes(trimmed) ? [trimmed, ...UNITS] : UNITS;
}

function vatOptions(current: string): { value: string; label: string }[] {
  const numeric = parseNumber(current);
  const known = VAT_RATES.find((rate) => rate === numeric);
  const options = VAT_RATES.map((rate) => ({
    value: known === rate ? current : String(rate),
    label: vatRateLabel(rate),
  }));
  if (known === undefined) {
    options.unshift({
      value: current,
      label: Number.isFinite(numeric) ? vatRateLabel(numeric) : current || '—',
    });
  }
  return options;
}

/** Remise nulle affichée vide (« — »), sans gêner la saisie de « 0,5 ». */
function discountDisplay(value: string): string {
  return value.trim() === '0' ? '' : value;
}

const ChevronDown = () => (
  <svg
    aria-hidden
    className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2"
    fill="none"
    height="12"
    stroke="var(--iq-ink3)"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="2.4"
    viewBox="0 0 24 24"
    width="12">
    <path d="M6 9l6 6 6-6" />
  </svg>
);

const TrashIcon = () => (
  <svg aria-hidden fill="none" height="15" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="15">
    <path d="M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12" />
  </svg>
);

const PlusIcon = ({ size = 15 }: { size?: number }) => (
  <svg aria-hidden fill="none" height={size} stroke="currentColor" strokeLinecap="round" strokeWidth="2.4" viewBox="0 0 24 24" width={size}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

/** Sélecteur compact sans bordure (unité, TVA). */
function CompactSelect({
  ariaLabel,
  className,
  onChange,
  onKeyDown,
  options,
  value,
}: {
  ariaLabel: string;
  className?: string;
  onChange: (value: string) => void;
  onKeyDown?: React.KeyboardEventHandler<HTMLSelectElement>;
  options: { value: string; label: string }[];
  value: string;
}) {
  return (
    <div className={cn('relative min-w-0', className)}>
      <select
        aria-label={ariaLabel}
        className={cn(IQ_CELL, 'cursor-pointer appearance-none pr-5 text-iq-ink2')}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={onKeyDown}
        value={value}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown />
    </div>
  );
}

export function ComposerLinesPanel({
  containerRef,
  fieldErrors,
  importFeedback,
  importLabel,
  isImporting,
  lines,
  onAddLine,
  onImportPhoto,
  onImportSpreadsheet,
  onOpenCatalog,
  onRemoveLine,
  onUpdateLine,
  registerLineField,
  submitAttempted,
  totals,
}: {
  containerRef?: React.Ref<HTMLElement>;
  fieldErrors: FieldErrors;
  importFeedback?: string | null;
  /** Nom du fichier en cours de lecture. */
  importLabel?: string | null;
  isImporting?: boolean;
  lines: LineValue[];
  onAddLine: () => void;
  onImportPhoto: () => void;
  onImportSpreadsheet: () => void;
  onOpenCatalog: () => void;
  onRemoveLine: (id: string) => void;
  onUpdateLine: (id: string, patch: Partial<LineValue>) => void;
  registerLineField: (
    lineId: string,
    field: LineFieldName,
    element: HTMLInputElement | null,
  ) => void;
  submitAttempted: boolean;
  totals: ComposerTotals;
}) {
  const canRemove = lines.length > 1;
  const filledCount = lines.filter((line) => line.description.trim()).length;
  const [tableRequested, setTableRequested] = useState(false);
  const descriptionRefs = useRef(new Map<string, HTMLInputElement[]>());
  const focusLastRef = useRef(false);

  // Une seule ligne encore vierge : on montre l'état vide plutôt qu'un tableau creux.
  const pristine =
    lines.length === 1 &&
    !lines[0].description.trim() &&
    (parseNumber(lines[0].unitPrice) === 0 || !lines[0].unitPrice.trim());
  const showEmpty = pristine && !tableRequested && !isImporting;
  const linesError = submitAttempted ? fieldErrors.linesGlobal : undefined;

  /** Champ « Désignation » visible d'une ligne (tableau ou carte, selon la largeur). */
  function visibleDescription(lineId: string | undefined): HTMLInputElement | undefined {
    if (!lineId) return undefined;
    return descriptionRefs.current
      .get(lineId)
      ?.find((node) => node.isConnected && node.offsetParent !== null);
  }

  useEffect(() => {
    if (!focusLastRef.current) return;
    focusLastRef.current = false;
    visibleDescription(lines[lines.length - 1]?.id)?.focus();
  }, [lines]);

  function addAndFocus() {
    focusLastRef.current = true;
    onAddLine();
  }

  function startFromEmpty() {
    setTableRequested(true);
    // Pas de nouvelle ligne : la ligne vierge existante reçoit le focus une fois affichée.
    const lineId = lines[0]?.id;
    requestAnimationFrame(() => visibleDescription(lineId)?.focus());
  }

  /** Entrée : ligne suivante, ou nouvelle ligne depuis la dernière. */
  function handleEnter(event: React.KeyboardEvent<HTMLElement>, index: number) {
    if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) return;
    event.preventDefault();
    if (index >= lines.length - 1) {
      addAndFocus();
      return;
    }
    visibleDescription(lines[index + 1].id)?.focus();
  }

  function registerDescription(lineId: string, element: HTMLInputElement | null) {
    registerLineField(lineId, 'description', element);
    const kept = (descriptionRefs.current.get(lineId) ?? []).filter(
      (node) => node.isConnected && node !== element,
    );
    if (element) kept.push(element);
    descriptionRefs.current.set(lineId, kept);
  }

  return (
    <section
      className={cn(IQ_PANEL, '@container/lines scroll-mt-24 overflow-hidden')}
      ref={containerRef}>
      <div className="flex flex-wrap items-center gap-2.5 px-5 pb-3.5 pt-[18px]">
        <h2 className="text-[15px] font-bold">Lignes</h2>
        <span className="flex h-[22px] min-w-[22px] items-center justify-center rounded-full bg-iq-soft px-[7px] text-[12px] font-bold text-iq-ink2">
          {filledCount}
        </span>
        <div className="flex-1" />
        <div className="flex flex-wrap gap-2">
          <button className={IQ_BUTTON} onClick={onOpenCatalog} type="button">
            <svg aria-hidden fill="none" height="15" stroke="currentColor" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="15">
              <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5zM13 4h5.5A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5H13z" />
            </svg>
            Catalogue
          </button>
          <button
            className={IQ_BUTTON}
            disabled={isImporting}
            onClick={onImportSpreadsheet}
            type="button">
            <svg aria-hidden fill="none" height="15" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="15">
              <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
              <path d="M14 3v5h5M9 13h6M9 17h6" />
            </svg>
            Excel / CSV
          </button>
          <button
            className={IQ_BUTTON}
            disabled={isImporting}
            onClick={onImportPhoto}
            title="Ou collez une capture avec Ctrl + V"
            type="button">
            <svg aria-hidden fill="none" height="15" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="15">
              <path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            Lire une photo
          </button>
        </div>
      </div>

      {importFeedback && !isImporting ? (
        <p className="border-t border-iq-line2 px-5 py-2.5 text-[12.5px] text-iq-ink2" role="status">
          {importFeedback}
        </p>
      ) : null}

      {linesError && !showEmpty ? (
        <p className="border-t border-iq-line2 px-5 py-2.5 text-[12.5px] font-semibold text-iq-danger" role="alert">
          {linesError}
        </p>
      ) : null}

      {showEmpty ? (
        <div className="border-t border-iq-line2 p-5">
          <div
            className={cn(
              'rounded-[14px] border-[1.5px] border-dashed px-6 py-[34px] text-center',
              linesError ? 'border-iq-danger' : 'border-iq-line',
            )}>
            <p className="text-[16px] font-bold">Aucune ligne pour l’instant</p>
            <p className="mx-auto mt-1.5 max-w-[440px] text-[13.5px] leading-[1.55] text-iq-ink3 [text-wrap:pretty]">
              Ajoutez une ligne, choisissez dans le catalogue, importez un fichier, ou déposez une
              photo de devis. Une capture se colle avec Ctrl + V.
            </p>
            <div className="mt-[18px] flex flex-wrap justify-center gap-2">
              <button className={IQ_PRIMARY} onClick={startFromEmpty} type="button">
                <PlusIcon />
                Ajouter une ligne
              </button>
              <button className={cn(IQ_BUTTON, 'h-[38px] px-3.5 text-[13.5px]')} onClick={onOpenCatalog} type="button">
                Depuis le catalogue
              </button>
            </div>
            {linesError ? (
              <p className="mt-3.5 text-[12.5px] font-semibold text-iq-danger" role="alert">
                {linesError}
              </p>
            ) : null}
          </div>
        </div>
      ) : (
        <>
          {/* Tableau : conteneur assez large. */}
          <div className="hidden @min-[720px]/lines:block">
            <div
              className={cn(
                GRID,
                'border-t border-iq-line2 py-2 text-[12px] font-semibold text-iq-ink3',
              )}
              role="presentation">
              <div className="pl-2">Désignation</div>
              <div className="pr-2 text-right">Qté</div>
              <div className="pl-2">Unité</div>
              <div className="pr-2 text-right">Prix HT</div>
              <div className="pl-2">TVA</div>
              <div className="pr-2 text-right">Remise</div>
              <div className="text-right">Total HT</div>
              <div />
            </div>
            {lines.map((line, index) => {
              const rowErrors = submitAttempted ? fieldErrors.lineErrors?.[line.id] : undefined;
              return (
                <div
                  className={cn(
                    GRID,
                    'items-start border-t border-iq-line2 py-2 transition-colors duration-150 focus-within:bg-iq-accent-soft',
                  )}
                  key={line.id}>
                  <div className="min-w-0">
                    <input
                      aria-invalid={Boolean(rowErrors?.description)}
                      aria-label={`Désignation de la ligne ${index + 1}`}
                      className={cn(
                        IQ_CELL,
                        'font-semibold',
                        rowErrors?.description && 'shadow-[0_0_0_1.5px_var(--iq-danger)]',
                      )}
                      onChange={(event) => onUpdateLine(line.id, { description: event.target.value })}
                      onKeyDown={(event) => handleEnter(event, index)}
                      placeholder="Désignation"
                      ref={(element) => registerDescription(line.id, element)}
                      value={line.description}
                    />
                    {line.productId ? (
                      <p className="px-2 pt-0.5 text-[12.5px] text-iq-ink3">Depuis le catalogue</p>
                    ) : null}
                    {rowErrors?.description ? (
                      <p className="px-2 pt-0.5 text-[12px] font-semibold text-iq-danger">{rowErrors.description}</p>
                    ) : null}
                    {rowErrors?.quantity ? (
                      <p className="px-2 pt-0.5 text-[12px] font-semibold text-iq-danger">{rowErrors.quantity}</p>
                    ) : null}
                    {rowErrors?.unitPrice ? (
                      <p className="px-2 pt-0.5 text-[12px] font-semibold text-iq-danger">{rowErrors.unitPrice}</p>
                    ) : null}
                  </div>
                  <input
                    aria-invalid={Boolean(rowErrors?.quantity)}
                    aria-label="Quantité"
                    className={cn(
                      IQ_CELL,
                      'text-right',
                      rowErrors?.quantity && 'bg-iq-danger-soft shadow-[0_0_0_1.5px_var(--iq-danger)]',
                    )}
                    inputMode="decimal"
                    onChange={(event) => onUpdateLine(line.id, { quantity: event.target.value })}
                    onKeyDown={(event) => handleEnter(event, index)}
                    ref={(element) => registerLineField(line.id, 'quantity', element)}
                    value={line.quantity}
                  />
                  <CompactSelect
                    ariaLabel="Unité"
                    onChange={(unit) => onUpdateLine(line.id, { unit })}
                    onKeyDown={(event) => handleEnter(event, index)}
                    options={unitOptions(line.unit).map((unit) => ({ value: unit, label: unit }))}
                    value={line.unit.trim() || 'unité'}
                  />
                  <input
                    aria-invalid={Boolean(rowErrors?.unitPrice)}
                    aria-label="Prix unitaire HT"
                    className={cn(
                      IQ_CELL,
                      'text-right',
                      rowErrors?.unitPrice && 'bg-iq-danger-soft shadow-[0_0_0_1.5px_var(--iq-danger)]',
                    )}
                    inputMode="decimal"
                    onChange={(event) => onUpdateLine(line.id, { unitPrice: event.target.value })}
                    onKeyDown={(event) => handleEnter(event, index)}
                    placeholder="0,00"
                    ref={(element) => registerLineField(line.id, 'unitPrice', element)}
                    value={line.unitPrice}
                  />
                  <CompactSelect
                    ariaLabel="Taux de TVA"
                    className="[&_select]:px-1.5 [&_select]:pr-4 [&_select]:text-[13.5px]"
                    onChange={(vatRate) => onUpdateLine(line.id, { vatRate })}
                    onKeyDown={(event) => handleEnter(event, index)}
                    options={vatOptions(line.vatRate)}
                    value={line.vatRate}
                  />
                  <div className="relative min-w-0">
                    <input
                      aria-label="Remise en %"
                      className={cn(
                        IQ_CELL,
                        'text-right text-iq-ink2',
                        discountDisplay(line.discountPercent) && 'pr-[22px]',
                      )}
                      inputMode="decimal"
                      onChange={(event) =>
                        onUpdateLine(line.id, {
                          discountPercent: event.target.value.replace(/\s*%/g, '') || '0',
                        })
                      }
                      onKeyDown={(event) => handleEnter(event, index)}
                      placeholder="—"
                      value={discountDisplay(line.discountPercent)}
                    />
                    {discountDisplay(line.discountPercent) ? (
                      <span
                        aria-hidden
                        className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[14px] text-iq-ink2">
                        %
                      </span>
                    ) : null}
                  </div>
                  <div className="flex h-[34px] items-center justify-end whitespace-nowrap text-[14px] font-bold">
                    {formatCurrency(totals.perLineHt[line.id] ?? 0)}
                  </div>
                  <button
                    aria-label={`Supprimer la ligne ${index + 1}`}
                    className="flex h-[34px] w-6 items-center justify-center rounded-[6px] text-iq-ink3 opacity-55 transition-[opacity,color] duration-150 hover:text-iq-danger hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-iq-accent disabled:pointer-events-none disabled:opacity-20"
                    disabled={!canRemove}
                    onClick={() => onRemoveLine(line.id)}
                    title="Supprimer la ligne"
                    type="button">
                    <TrashIcon />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Cartes : écran ou colonne étroite. */}
          <div className="space-y-2.5 border-t border-iq-line2 p-3.5 @min-[720px]/lines:hidden">
            {lines.map((line, index) => {
              const rowErrors = submitAttempted ? fieldErrors.lineErrors?.[line.id] : undefined;
              return (
                <article
                  className="rounded-[14px] border border-iq-line bg-iq-surface p-3 focus-within:border-iq-accent"
                  key={line.id}>
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <p className="text-[12px] font-semibold text-iq-ink3">Ligne {index + 1}</p>
                    <button
                      aria-label={`Supprimer la ligne ${index + 1}`}
                      className="flex size-9 items-center justify-center rounded-[8px] text-iq-ink3 transition-colors duration-150 hover:bg-iq-danger-soft hover:text-iq-danger disabled:opacity-30"
                      disabled={!canRemove}
                      onClick={() => onRemoveLine(line.id)}
                      type="button">
                      <TrashIcon />
                    </button>
                  </div>
                  <input
                    aria-invalid={Boolean(rowErrors?.description)}
                    aria-label={`Désignation de la ligne ${index + 1}`}
                    className={cn(
                      IQ_CELL,
                      'h-11 bg-iq-soft text-[16px] font-semibold sm:text-[14px]',
                      rowErrors?.description && 'shadow-[0_0_0_1.5px_var(--iq-danger)]',
                    )}
                    onChange={(event) => onUpdateLine(line.id, { description: event.target.value })}
                    placeholder="Désignation"
                    ref={(element) => registerDescription(line.id, element)}
                    value={line.description}
                  />
                  <div className="mt-2 grid grid-cols-2 gap-2 min-[420px]:grid-cols-3">
                    <MobileField label="Quantité" error={rowErrors?.quantity}>
                      <input
                        aria-invalid={Boolean(rowErrors?.quantity)}
                        className={cn(IQ_CELL, 'h-11 bg-iq-soft text-[16px] sm:text-[14px]')}
                        inputMode="decimal"
                        onChange={(event) => onUpdateLine(line.id, { quantity: event.target.value })}
                        ref={(element) => registerLineField(line.id, 'quantity', element)}
                        value={line.quantity}
                      />
                    </MobileField>
                    <MobileField label="Unité">
                      <CompactSelect
                        ariaLabel="Unité"
                        className="[&_select]:h-11 [&_select]:bg-iq-soft [&_select]:text-[16px] sm:[&_select]:text-[14px]"
                        onChange={(unit) => onUpdateLine(line.id, { unit })}
                        options={unitOptions(line.unit).map((unit) => ({ value: unit, label: unit }))}
                        value={line.unit.trim() || 'unité'}
                      />
                    </MobileField>
                    <MobileField label="Prix HT (€)" error={rowErrors?.unitPrice}>
                      <input
                        aria-invalid={Boolean(rowErrors?.unitPrice)}
                        className={cn(IQ_CELL, 'h-11 bg-iq-soft text-[16px] sm:text-[14px]')}
                        inputMode="decimal"
                        onChange={(event) => onUpdateLine(line.id, { unitPrice: event.target.value })}
                        ref={(element) => registerLineField(line.id, 'unitPrice', element)}
                        value={line.unitPrice}
                      />
                    </MobileField>
                    <MobileField label="TVA">
                      <CompactSelect
                        ariaLabel="Taux de TVA"
                        className="[&_select]:h-11 [&_select]:bg-iq-soft [&_select]:text-[16px] sm:[&_select]:text-[14px]"
                        onChange={(vatRate) => onUpdateLine(line.id, { vatRate })}
                        options={vatOptions(line.vatRate)}
                        value={line.vatRate}
                      />
                    </MobileField>
                    <MobileField label="Remise (%)">
                      <input
                        className={cn(IQ_CELL, 'h-11 bg-iq-soft text-[16px] sm:text-[14px]')}
                        inputMode="decimal"
                        onChange={(event) =>
                          onUpdateLine(line.id, {
                            discountPercent: event.target.value.replace(/\s*%/g, '') || '0',
                          })
                        }
                        placeholder="Aucune"
                        value={discountDisplay(line.discountPercent)}
                      />
                    </MobileField>
                    <div className="flex flex-col justify-end">
                      <span className="text-[11.5px] text-iq-ink3">Total HT</span>
                      <span className="flex h-11 items-center text-[15px] font-bold">
                        {formatCurrency(totals.perLineHt[line.id] ?? 0)}
                      </span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </>
      )}

      {isImporting ? (
        <div className="border-t border-iq-line2 px-5 pb-1.5 pt-4" role="status">
          <div className="flex items-center gap-3 rounded-[12px] bg-iq-accent-soft px-3.5 py-3">
            <svg aria-hidden className="shrink-0" fill="none" height="18" stroke="var(--iq-accent)" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="18">
              <path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z" />
            </svg>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13.5px] font-bold text-iq-accent-ink">
                {importLabel ? `Lecture de « ${importLabel} »` : 'Lecture en cours'}
              </p>
              <p className="mt-0.5 text-[12.5px] text-iq-ink2">
                Analyse des lignes, vérification des prix et de la TVA…
              </p>
            </div>
            <div className="hidden h-[5px] w-[140px] shrink-0 overflow-hidden rounded-full bg-iq-surface sm:block">
              <div className="h-full w-2/5 rounded-full bg-iq-accent [animation:iq-bar_1.3s_ease-in-out_infinite]" />
            </div>
          </div>
          {[62, 44, 70].map((width) => (
            <div className="flex items-center gap-4 px-2 py-3.5" key={width}>
              <div className="min-w-0 flex-1">
                <div className="h-[11px] rounded-[6px] bg-iq-soft" style={{ width: `${width}%` }} />
                <div className="mt-2 h-2 w-[38%] rounded-[6px] bg-iq-line2" />
              </div>
              <div className="hidden flex-[1.4] gap-2 @min-[720px]/lines:flex">
                {[1, 2, 3, 4, 5, 6].map((cell) => (
                  <div className="h-[11px] flex-1 rounded-[6px] bg-iq-soft" key={cell} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {!showEmpty ? (
        <div className="flex flex-wrap items-center gap-4 border-t border-iq-line2 px-5 pb-3 pt-2.5">
          <button
            className="flex h-[34px] items-center gap-[7px] rounded-[8px] px-2 text-[13.5px] font-bold text-iq-accent transition-colors duration-150 hover:bg-iq-accent-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-iq-accent"
            onClick={addAndFocus}
            type="button">
            <PlusIcon />
            Ajouter une ligne
          </button>
          <div className="flex-1" />
          <div className="hidden flex-wrap items-center gap-3.5 text-[12px] text-iq-ink3 @min-[720px]/lines:flex">
            <span className="flex items-center gap-[5px]">
              <Kbd>Tab</Kbd>champ suivant
            </span>
            <span className="flex items-center gap-[5px]">
              <Kbd>Entrée</Kbd>nouvelle ligne
            </span>
            <span className="flex items-center gap-[5px]">
              <Kbd>Ctrl V</Kbd>coller une capture
            </span>
          </div>
        </div>
      ) : null}

      <div className="flex justify-end border-t border-iq-line bg-iq-soft px-6 pb-[22px] pt-[18px]">
        <dl className="flex w-full flex-col gap-2 text-[13.5px] @min-[520px]/lines:w-[330px]">
          <div className="flex justify-between gap-4">
            <dt className="text-iq-ink3">Total HT</dt>
            <dd className="font-semibold">{formatCurrency(totals.subtotal)}</dd>
          </div>
          {totals.discount > 0 ? (
            <div className="flex justify-between gap-4">
              <dt className="text-iq-ink3">dont remises</dt>
              <dd className="text-iq-ink2">− {formatCurrency(totals.discount)}</dd>
            </div>
          ) : null}
          {totals.vatGroups.map((group) => (
            <div className="flex justify-between gap-4" key={group.rate}>
              <dt className="text-iq-ink3">
                TVA {vatRateLabel(group.rate)}{' '}
                <span className="opacity-80">sur {formatCurrency(group.base)}</span>
              </dt>
              <dd className="font-semibold">{formatCurrency(group.amount)}</dd>
            </div>
          ))}
          <div className="mt-1 flex items-baseline justify-between gap-4 border-t border-iq-line pt-3">
            <dt className="text-[14px] font-bold">Total TTC</dt>
            <dd className="text-[24px] font-extrabold tracking-[-0.6px]">
              {formatCurrency(totals.total)}
            </dd>
          </div>
        </dl>
      </div>
    </section>
  );
}

function MobileField({
  children,
  error,
  label,
}: {
  children: React.ReactNode;
  error?: string;
  label: string;
}) {
  return (
    <label className="block min-w-0">
      <span className="text-[11.5px] text-iq-ink3">{label}</span>
      {children}
      {error ? <span className="mt-0.5 block text-[12px] font-semibold text-iq-danger">{error}</span> : null}
    </label>
  );
}
