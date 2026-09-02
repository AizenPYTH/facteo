'use client';

import { ComposerCard } from '@/components/app/document-composer/composer-card';
import { PrimaryButton } from '@/components/app/form-fields';
import { formatCurrency } from '@/lib/domain/format/currency';
import { addDaysFrenchDateInput, todayFrenchDateInput } from '@/lib/domain/format/date-input';
import { cn } from '@/lib/utils';

export const COMPOSER_WIZARD_STEPS = ['Client', 'Lignes', 'Récapitulatif'] as const;

export function ComposerWizardProgress({ step }: { step: number }) {
  return (
    <div className="flex gap-1 border-t border-app-border-soft px-3.5 py-2.5">
      {COMPOSER_WIZARD_STEPS.map((label, index) => (
        <span
          aria-hidden
          className={cn(
            'h-1 flex-1 rounded-full',
            index <= step ? 'bg-app-accent' : 'bg-app-border',
          )}
          key={label}
        />
      ))}
    </div>
  );
}

export function ComposerWizardShell({
  children,
  onPrimary,
  primaryDisabled,
  primaryLabel,
  total,
}: {
  children: React.ReactNode;
  onPrimary: () => void;
  primaryDisabled?: boolean;
  primaryLabel: string;
  total: number;
}) {
  return (
    <>
      {/* Idem composer : le retrait haut reste dans le contenu pour ne pas décaler l’en-tête collant. */}
      <div className="sb min-h-0 flex-1 overflow-y-auto bg-app-canvas px-3.5 pb-3">
        <div className="flex flex-col gap-2.5 pt-3">{children}</div>
      </div>

      <div className="shrink-0 border-t border-app-border bg-app-surface px-3.5 py-3">
        <div className="mb-2.5 flex items-center justify-between gap-3">
          <span className="text-[12px] text-app-muted">Total TTC</span>
          <span className="app-num text-[17px] font-semibold text-app-accent">
            {formatCurrency(total)}
          </span>
        </div>
        <PrimaryButton
          className="w-full py-[13px] text-[14px]"
          disabled={primaryDisabled}
          onClick={onPrimary}>
          {primaryLabel}
        </PrimaryButton>
      </div>
    </>
  );
}

export function ComposerRecapCard({
  clientName,
  kind,
  lineCount,
  paymentTermsDays,
  totals,
}: {
  clientName: string | null;
  kind: 'invoice' | 'quote';
  lineCount: number;
  paymentTermsDays: number;
  totals: { subtotal: number; total: number; vat: number };
}) {
  return (
    <ComposerCard title="Récapitulatif">
      <dl className="divide-y divide-app-border-soft">
        <RecapRow label="Client" value={clientName ?? 'À sélectionner'} muted={!clientName} />
        <RecapRow label="Date d’émission" value={todayFrenchDateInput()} />
        <RecapRow
          label={kind === 'invoice' ? 'Échéance' : 'Valable jusqu’au'}
          muted={kind === 'quote'}
          value={kind === 'invoice' ? addDaysFrenchDateInput(paymentTermsDays) : 'Non définie'}
        />
        <RecapRow label="Lignes remplies" value={String(lineCount)} />
        <RecapRow label="Total HT" value={formatCurrency(totals.subtotal)} />
        <RecapRow label="TVA" value={formatCurrency(totals.vat)} />
      </dl>
      <div className="mt-2.5 flex items-center justify-between border-t border-app-border pt-2.5 text-[15px] font-semibold text-app-text">
        <span>Total TTC</span>
        <span className="app-num text-app-accent">{formatCurrency(totals.total)}</span>
      </div>
    </ComposerCard>
  );
}

function RecapRow({
  label,
  muted,
  value,
}: {
  label: string;
  muted?: boolean;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <dt className="text-[12.5px] text-app-muted">{label}</dt>
      <dd
        className={cn(
          'app-num min-w-0 truncate text-[13px] font-semibold',
          muted ? 'text-app-muted-2' : 'text-app-text',
        )}>
        {value}
      </dd>
    </div>
  );
}
