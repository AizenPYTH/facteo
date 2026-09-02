'use client';

import { FileSpreadsheet, Library, Plus, Sparkles, Trash2, Upload } from 'lucide-react';

import { InlineFieldError } from '@/components/app/document-composer/field-errors';
import type { FieldErrors, LineValue } from '@/components/app/document-composer/validation';
import { TextInput } from '@/components/app/form-fields';
import { formatCurrency } from '@/lib/domain/format/currency';
import { cn } from '@/lib/utils';

export type LineFieldName = 'description' | 'quantity' | 'unitPrice';

const HEAD_CELL =
  'sticky top-0 z-10 border-b border-app-border bg-app-subtle px-2 py-2 text-[10.5px] font-bold uppercase tracking-[0.07em] text-app-muted-2';

const TOOLBAR_BUTTON =
  'inline-flex items-center gap-1.5 rounded-app-field border px-2.5 py-[7px] text-[12.5px] font-semibold transition-[background-color,border-color,color] duration-150';

export function ComposerLinesCard({
  containerRef,
  fieldErrors,
  importFeedback,
  isImporting,
  lineTotals,
  lines,
  onAddLine,
  onOpenCatalog,
  onOpenImport,
  onRemoveLine,
  onUpdateLine,
  registerLineField,
  submitAttempted,
  totals,
}: {
  containerRef?: React.Ref<HTMLElement>;
  fieldErrors: FieldErrors;
  importFeedback?: string | null;
  isImporting?: boolean;
  lineTotals: Record<string, number>;
  lines: LineValue[];
  onAddLine: () => void;
  onOpenCatalog: () => void;
  onOpenImport: () => void;
  onRemoveLine: (id: string) => void;
  onUpdateLine: (id: string, patch: Partial<LineValue>) => void;
  registerLineField: (
    lineId: string,
    field: LineFieldName,
    element: HTMLInputElement | null,
  ) => void;
  submitAttempted: boolean;
  totals: { subtotal: number; total: number; vat: number };
}) {
  const canRemove = lines.length > 1;

  return (
    <section
      className="@container rounded-app-card border border-app-border bg-app-surface"
      ref={containerRef}>
      <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-app-border-soft px-4 py-[13px]">
        <h2 className="text-[13.5px] font-semibold tracking-[-0.01em] text-app-text">
          Lignes du document
        </h2>
        <div className="flex flex-wrap gap-1.5">
          <button
            className={cn(
              TOOLBAR_BUTTON,
              'border-app-border bg-app-surface text-app-text-2 hover:bg-app-hover',
            )}
            onClick={onAddLine}
            type="button">
            <Plus size={14} strokeWidth={2} />
            Ligne libre
          </button>
          <button
            className={cn(
              TOOLBAR_BUTTON,
              'border-app-accent-border bg-app-accent-tint text-app-accent-strong hover:bg-app-accent-soft',
            )}
            onClick={onOpenCatalog}
            type="button">
            <Library size={14} strokeWidth={1.9} />
            Catalogue
          </button>
          <button
            className={cn(
              TOOLBAR_BUTTON,
              'border-app-accent-violet-border bg-app-accent-violet-tint text-app-accent-violet hover:bg-app-accent-violet-tint/70',
            )}
            onClick={onOpenImport}
            type="button">
            <Sparkles size={14} strokeWidth={1.9} />
            Import IA · CSV
          </button>
        </div>
      </div>

      {importFeedback ? (
        <p className="flex items-center gap-2 border-b border-app-border-soft bg-app-subtle px-4 py-2 text-[12px] text-app-muted">
          <Upload className="shrink-0 text-app-faint" size={14} strokeWidth={1.75} />
          {importFeedback}
        </p>
      ) : null}
      {isImporting ? (
        <p className="flex items-center gap-2 border-b border-app-border-soft bg-app-accent-tint px-4 py-2 text-[12px] font-semibold text-app-accent-strong">
          <FileSpreadsheet className="shrink-0" size={14} strokeWidth={1.75} />
          Analyse IA / import en cours…
        </p>
      ) : null}

      {submitAttempted && fieldErrors.linesGlobal ? (
        <div className="px-4 pt-3">
          <InlineFieldError className="mt-0" message={fieldErrors.linesGlobal} />
        </div>
      ) : null}

      <div className="hidden @min-[620px]:block">
        <table className="w-full table-fixed border-collapse text-left text-[13px]">
          <thead>
            <tr>
              <th className={cn(HEAD_CELL, 'pl-4')}>Description</th>
              <th className={cn(HEAD_CELL, 'w-[52px]')}>Qté</th>
              <th className={cn(HEAD_CELL, 'w-[64px]')}>Unité</th>
              <th className={cn(HEAD_CELL, 'w-[82px]')}>Prix HT</th>
              <th className={cn(HEAD_CELL, 'w-[56px]')}>TVA</th>
              <th className={cn(HEAD_CELL, 'w-[92px] text-right')}>Total TTC</th>
              <th className={cn(HEAD_CELL, 'w-[44px] pr-4')} />
            </tr>
          </thead>
          <tbody>
            {lines.map((line) => {
              const rowErrors = fieldErrors.lineErrors?.[line.id];

              return (
                <tr className="border-b border-app-border-soft align-top" key={line.id}>
                  <td className="px-2 py-2 pl-4">
                    <TextInput
                      aria-invalid={submitAttempted && Boolean(rowErrors?.description)}
                      className="px-2.5 py-[7px]"
                      onChange={(event) =>
                        onUpdateLine(line.id, { description: event.target.value })
                      }
                      placeholder="Description"
                      ref={(element) => registerLineField(line.id, 'description', element)}
                      value={line.description}
                    />
                    {line.productId ? (
                      <span className="mt-1.5 inline-block rounded-[5px] bg-app-accent-tint px-1.5 py-px text-[10.5px] font-bold text-app-accent">
                        Catalogue
                      </span>
                    ) : null}
                    <InlineFieldError
                      message={submitAttempted ? rowErrors?.description : undefined}
                    />
                  </td>
                  <td className="px-2 py-2">
                    <TextInput
                      aria-invalid={submitAttempted && Boolean(rowErrors?.quantity)}
                      aria-label="Quantité"
                      className="app-num px-2 py-[7px] text-right"
                      onChange={(event) => onUpdateLine(line.id, { quantity: event.target.value })}
                      ref={(element) => registerLineField(line.id, 'quantity', element)}
                      value={line.quantity}
                    />
                  </td>
                  <td className="px-2 py-2">
                    <TextInput
                      aria-label="Unité"
                      className="px-2 py-[7px]"
                      onChange={(event) => onUpdateLine(line.id, { unit: event.target.value })}
                      value={line.unit}
                    />
                  </td>
                  <td className="px-2 py-2">
                    <TextInput
                      aria-invalid={submitAttempted && Boolean(rowErrors?.unitPrice)}
                      aria-label="Prix HT"
                      className="app-num px-2 py-[7px] text-right"
                      onChange={(event) => onUpdateLine(line.id, { unitPrice: event.target.value })}
                      ref={(element) => registerLineField(line.id, 'unitPrice', element)}
                      value={line.unitPrice}
                    />
                  </td>
                  <td className="px-2 py-2">
                    <TextInput
                      aria-label="Taux de TVA"
                      className="app-num px-2 py-[7px] text-right"
                      onChange={(event) => onUpdateLine(line.id, { vatRate: event.target.value })}
                      value={line.vatRate}
                    />
                  </td>
                  <td className="app-num px-2 py-2 text-right text-[13px] font-semibold text-app-text">
                    {formatCurrency(lineTotals[line.id] ?? 0)}
                  </td>
                  <td className="px-2 py-2 pr-4 text-right">
                    <button
                      aria-label="Supprimer la ligne"
                      className="inline-flex h-[26px] w-[26px] items-center justify-center rounded-[7px] text-app-faint transition-[background-color,color] duration-150 hover:bg-app-danger-tint hover:text-app-danger disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-app-faint"
                      disabled={!canRemove}
                      onClick={() => onRemoveLine(line.id)}
                      type="button">
                      <Trash2 size={14} strokeWidth={1.9} />
                    </button>
                  </td>
                </tr>
              );
            })}
            <tr>
              <td colSpan={7} className="px-4 py-2.5">
                <AddLineButton onClick={onAddLine} />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="space-y-2.5 p-3 @min-[620px]:hidden">
        {lines.map((line, index) => {
          const rowErrors = fieldErrors.lineErrors?.[line.id];

          return (
            <article
              className="rounded-app-modal border border-app-border bg-app-surface p-3"
              key={line.id}>
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-app-faint">
                  Ligne {index + 1}
                </p>
                <button
                  aria-label="Supprimer la ligne"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-[7px] text-app-faint transition-[background-color,color] duration-150 hover:bg-app-danger-tint hover:text-app-danger disabled:opacity-40"
                  disabled={!canRemove}
                  onClick={() => onRemoveLine(line.id)}
                  type="button">
                  <Trash2 size={15} strokeWidth={1.9} />
                </button>
              </div>

              <div className="space-y-2.5">
                <div>
                  <TextInput
                    aria-invalid={submitAttempted && Boolean(rowErrors?.description)}
                    aria-label="Description"
                    onChange={(event) => onUpdateLine(line.id, { description: event.target.value })}
                    placeholder="Description"
                    ref={(element) => registerLineField(line.id, 'description', element)}
                    value={line.description}
                  />
                  {line.productId ? (
                    <span className="mt-1.5 inline-block rounded-[5px] bg-app-accent-tint px-1.5 py-px text-[10.5px] font-bold text-app-accent">
                      Catalogue
                    </span>
                  ) : null}
                  <InlineFieldError message={submitAttempted ? rowErrors?.description : undefined} />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <TextInput
                      aria-invalid={submitAttempted && Boolean(rowErrors?.quantity)}
                      aria-label="Quantité"
                      className="app-num"
                      onChange={(event) => onUpdateLine(line.id, { quantity: event.target.value })}
                      placeholder="Qté"
                      ref={(element) => registerLineField(line.id, 'quantity', element)}
                      value={line.quantity}
                    />
                    <InlineFieldError message={submitAttempted ? rowErrors?.quantity : undefined} />
                  </div>
                  <TextInput
                    aria-label="Unité"
                    onChange={(event) => onUpdateLine(line.id, { unit: event.target.value })}
                    placeholder="Unité"
                    value={line.unit}
                  />
                  <div>
                    <TextInput
                      aria-invalid={submitAttempted && Boolean(rowErrors?.unitPrice)}
                      aria-label="Prix HT"
                      className="app-num"
                      onChange={(event) => onUpdateLine(line.id, { unitPrice: event.target.value })}
                      placeholder="Prix HT"
                      ref={(element) => registerLineField(line.id, 'unitPrice', element)}
                      value={line.unitPrice}
                    />
                    <InlineFieldError message={submitAttempted ? rowErrors?.unitPrice : undefined} />
                  </div>
                  <TextInput
                    aria-label="Taux de TVA"
                    className="app-num"
                    onChange={(event) => onUpdateLine(line.id, { vatRate: event.target.value })}
                    placeholder="TVA %"
                    value={line.vatRate}
                  />
                </div>

                <div className="flex items-center justify-between rounded-app-field bg-app-subtle px-3 py-2">
                  <span className="text-[11.5px] text-app-muted">Total TTC</span>
                  <span className="app-num text-[13px] font-semibold text-app-text">
                    {formatCurrency(lineTotals[line.id] ?? 0)}
                  </span>
                </div>
              </div>
            </article>
          );
        })}

        <AddLineButton onClick={onAddLine} />
      </div>

      <div className="sticky bottom-0 flex justify-end rounded-b-app-card border-t border-app-border-soft bg-app-subtle px-4 py-3.5">
        <dl className="w-full @min-[620px]:max-w-[280px]">
          <div className="flex items-center justify-between py-[5px] text-[13px] text-app-muted">
            <dt>Total HT</dt>
            <dd className="app-num font-semibold text-app-text">
              {formatCurrency(totals.subtotal)}
            </dd>
          </div>
          <div className="flex items-center justify-between py-[5px] text-[13px] text-app-muted">
            <dt>TVA</dt>
            <dd className="app-num font-semibold text-app-text">{formatCurrency(totals.vat)}</dd>
          </div>
          <div className="mt-1.5 flex items-center justify-between border-t border-app-border pt-2.5 text-[15px] font-semibold text-app-text">
            <dt>Total TTC</dt>
            <dd className="app-num text-app-accent">{formatCurrency(totals.total)}</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}

function AddLineButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      className="flex w-full items-center justify-center gap-1.5 rounded-app-field border border-dashed border-app-border-dashed bg-app-subtle px-3 py-2.5 text-[12.5px] font-semibold text-app-accent transition-[background-color,border-color,color] duration-150 hover:border-app-accent hover:bg-app-accent-soft"
      onClick={onClick}
      type="button">
      <Plus size={14} strokeWidth={2} />
      Ajouter une ligne
    </button>
  );
}
