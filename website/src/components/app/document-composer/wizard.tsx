'use client';

import { IQ_PANEL, IQ_PRIMARY, vatRateLabel } from '@/components/app/document-composer/ui';
import { formatCurrency } from '@/lib/domain/format/currency';
import { cn } from '@/lib/utils';

export const COMPOSER_WIZARD_STEPS = ['Client et conditions', 'Lignes', 'Modèle et récapitulatif'] as const;

export function ComposerWizardProgress({ step }: { step: number }) {
  return (
    <div className="flex gap-1 px-3.5 pb-2.5">
      {COMPOSER_WIZARD_STEPS.map((label, index) => (
        <span
          aria-hidden
          className={cn(
            'h-1 flex-1 rounded-full transition-colors duration-200',
            index <= step ? 'bg-iq-accent' : 'bg-iq-line',
          )}
          key={label}
        />
      ))}
    </div>
  );
}

/**
 * Assistant en 3 étapes (écran étroit) : contenu défilant et barre inférieure
 * fixe avec le Total TTC et l'action principale toujours visibles.
 */
export function ComposerWizardShell({
  children,
  lineCount,
  onBack,
  onPrimary,
  primaryDisabled,
  primaryLabel,
  total,
  vat,
}: {
  children: React.ReactNode;
  lineCount: number;
  onBack?: () => void;
  onPrimary: () => void;
  primaryDisabled?: boolean;
  primaryLabel: string;
  total: number;
  vat: number;
}) {
  return (
    <>
      {/* Le retrait haut reste dans le contenu pour ne pas décaler les éléments collants. */}
      <div className="min-h-0 flex-1 overflow-y-auto bg-iq-bg px-3.5 pb-4">
        <div className="flex flex-col gap-3 pt-3">{children}</div>
      </div>

      <div className="shrink-0 border-t border-iq-line bg-iq-surface/90 px-3.5 pb-[calc(12px+env(safe-area-inset-bottom))] pt-3 backdrop-blur">
        <div className="mb-2.5 flex items-end justify-between gap-3">
          <div>
            <p className="text-[12px] text-iq-ink3">Total TTC</p>
            <p className="text-[24px] font-extrabold leading-tight tracking-[-0.6px]">
              {formatCurrency(total)}
            </p>
          </div>
          <p className="pb-1 text-right text-[12.5px] text-iq-ink3">
            {lineCount} ligne{lineCount > 1 ? 's' : ''} · TVA {formatCurrency(vat)}
          </p>
        </div>
        <div className="flex gap-2">
          {onBack ? (
            <button
              aria-label="Étape précédente"
              className="flex size-[54px] shrink-0 items-center justify-center rounded-[15px] bg-iq-soft text-iq-ink2"
              onClick={onBack}
              type="button">
              <svg aria-hidden fill="none" height="18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.4" viewBox="0 0 24 24" width="18">
                <path d="M15 6l-6 6 6 6" />
              </svg>
            </button>
          ) : null}
          <button
            className={cn(IQ_PRIMARY, 'h-[54px] flex-1 rounded-[15px] text-[15px]')}
            disabled={primaryDisabled}
            onClick={onPrimary}
            type="button">
            {primaryLabel}
          </button>
        </div>
      </div>
    </>
  );
}

export function ComposerRecapCard({
  clientName,
  dueLabel,
  issuedAtLabel,
  kind,
  lineCount,
  totals,
}: {
  clientName: string | null;
  dueLabel: string;
  issuedAtLabel: string;
  kind: 'invoice' | 'quote';
  lineCount: number;
  totals: {
    subtotal: number;
    total: number;
    vat: number;
    vatGroups: { rate: number; base: number; amount: number }[];
  };
}) {
  return (
    <section className={cn(IQ_PANEL, 'px-5 py-4')}>
      <h2 className="mb-1 text-[15px] font-bold">Récapitulatif</h2>
      <dl className="divide-y divide-iq-line2">
        <RecapRow label="Client" muted={!clientName} value={clientName ?? 'À sélectionner'} />
        <RecapRow
          label="Date d’émission"
          muted={!issuedAtLabel}
          value={issuedAtLabel || 'Date invalide'}
        />
        <RecapRow
          label={kind === 'invoice' ? 'Échéance' : 'Valable jusqu’au'}
          muted={kind === 'quote' || !dueLabel}
          value={dueLabel || '—'}
        />
        <RecapRow label="Lignes remplies" value={String(lineCount)} />
        <RecapRow label="Total HT" value={formatCurrency(totals.subtotal)} />
        {totals.vatGroups.map((group) => (
          <RecapRow
            key={group.rate}
            label={`TVA ${vatRateLabel(group.rate)}`}
            value={formatCurrency(group.amount)}
          />
        ))}
      </dl>
      <div className="mt-2 flex items-baseline justify-between border-t border-iq-line pt-3">
        <span className="text-[14px] font-bold">Total TTC</span>
        <span className="text-[22px] font-extrabold tracking-[-0.5px]">
          {formatCurrency(totals.total)}
        </span>
      </div>
    </section>
  );
}

function RecapRow({ label, muted, value }: { label: string; muted?: boolean; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <dt className="text-[13px] text-iq-ink3">{label}</dt>
      <dd
        className={cn(
          'min-w-0 truncate text-[13.5px] font-semibold',
          muted ? 'text-iq-ink3' : 'text-iq-ink',
        )}>
        {value}
      </dd>
    </div>
  );
}
