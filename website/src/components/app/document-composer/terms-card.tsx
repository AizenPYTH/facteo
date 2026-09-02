'use client';

import { ComposerCard, ComposerReadOnlyValue } from '@/components/app/document-composer/composer-card';
import { addDaysFrenchDateInput, todayFrenchDateInput } from '@/lib/domain/format/date-input';
import { cn } from '@/lib/utils';

const PAYMENT_TERM_SEGMENTS = [30, 45, 60];

/**
 * Bloc en lecture seule : le composer ne transmet aucune date à `createInvoice` /
 * `createQuote`, les valeurs affichées sont celles que la création applique
 * (émission = aujourd'hui, échéance = paramètres de facturation).
 */
export function ComposerTermsCard({
  kind,
  paymentTermsDays,
}: {
  kind: 'invoice' | 'quote';
  paymentTermsDays: number;
}) {
  const segments = PAYMENT_TERM_SEGMENTS.includes(paymentTermsDays)
    ? PAYMENT_TERM_SEGMENTS
    : [...PAYMENT_TERM_SEGMENTS, paymentTermsDays];

  return (
    <ComposerCard title="Dates et conditions">
      <div className="space-y-3">
        <ComposerReadOnlyValue label="Date d’émission" value={todayFrenchDateInput()} />

        {kind === 'invoice' ? (
          <ComposerReadOnlyValue
            label="Échéance"
            value={addDaysFrenchDateInput(paymentTermsDays)}
          />
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
            ? 'Émission et délai de paiement sont appliqués à la création, d’après les paramètres de facturation.'
            : 'La date d’émission est appliquée à la création. La validité du devis n’est pas fixée ici.'}
        </p>
      </div>
    </ComposerCard>
  );
}
