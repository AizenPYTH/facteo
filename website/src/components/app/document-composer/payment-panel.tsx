'use client';

import { useState } from 'react';

import { CheckMark, IQ_FIELD, IQ_PANEL } from '@/components/app/document-composer/ui';
import { isValidIban } from '@/lib/domain/payments/sepa-qr';
import { cn } from '@/lib/utils';
import {
  PAYMENT_MENTION_PRESETS,
  isValidBic,
  matchPaymentMentionPreset,
  normalizeBankValue,
  paymentMentionDays,
  resolveInvoiceBankDetails,
  withPaymentMentionDays,
  type InvoiceBankDetails,
  type InvoicePdfOptions,
  type PaymentMentionPresetId,
} from '@/types/pdf-options';

type MentionMode = 'none' | PaymentMentionPresetId | 'custom';

/** « FR7630004000… » → « FR76 3000 4000 … » : lisible pendant la relecture. */
function groupByFour(value: string): string {
  return normalizeBankValue(value).replace(/(.{4})(?=.)/g, '$1 ');
}

function initialMode(text: string | null): MentionMode {
  if (!text) return 'none';
  return matchPaymentMentionPreset(text) ?? 'custom';
}

/**
 * « Paiement et mentions », en bas de la facture : coordonnées bancaires
 * imprimées (préremplies depuis l'entreprise) et mention de paiement, au choix
 * parmi les mentions prêtes à l'emploi, en texte libre, ou aucune.
 */
export function ComposerPaymentPanel({
  company,
  onChange,
  onSaveAsDefaultChange,
  paid,
  paymentDays,
  saveAsDefault,
  value,
}: {
  company: { iban: string | null; bic: string | null } | null;
  onChange: (value: InvoicePdfOptions) => void;
  onSaveAsDefaultChange: (value: boolean) => void;
  /** Délai « Déjà payée » : les coordonnées ne sont pas imprimées. */
  paid: boolean;
  /** Délai de la facture en jours (0 : à réception), `null` si aucun. */
  paymentDays: number | null;
  /** Enregistrer ces coordonnées dans l'entreprise à la création de la facture. */
  saveAsDefault: boolean;
  value: InvoicePdfOptions;
}) {
  const bank = resolveInvoiceBankDetails(value.bank, company);
  // `null` tant que l'utilisateur n'y a pas touché : le champ suit la valeur
  // imprimée, y compris une entreprise chargée après coup.
  const [ibanDraft, setIbanDraft] = useState<string | null>(null);
  const [bicDraft, setBicDraft] = useState<string | null>(null);
  const [modeChoice, setModeChoice] = useState<MentionMode | null>(null);
  const [customDraft, setCustomDraft] = useState<string | null>(null);

  const text = value.paymentMention ?? '';
  const savedMode = initialMode(value.paymentMention);
  const mode = modeChoice ?? savedMode;
  const customText = customDraft ?? (savedMode === 'custom' ? text : '');
  const ibanShown = ibanDraft ?? groupByFour(bank.iban);
  const bicShown = bicDraft ?? bank.bic;

  function setBank(next: Partial<InvoiceBankDetails>) {
    onChange({ ...value, bank: { ...bank, ...next } });
  }

  function setMention(next: string | null) {
    onChange({ ...value, paymentMention: next && next.trim() ? next : null });
  }

  function chooseMode(next: MentionMode) {
    setModeChoice(next);
    if (next === 'none') {
      setMention(null);
    } else if (next === 'custom') {
      setMention(customText);
    } else {
      setMention(PAYMENT_MENTION_PRESETS.find((preset) => preset.id === next)?.text ?? null);
    }
  }

  function editMention(next: string) {
    const stillPreset = mode !== 'custom' && matchPaymentMentionPreset(next) === mode;
    if (!stillPreset) {
      // Le texte d'une mention prête à l'emploi a été réécrit : il devient libre.
      setModeChoice('custom');
      setCustomDraft(next);
    }
    setMention(next);
  }

  const iban = normalizeBankValue(bank.iban);
  const bic = normalizeBankValue(bank.bic);
  const ibanError = bank.show && iban.length > 0 && !isValidIban(iban);
  const bicError = bank.show && bic.length > 0 && !isValidBic(bic);
  const companyIban = normalizeBankValue(company?.iban);
  const companyBic = normalizeBankValue(company?.bic);
  const canSaveAsDefault =
    bank.show && isValidIban(iban) && (iban !== companyIban || bic !== companyBic);

  const mentionDays = mode === 'none' ? null : paymentMentionDays(text);
  const mismatch =
    !paid && paymentDays !== null && mentionDays !== null && mentionDays !== paymentDays;

  return (
    <section aria-labelledby="composer-payment-title" className={cn(IQ_PANEL, 'p-5 sm:p-[22px]')}>
      <h2 className="text-[15px] font-bold" id="composer-payment-title">
        Paiement et mentions
      </h2>
      <p className="mt-0.5 text-[13px] text-iq-ink3">Imprimés en bas de la facture.</p>

      {/* Coordonnées bancaires */}
      <div className="mt-5">
        <button
          aria-checked={bank.show}
          className="flex items-start gap-3 rounded-[8px] text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-iq-accent"
          onClick={() => setBank({ show: !bank.show })}
          role="checkbox"
          type="button">
          <CheckMark checked={bank.show} className="mt-[1px]" />
          <span>
            <span className="block text-[14px] font-semibold">Afficher l’IBAN et le BIC</span>
            <span className="block text-[12.5px] text-iq-ink3">
              Avec le QR code de virement, pour être payé plus vite.
            </span>
          </span>
        </button>

        {bank.show ? (
          <div className="mt-3.5 pl-[30px]">
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_170px]">
              <label className="block min-w-0">
                <span className="mb-1.5 block text-[12.5px] font-semibold text-iq-ink2">IBAN</span>
                <input
                  aria-invalid={ibanError}
                  autoComplete="off"
                  className={cn(
                    IQ_FIELD,
                    'uppercase tracking-[0.3px]',
                    ibanError && 'border-iq-danger focus:border-iq-danger',
                  )}
                  onBlur={() => setIbanDraft(groupByFour(ibanShown))}
                  onChange={(event) => {
                    setIbanDraft(event.target.value);
                    setBank({ iban: normalizeBankValue(event.target.value) });
                  }}
                  placeholder="FR76 3000 4000 0312 3456 7890 143"
                  spellCheck={false}
                  value={ibanShown}
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[12.5px] font-semibold text-iq-ink2">BIC</span>
                <input
                  aria-invalid={bicError}
                  autoComplete="off"
                  className={cn(
                    IQ_FIELD,
                    'uppercase tracking-[0.3px]',
                    bicError && 'border-iq-danger focus:border-iq-danger',
                  )}
                  onChange={(event) => {
                    setBicDraft(event.target.value);
                    setBank({ bic: normalizeBankValue(event.target.value) });
                  }}
                  placeholder="BNPAFRPP"
                  spellCheck={false}
                  value={bicShown}
                />
              </label>
            </div>
            {ibanError ? (
              <p className="mt-1.5 text-[12.5px] font-medium text-iq-danger">
                IBAN incomplet ou erroné : vérifiez les chiffres.
              </p>
            ) : null}
            {bicError ? (
              <p className="mt-1.5 text-[12.5px] font-medium text-iq-danger">
                Le BIC compte 8 ou 11 caractères (ex. BNPAFRPP).
              </p>
            ) : null}
            {canSaveAsDefault ? (
              <button
                aria-checked={saveAsDefault}
                className="mt-3 flex items-center gap-2.5 rounded-[8px] text-left text-[13px] text-iq-ink2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-iq-accent"
                onClick={() => onSaveAsDefaultChange(!saveAsDefault)}
                role="checkbox"
                type="button">
                <CheckMark checked={saveAsDefault} />
                Utiliser ces coordonnées pour mes prochaines factures
              </button>
            ) : null}
            {paid ? (
              <p className="mt-2.5 text-[12.5px] text-iq-ink3">
                Facture déjà payée : les coordonnées bancaires ne sont pas imprimées.
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      <div aria-hidden className="my-5 h-px bg-iq-line2" />

      {/* Mention de paiement */}
      <div>
        <h3 className="text-[14px] font-semibold" id="composer-mention-title">
          Mention de paiement
        </h3>
        <div
          aria-labelledby="composer-mention-title"
          className="mt-2.5 grid gap-2 sm:grid-cols-2"
          role="radiogroup">
          <MentionOption
            checked={mode === 'none'}
            hint="Rien n’est ajouté"
            label="Aucune"
            onSelect={() => chooseMode('none')}
          />
          {PAYMENT_MENTION_PRESETS.map((preset) => (
            <MentionOption
              checked={mode === preset.id}
              hint={preset.text}
              key={preset.id}
              label={preset.label}
              onSelect={() => chooseMode(preset.id)}
            />
          ))}
          <MentionOption
            checked={mode === 'custom'}
            hint="Écrivez votre propre mention"
            label="Texte libre"
            onSelect={() => chooseMode('custom')}
          />
        </div>

        {mode === 'none' ? (
          <p className="mt-3 text-[12.5px] text-iq-ink3">
            Entre professionnels, la facture doit indiquer les pénalités de retard et
            l’indemnité forfaitaire de 40 € pour frais de recouvrement.
          </p>
        ) : (
          <textarea
            aria-label="Texte de la mention de paiement"
            className="mt-3 block min-h-[96px] w-full resize-y rounded-[14px] border border-iq-line bg-iq-surface px-3.5 py-3 text-[16px] leading-[1.55] text-iq-ink outline-none transition-[border-color,box-shadow] duration-150 focus:border-iq-accent focus:shadow-[0_0_0_3px_var(--iq-accent-soft)] sm:text-[13.5px]"
            onChange={(event) => editMention(event.target.value)}
            placeholder="Délai de paiement, pénalités de retard, indemnité forfaitaire de 40 €…"
            rows={4}
            value={text}
          />
        )}

        {mismatch && mentionDays !== null ? (
          <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-[12px] bg-iq-soft px-3.5 py-2.5 text-[12.5px]">
            <span className="flex min-w-0 flex-1 items-center gap-2 text-iq-ink2">
              <span aria-hidden className="size-[7px] shrink-0 rounded-full bg-iq-warn" />
              {paymentDays === 0
                ? `La mention indique ${mentionDays} jours, mais la facture est payable à réception.`
                : `La mention indique ${mentionDays} jours, mais la facture est payable à ${paymentDays} jours.`}
            </span>
            {paymentDays !== null && paymentDays > 0 ? (
              <button
                className="shrink-0 rounded-[8px] font-semibold text-iq-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-iq-accent"
                onClick={() => editMention(withPaymentMentionDays(text, paymentDays))}
                type="button">
                Mettre {paymentDays} jours
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}

function MentionOption({
  checked,
  hint,
  label,
  onSelect,
}: {
  checked: boolean;
  hint: string;
  label: string;
  onSelect: () => void;
}) {
  return (
    <button
      aria-checked={checked}
      className={cn(
        'flex min-w-0 items-start gap-2.5 rounded-[12px] border px-3 py-2.5 text-left transition-[background-color,border-color] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-iq-accent',
        checked
          ? 'border-iq-accent bg-iq-accent-soft'
          : 'border-iq-line bg-iq-surface hover:bg-iq-soft',
      )}
      onClick={onSelect}
      role="radio"
      type="button">
      <span
        aria-hidden
        className={cn(
          'mt-[2px] flex size-4 shrink-0 items-center justify-center rounded-full border-[1.5px]',
          checked ? 'border-iq-accent' : 'border-iq-line',
        )}>
        {checked ? <span className="size-2 rounded-full bg-iq-accent" /> : null}
      </span>
      <span className="min-w-0">
        <span
          className={cn(
            'block text-[13.5px] font-semibold',
            checked ? 'text-iq-accent-ink' : 'text-iq-ink',
          )}>
          {label}
        </span>
        <span className="mt-0.5 line-clamp-2 text-[12px] leading-[1.45] text-iq-ink3">
          {hint}
        </span>
      </span>
    </button>
  );
}
