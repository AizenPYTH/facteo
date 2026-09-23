'use client';

import { ComposerCard, ComposerReadOnlyValue } from '@/components/app/document-composer/composer-card';
import { InlineFieldError } from '@/components/app/document-composer/field-errors';
import { TextInput } from '@/components/app/form-fields';
import {
  addCalendarDaysDateInput,
  frenchLabelFromDateInput,
} from '@/lib/domain/format/date-input';
import { cn } from '@/lib/utils';

const PAYMENT_TERM_PRESETS = [30, 45, 60];

/**
 * Dates du document. La date d’émission est libre. Le délai de paiement
 * (30, 45 ou 60 jours) fixe l’échéance. « Déjà payé » n’en crée pas.
 */
export function ComposerTermsCard({
  containerRef,
  errorMessage,
  issuedAt,
  kind,
  onIssuedAtChange,
  onPaymentTermsChange,
  paymentTermsDays,
}: {
  containerRef?: React.Ref<HTMLElement>;
  errorMessage?: string;
  issuedAt: string;
  kind: 'invoice' | 'quote';
  onIssuedAtChange: (value: string) => void;
  onPaymentTermsChange: (value: number | 'paid') => void;
  /** `null` : facture déjà payée, sans échéance. */
  paymentTermsDays: number | null;
}) {
  const alreadyPaid = paymentTermsDays === null;
  const segments =
    paymentTermsDays !== null && !PAYMENT_TERM_PRESETS.includes(paymentTermsDays)
      ? [...PAYMENT_TERM_PRESETS, paymentTermsDays]
      : PAYMENT_TERM_PRESETS;
  const dueDate =
    paymentTermsDays === null ? null : addCalendarDaysDateInput(issuedAt, paymentTermsDays);
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
          <ComposerReadOnlyValue
            label="Échéance"
            muted={alreadyPaid}
            value={alreadyPaid ? 'Aucune' : (dueLabel ?? '—')}
          />
        ) : (
          <ComposerReadOnlyValue label="Valable jusqu’au" muted value="Non définie" />
        )}

        {kind === 'invoice' ? (
          <div>
            <p className="mb-1.5 text-[12px] font-medium text-app-text-3" id="composer-payment-terms">
              Délai de paiement
            </p>
            <div aria-labelledby="composer-payment-terms" className="flex gap-1.5" role="group">
              {segments.map((days) => {
                const active = days === paymentTermsDays;

                return (
                  <button
                    aria-pressed={active}
                    className={cn(
                      'app-num flex-1 rounded-app-field border py-[7px] text-center text-[12.5px] font-semibold transition-[background-color,border-color,color] duration-150',
                      active
                        ? 'border-app-accent-border bg-app-accent-tint text-app-accent-strong'
                        : 'border-app-border text-app-muted hover:border-app-accent hover:text-app-text',
                    )}
                    key={days}
                    onClick={() => onPaymentTermsChange(days)}
                    type="button">
                    {days} j
                  </button>
                );
              })}
            </div>
            <button
              aria-pressed={alreadyPaid}
              className={cn(
                'mt-1.5 w-full rounded-app-field border py-[7px] text-center text-[12.5px] font-semibold transition-[background-color,border-color,color] duration-150',
                alreadyPaid
                  ? 'border-app-accent-border bg-app-accent-tint text-app-accent-strong'
                  : 'border-app-border text-app-muted hover:border-app-accent hover:text-app-text',
              )}
              onClick={() => onPaymentTermsChange('paid')}
              type="button">
              Déjà payé
            </button>
          </div>
        ) : null}

        <p className="text-[11.5px] leading-relaxed text-app-muted-2">
          {kind === 'invoice'
            ? alreadyPaid
              ? 'La facture est enregistrée comme payée. Aucune date d’échéance n’est générée.'
              : 'La date d’émission peut être antérieure à aujourd’hui. L’échéance part de cette date et du délai choisi.'
            : 'La date d’émission peut être antérieure à aujourd’hui. La validité du devis n’est pas fixée ici.'}
        </p>
      </div>
    </ComposerCard>
  );
}
