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
import type { ClientFormValues } from '@/types/client';
import { createEmptyClientFormValues } from '@/types/client';

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
        </div>
      </FormSection>

      <FormSection description="Coordonnées et localisation" title="Contact">
        <div className="grid gap-5 sm:grid-cols-2">
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

      <FormSection description="Informations légales (optionnel)" title="Légal">
        <div className="grid gap-5 sm:grid-cols-3">
          <FormField error={errors.vatNumber?.message} label="N° TVA">
            <TextInput {...register('vatNumber')} placeholder={CLIENT_PLACEHOLDERS.vatNumber} />
          </FormField>
          <FormField className="sm:col-span-3" error={errors.notes?.message} label="Notes">
            <TextArea {...register('notes')} placeholder={CLIENT_PLACEHOLDERS.notes} />
          </FormField>
        </div>
      </FormSection>

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
