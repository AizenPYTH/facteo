'use client';

import React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import {
  FormActions,
  FormField,
  FormSection,
  PrimaryButton,
  TextArea,
  TextInput,
} from '@/components/app/form-fields';
import { companyProfileSchema } from '@/lib/validations/company-profile';
import type { CompanyProfileFormValues } from '@/types/company-profile';
import { createEmptyCompanyProfileFormValues } from '@/types/company-profile';

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
}: {
  defaultValues?: Partial<CompanyProfileFormValues>;
  onSubmit: (values: CompanyProfileFormValues) => Promise<void>;
  submitLabel?: string;
  showPersonalFields?: boolean;
}) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CompanyProfileFormValues>({
    resolver: zodResolver(companyProfileSchema),
    defaultValues: { ...createEmptyCompanyProfileFormValues(), ...defaultValues },
  });

  const paymentMethods = watch('paymentMethods') ?? [];

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
            <FormField error={errors.firstName?.message} label="Prénom *">
              <TextInput {...register('firstName')} />
            </FormField>
            <FormField error={errors.lastName?.message} label="Nom *">
              <TextInput {...register('lastName')} />
            </FormField>
            <FormField className="sm:col-span-2" error={errors.email?.message} label="E-mail *">
              <TextInput {...register('email')} type="email" />
            </FormField>
          </div>
        </FormSection>
      ) : null}

      <FormSection title="Entreprise">
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField className="sm:col-span-2" error={errors.companyName?.message} label="Raison sociale *">
            <TextInput {...register('companyName')} />
          </FormField>
          <FormField error={errors.legalForm?.message} label="Forme juridique">
            <TextInput {...register('legalForm')} placeholder="SAS, SARL, EI…" />
          </FormField>
          <FormField error={errors.shareCapital?.message} label="Capital social">
            <TextInput {...register('shareCapital')} placeholder="10 000 €" />
          </FormField>
          <FormField error={errors.rcsCity?.message} label="RCS / RM">
            <TextInput {...register('rcsCity')} placeholder="Paris" />
          </FormField>
          <FormField error={errors.phone?.message} label="Téléphone">
            <TextInput {...register('phone')} />
          </FormField>
          <FormField error={errors.siren?.message} label="SIREN">
            <TextInput {...register('siren')} placeholder="123 456 789" />
          </FormField>
          <FormField error={errors.siret?.message} label="SIRET">
            <TextInput {...register('siret')} />
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
  defaultValues,
  onSubmit,
}: {
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

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <FormSection title="Préfixes et numérotation">
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField label="Préfixe devis">
            <TextInput onChange={(e) => setField('quotePrefix', e.target.value)} value={values.quotePrefix} />
          </FormField>
          <FormField label="Prochain n° devis">
            <TextInput onChange={(e) => setField('nextQuoteNumber', e.target.value)} value={values.nextQuoteNumber} />
          </FormField>
          <FormField label="Préfixe factures">
            <TextInput onChange={(e) => setField('invoicePrefix', e.target.value)} value={values.invoicePrefix} />
          </FormField>
          <FormField label="Prochain n° facture">
            <TextInput
              onChange={(e) => setField('nextInvoiceNumber', e.target.value)}
              value={values.nextInvoiceNumber}
            />
          </FormField>
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
