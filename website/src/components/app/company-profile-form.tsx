'use client';

import React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import {
  FormActions,
  FormField,
  FormSection,
  PrimaryButton,
  SelectInput,
  TextArea,
  TextInput,
} from '@/components/app/form-fields';
import { OwnCompanyLookup } from '@/components/app/own-company-lookup';
import type { CompanyLookupResult } from '@/lib/company-search/types';
import { companyOnlySchema, companyProfileSchema } from '@/lib/validations/company-profile';
import type { CompanyProfileFormValues } from '@/types/company-profile';
import { createEmptyCompanyProfileFormValues } from '@/types/company-profile';
import { INVOICE_TITLE_SUGGESTIONS } from '@/types/pdf-options';
import { formatDocumentNumber } from '@/types/settings';

const PAYMENT_METHODS = [
  { value: 'bank_transfer', label: 'Virement bancaire' },
  { value: 'card', label: 'Carte bancaire' },
  { value: 'cash', label: 'Espèces' },
  { value: 'cheque', label: 'Chèque' },
  { value: 'stripe', label: 'Stripe' },
  { value: 'paypal', label: 'PayPal' },
] as const;

export function CompanyProfileForm({
  defaultValues,
  onSubmit,
  submitLabel = 'Enregistrer',
  showPersonalFields = true,
  showSiren = false,
}: {
  defaultValues?: Partial<CompanyProfileFormValues>;
  onSubmit: (values: CompanyProfileFormValues) => Promise<void>;
  submitLabel?: string;
  showPersonalFields?: boolean;
  /** Champ SIREN (page Entreprise). */
  showSiren?: boolean;
}) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CompanyProfileFormValues>({
    resolver: zodResolver(showPersonalFields ? companyProfileSchema : companyOnlySchema),
    defaultValues: { ...createEmptyCompanyProfileFormValues(), ...defaultValues },
  });

  const paymentMethods = watch('paymentMethods') ?? [];
  const [registrationNumber, setRegistrationNumber] = React.useState('');

  function applyRegistration(result: CompanyLookupResult) {
    const options = { shouldDirty: true, shouldValidate: true } as const;
    setValue('companyName', result.companyName, options);
    setValue('address', result.address, options);
    setValue('postalCode', result.postalCode, options);
    setValue('city', result.city, options);
    setValue('country', result.country, options);
    setValue('siret', result.siret, options);
    if (showSiren) setValue('siren', result.siren, options);
    if (result.vatNumber) setValue('vatNumber', result.vatNumber, options);
  }

  function togglePaymentMethod(method: CompanyProfileFormValues['paymentMethods'][number]) {
    const next = paymentMethods.includes(method)
      ? paymentMethods.filter((m) => m !== method)
      : [...paymentMethods, method];
    setValue('paymentMethods', next, { shouldValidate: true });
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit((values) => onSubmit(values))}>
      {showPersonalFields ? (
        <FormSection title="Identité">
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField error={errors.firstName?.message} label="Prénom">
              <TextInput {...register('firstName')} />
            </FormField>
            <FormField error={errors.lastName?.message} label="Nom">
              <TextInput {...register('lastName')} />
            </FormField>
            <FormField className="sm:col-span-2" error={errors.email?.message} label="E-mail *">
              <TextInput {...register('email')} type="email" />
            </FormField>
          </div>
        </FormSection>
      ) : null}

      <FormSection title="Entreprise">
        {showSiren ? (
          <div className="mb-5 rounded-app-control border border-app-accent-border bg-app-accent-tint/40 p-3.5">
            <p className="mb-2 text-[13px] font-semibold text-app-text">Remplir avec le SIREN ou le SIRET</p>
            <OwnCompanyLookup
              onChange={setRegistrationNumber}
              onFound={applyRegistration}
              value={registrationNumber}
            />
            <p className="mt-1 text-[11.5px] text-app-muted-2">
              Vérifiez puis cliquez sur « Enregistrer » en bas de la page.
            </p>
          </div>
        ) : null}
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField className="sm:col-span-2" error={errors.companyName?.message} label="Raison sociale *">
            <TextInput {...register('companyName')} />
          </FormField>
          <FormField error={errors.phone?.message} label="Téléphone">
            <TextInput {...register('phone')} />
          </FormField>
          {showSiren ? (
            <FormField error={errors.siren?.message} label="SIREN">
              <TextInput {...register('siren')} inputMode="numeric" placeholder="9 chiffres" />
            </FormField>
          ) : null}
          <FormField error={errors.siret?.message} label="SIRET">
            <TextInput {...register('siret')} inputMode="numeric" placeholder="14 chiffres" />
          </FormField>
          <FormField error={errors.vatNumber?.message} label="N° TVA">
            <TextInput {...register('vatNumber')} />
          </FormField>
          <FormField className="sm:col-span-2" error={errors.address?.message} label="Adresse">
            <TextInput {...register('address')} />
          </FormField>
          <FormField error={errors.postalCode?.message} label="Code postal">
            <TextInput {...register('postalCode')} />
          </FormField>
          <FormField error={errors.city?.message} label="Ville">
            <TextInput {...register('city')} />
          </FormField>
          <FormField error={errors.country?.message} label="Pays">
            <TextInput {...register('country')} />
          </FormField>
        </div>
      </FormSection>

      <FormSection title="Coordonnées bancaires">
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField error={errors.iban?.message} label="IBAN">
            <TextInput {...register('iban')} />
          </FormField>
          <FormField error={errors.bic?.message} label="BIC">
            <TextInput {...register('bic')} />
          </FormField>
        </div>
      </FormSection>

      <FormSection title="Moyens de paiement acceptés">
        <div className="flex flex-wrap gap-2">
          {PAYMENT_METHODS.map((method) => {
            const active = paymentMethods.includes(method.value);
            return (
              <button
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                  active
                    ? 'bg-primary text-white'
                    : 'border border-slate-200 bg-white text-slate-600 hover:border-primary/30'
                }`}
                key={method.value}
                onClick={() => togglePaymentMethod(method.value)}
                type="button">
                {method.label}
              </button>
            );
          })}
        </div>
        {errors.paymentMethods ? (
          <p className="text-xs text-red-600">{errors.paymentMethods.message}</p>
        ) : null}
      </FormSection>

      <FormActions>
        <PrimaryButton loading={isSubmitting} type="submit">
          {submitLabel}
        </PrimaryButton>
      </FormActions>
    </form>
  );
}

export function SettingsNumberingForm({
  companyName,
  defaultValues,
  onSubmit,
}: {
  /** Entreprise dont on règle la numérotation (chaque entreprise a la sienne). */
  companyName?: string | null;
  defaultValues: import('@/types/settings').SettingsFormValues;
  onSubmit: (values: import('@/types/settings').SettingsFormValues) => Promise<void>;
}) {
  const [values, setValues] = React.useState(defaultValues);
  const [loading, setLoading] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(values);
    } finally {
      setLoading(false);
    }
  }

  function setField<K extends keyof typeof values>(key: K, value: (typeof values)[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  const format = {
    includeYear: values.numberIncludeYear,
    separator: values.numberSeparator,
    digits: Number(values.numberDigits) || 6,
  };
  const invoicePreview = formatDocumentNumber(values.invoicePrefix, values.nextInvoiceNumber, format);
  const quotePreview = formatDocumentNumber(values.quotePrefix, values.nextQuoteNumber, format);
  const digitsOnly = (value: string) => value.replace(/\D/g, '').slice(0, 9);

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <FormSection
        description={`Ces réglages ne concernent que ${companyName?.trim() || 'cette entreprise'}. Chaque entreprise de votre compte a ses propres préfixes, sa propre suite de numéros et son modèle : changez d’entreprise dans le menu pour régler les autres.`}
        title="Numérotation des factures et des devis">
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField hint="Lettres ou chiffres, 20 caractères au plus. Vide : pas de préfixe." label="Préfixe factures">
            <TextInput
              maxLength={20}
              onChange={(e) => setField('invoicePrefix', e.target.value)}
              placeholder="FAC"
              value={values.invoicePrefix}
            />
          </FormField>
          <FormField
            hint="Numéro de la prochaine facture. Un numéro déjà utilisé est sauté automatiquement."
            label="Prochain n° de facture">
            <TextInput
              inputMode="numeric"
              onChange={(e) => setField('nextInvoiceNumber', digitsOnly(e.target.value))}
              value={values.nextInvoiceNumber}
            />
          </FormField>
          <FormField label="Préfixe devis">
            <TextInput
              maxLength={20}
              onChange={(e) => setField('quotePrefix', e.target.value)}
              placeholder="DEV"
              value={values.quotePrefix}
            />
          </FormField>
          <FormField label="Prochain n° de devis">
            <TextInput
              inputMode="numeric"
              onChange={(e) => setField('nextQuoteNumber', digitsOnly(e.target.value))}
              value={values.nextQuoteNumber}
            />
          </FormField>
          <FormField label="Année dans le numéro">
            <SelectInput
              onChange={(e) => setField('numberIncludeYear', e.target.value === 'yes')}
              value={values.numberIncludeYear ? 'yes' : 'no'}>
              <option value="yes">Oui (FAC-2026-000001)</option>
              <option value="no">Non (FAC-000001)</option>
            </SelectInput>
          </FormField>
          <FormField label="Séparateur">
            <SelectInput onChange={(e) => setField('numberSeparator', e.target.value)} value={values.numberSeparator}>
              <option value="-">Tiret (FAC-2026-1)</option>
              <option value="/">Barre (FAC/2026/1)</option>
              <option value="_">Souligné (FAC_2026_1)</option>
              <option value=".">Point (FAC.2026.1)</option>
              <option value="">Aucun (FAC20261)</option>
            </SelectInput>
          </FormField>
          <FormField label="Nombre de chiffres">
            <SelectInput onChange={(e) => setField('numberDigits', e.target.value)} value={values.numberDigits}>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((count) => (
                <option key={count} value={String(count)}>
                  {count} ({String(1).padStart(count, '0')})
                </option>
              ))}
            </SelectInput>
          </FormField>
        </div>
        <div className="rounded-[10px] bg-app-subtle px-3.5 py-3 text-[13px] text-app-text-2" aria-live="polite">
          Prochaine facture : <span className="app-num font-semibold text-app-text">{invoicePreview}</span>
          {' · '}
          Prochain devis : <span className="app-num font-semibold text-app-text">{quotePreview}</span>
        </div>
      </FormSection>

      <FormSection
        description="Titre affiché en haut des nouvelles factures de cette entreprise (ex. « Note d’honoraires »). Il reste modifiable sur chaque facture."
        title="Nom des factures">
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField label="Titre des factures">
            <TextInput
              list="invoice-title-suggestions"
              maxLength={60}
              onChange={(e) => setField('invoiceTitle', e.target.value)}
              placeholder="Facture"
              value={values.invoiceTitle}
            />
            <datalist id="invoice-title-suggestions">
              {INVOICE_TITLE_SUGGESTIONS.map((title) => (
                <option key={title} value={title} />
              ))}
            </datalist>
          </FormField>
        </div>
      </FormSection>

      <FormSection title="Délais, TVA et devise">
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField label="Validité devis (jours)">
            <TextInput
              onChange={(e) => setField('quoteValidityDays', e.target.value)}
              value={values.quoteValidityDays}
            />
          </FormField>
          <FormField label="Délai de paiement (jours)">
            <TextInput
              onChange={(e) => setField('paymentTermsDays', e.target.value)}
              value={values.paymentTermsDays}
            />
          </FormField>
          <FormField label="TVA par défaut (%)">
            <TextInput onChange={(e) => setField('defaultVatRate', e.target.value)} value={values.defaultVatRate} />
          </FormField>
          <FormField label="Devise">
            <TextInput onChange={(e) => setField('currency', e.target.value)} value={values.currency} />
          </FormField>
        </div>
      </FormSection>

      <FormSection title="Pieds de page">
        <FormField label="Pied de page devis">
          <TextArea onChange={(e) => setField('quoteFooter', e.target.value)} value={values.quoteFooter} />
        </FormField>
        <FormField label="Pied de page factures">
          <TextArea onChange={(e) => setField('invoiceFooter', e.target.value)} value={values.invoiceFooter} />
        </FormField>
      </FormSection>

      <FormActions>
        <PrimaryButton loading={loading} type="submit">
          Enregistrer
        </PrimaryButton>
      </FormActions>
    </form>
  );
}
