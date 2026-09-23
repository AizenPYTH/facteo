'use client';

import { ComposerCard, ComposerReadOnlyValue } from '@/components/app/document-composer/composer-card';
import { InlineFieldError } from '@/components/app/document-composer/field-errors';
import { TextInput } from '@/components/app/form-fields';
import {
  addCalendarDaysDateInput,
  frenchLabelFromDateInput,
} from '@/lib/domain/format/date-input';
import { cn } from '@/lib/utils';

const PAYMENT_TERM_SEGMENTS = [30, 45, 60];

/**
 * Dates du document. La date d’émission est libre (y compris dans le passé) :
 * elle est transmise à `createInvoice` / `createQuote`. L’échéance d’une
 * facture suit cette date et le délai de paiement des paramètres.
 */
export function ComposerTermsCard({
  containerRef,
  errorMessage,
  issuedAt,
  kind,
  onIssuedAtChange,
  paymentTermsDays,
}: {
  containerRef?: React.Ref<HTMLElement>;
  errorMessage?: string;
  issuedAt: string;
  kind: 'invoice' | 'quote';
  onIssuedAtChange: (value: string) => void;
  paymentTermsDays: number;
}) {
  const segments = PAYMENT_TERM_SEGMENTS.includes(paymentTermsDays)
    ? PAYMENT_TERM_SEGMENTS
    : [...PAYMENT_TERM_SEGMENTS, paymentTermsDays];
  const dueDate = addCalendarDaysDateInput(issuedAt, paymentTermsDays);
  const dueLabel = dueDate ? frenchLabelFromDateInput(dueDate) : null;

  return (
    <ComposerCard containerRef={containerRef} title="Dates et conditions">
      <div className="space-y-3">
        <div>
          <label
            className="mb-1.5 block text-[12px] font-medium text-app-text-3"
            htmlFor="composer-issued-at">
            Date d’émission
          </label>
          <TextInput
            aria-invalid={Boolean(errorMessage)}
            className="app-num"
            id="composer-issued-at"
            onChange={(event) => onIssuedAtChange(event.target.value)}
            type="date"
            value={issuedAt}
          />
          <InlineFieldError message={errorMessage} />
        </div>

        {kind === 'invoice' ? (
          <ComposerReadOnlyValue label="Échéance" value={dueLabel ?? '—'} />
        ) : (
          <ComposerReadOnlyValue label="Valable jusqu’au" muted value="Non définie" />
        )}

        {kind === 'invoice' ? (
          <div>
            <p className="mb-1.5 text-[12px] font-medium text-app-text-3">Délai de paiement</p>
            <div className="flex gap-1.5">
              {segments.map((days) => {
                const active = days === paymentTermsDays;

                return (
                  <span
                    className={cn(
                      'app-num flex-1 rounded-app-field border py-[7px] text-center text-[12.5px] font-semibold',
                      active
                        ? 'border-app-accent-border bg-app-accent-tint text-app-accent-strong'
                        : 'border-app-border text-app-muted',
                    )}
                    key={days}>
                    {days} j
                  </span>
                );
              })}
            </div>
          </div>
        ) : null}

        <p className="text-[11.5px] leading-relaxed text-app-muted-2">
          {kind === 'invoice'
            ? 'La date d’émission peut être antérieure à aujourd’hui. L’échéance est calculée à partir de cette date et du délai de paiement.'
            : 'La date d’émission peut être antérieure à aujourd’hui. La validité du devis n’est pas fixée ici.'}
        </p>
      </div>
    </ComposerCard>
  );
}
