'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { ClientCompanyLookup } from '@/components/app/client-company-lookup';
import {
  FormActions,
  FormField,
  FormSection,
  PrimaryButton,
  SecondaryButton,
  TextArea,
  TextInput,
} from '@/components/app/form-fields';
import { CLIENT_PLACEHOLDERS } from '@/constants/client-placeholders';
import { clientFormSchema } from '@/lib/validations/client';
import { cn } from '@/lib/utils';
import type { ClientFormValues } from '@/types/client';
import { createEmptyClientFormValues } from '@/types/client';

type ClientFormTab = 'identity' | 'address' | 'legal' | 'notes';

const TABS: { id: ClientFormTab; label: string }[] = [
  { id: 'identity', label: 'Identité' },
  { id: 'address', label: 'Adresse' },
  { id: 'legal', label: 'Légal' },
  { id: 'notes', label: 'Notes' },
];

export function ClientForm({
  defaultValues,
  onSubmit,
  onCancel,
  submitLabel = 'Enregistrer',
}: {
  defaultValues?: Partial<ClientFormValues>;
  onSubmit: (values: ClientFormValues) => Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
}) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [tab, setTab] = useState<ClientFormTab>('identity');
  const {
    register,
    control,
    setValue,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: { ...createEmptyClientFormValues(), ...defaultValues },
  });

  return (
    <form
      className="space-y-6"
      onSubmit={handleSubmit(async (values) => {
        setSubmitError(null);
        try {
          await onSubmit(values);
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : typeof error === 'object' &&
                  error &&
                  'message' in error &&
                  typeof (error as { message: unknown }).message === 'string'
                ? (error as { message: string }).message
                : 'Impossible d’enregistrer le client.';
          setSubmitError(
            message.includes('postal_code')
              ? 'Code postal invalide. Vérifiez le format (ex. 75001 ou 2700-337).'
              : message,
          );
        }
      })}>
      {submitError ? (
        <div
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert">
          {submitError}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-1 rounded-xl bg-slate-100/80 p-1">
        {TABS.map((item) => {
          const active = tab === item.id;
          return (
            <button
              className={cn(
                'flex-1 rounded-lg px-3 py-2 text-sm font-medium transition',
                active
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-slate-500 hover:text-slate-800',
              )}
              key={item.id}
              onClick={() => setTab(item.id)}
              type="button">
              {item.label}
            </button>
          );
        })}
      </div>

      {tab === 'identity' ? (
        <>
          <ClientCompanyLookup control={control} errors={errors} setValue={setValue} />
          <FormSection description="Informations principales du contact" title="Identité">
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField error={errors.lastName?.message} label="Nom *">
                <TextInput {...register('lastName')} placeholder={CLIENT_PLACEHOLDERS.lastName} />
              </FormField>
              <FormField error={errors.firstName?.message} label="Prénom">
                <TextInput {...register('firstName')} placeholder={CLIENT_PLACEHOLDERS.firstName} />
              </FormField>
              <FormField className="sm:col-span-2" error={errors.company?.message} label="Entreprise">
                <TextInput {...register('company')} placeholder={CLIENT_PLACEHOLDERS.company} />
              </FormField>
              <FormField error={errors.email?.message} label="E-mail">
                <TextInput
                  {...register('email')}
                  placeholder={CLIENT_PLACEHOLDERS.email}
                  type="email"
                />
              </FormField>
              <FormField error={errors.phone?.message} label="Téléphone">
                <TextInput {...register('phone')} placeholder={CLIENT_PLACEHOLDERS.phone} />
              </FormField>
              <FormField className="sm:col-span-2" error={errors.website?.message} label="Site web">
                <TextInput {...register('website')} placeholder={CLIENT_PLACEHOLDERS.website} />
              </FormField>
            </div>
          </FormSection>
        </>
      ) : null}

      {tab === 'address' ? (
        <FormSection description="Localisation du client" title="Adresse">
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField className="sm:col-span-2" error={errors.address?.message} label="Adresse">
              <TextInput {...register('address')} placeholder={CLIENT_PLACEHOLDERS.address} />
            </FormField>
            <FormField
              className="sm:col-span-2"
              error={errors.addressLine2?.message}
              label="Complément d’adresse">
              <TextInput
                {...register('addressLine2')}
                placeholder={CLIENT_PLACEHOLDERS.addressLine2}
              />
            </FormField>
            <FormField error={errors.postalCode?.message} label="Code postal">
              <TextInput {...register('postalCode')} placeholder={CLIENT_PLACEHOLDERS.postalCode} />
            </FormField>
            <FormField error={errors.city?.message} label="Ville">
              <TextInput {...register('city')} placeholder={CLIENT_PLACEHOLDERS.city} />
            </FormField>
            <FormField error={errors.region?.message} label="Région">
              <TextInput {...register('region')} placeholder={CLIENT_PLACEHOLDERS.region} />
            </FormField>
            <FormField error={errors.country?.message} label="Pays">
              <TextInput {...register('country')} placeholder={CLIENT_PLACEHOLDERS.country} />
            </FormField>
          </div>
        </FormSection>
      ) : null}

      {tab === 'legal' ? (
        <FormSection description="Identifiants fiscaux (optionnel)" title="Légal">
          <div className="grid gap-5 sm:grid-cols-3">
            <FormField error={errors.vatNumber?.message} label="N° TVA">
              <TextInput {...register('vatNumber')} placeholder={CLIENT_PLACEHOLDERS.vatNumber} />
            </FormField>
            <FormField error={errors.siren?.message} label="SIREN">
              <TextInput {...register('siren')} placeholder={CLIENT_PLACEHOLDERS.siren} />
            </FormField>
            <FormField error={errors.siret?.message} label="SIRET">
              <TextInput {...register('siret')} placeholder={CLIENT_PLACEHOLDERS.siret} />
            </FormField>
          </div>
        </FormSection>
      ) : null}

      {tab === 'notes' ? (
        <FormSection description="Visible uniquement en interne" title="Notes">
          <FormField error={errors.notes?.message} label="Notes internes">
            <TextArea {...register('notes')} placeholder={CLIENT_PLACEHOLDERS.notes} rows={6} />
          </FormField>
        </FormSection>
      ) : null}

      <FormActions>
        {onCancel ? (
          <SecondaryButton onClick={onCancel} type="button">
            Annuler
          </SecondaryButton>
        ) : null}
        <PrimaryButton loading={isSubmitting} type="submit">
          {submitLabel}
        </PrimaryButton>
      </FormActions>
    </form>
  );
}
