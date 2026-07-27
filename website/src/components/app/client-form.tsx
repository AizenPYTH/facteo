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
            <TextInput {...register('lastName')} placeholder="Dupont" />
          </FormField>
          <FormField error={errors.firstName?.message} label="Prénom">
            <TextInput {...register('firstName')} placeholder="Marie" />
          </FormField>
          <FormField className="sm:col-span-2" error={errors.company?.message} label="Entreprise">
            <TextInput {...register('company')} placeholder="SARL Exemple" />
          </FormField>
        </div>
      </FormSection>

      <FormSection description="Coordonnées et localisation" title="Contact">
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField error={errors.email?.message} label="E-mail">
            <TextInput {...register('email')} placeholder="contact@exemple.fr" type="email" />
          </FormField>
          <FormField error={errors.phone?.message} label="Téléphone">
            <TextInput {...register('phone')} placeholder="+351 962 003 090" />
          </FormField>
          <FormField className="sm:col-span-2" error={errors.address?.message} label="Adresse">
            <TextInput {...register('address')} placeholder="12 rue de la Paix" />
          </FormField>
          <FormField error={errors.postalCode?.message} label="Code postal">
            <TextInput {...register('postalCode')} placeholder="2700-337" />
          </FormField>
          <FormField error={errors.city?.message} label="Ville">
            <TextInput {...register('city')} placeholder="Paris" />
          </FormField>
          <FormField error={errors.country?.message} label="Pays">
            <TextInput {...register('country')} />
          </FormField>
        </div>
      </FormSection>

      <FormSection description="Informations légales (optionnel)" title="Légal">
        <div className="grid gap-5 sm:grid-cols-3">
          <FormField error={errors.vatNumber?.message} label="N° TVA">
            <TextInput {...register('vatNumber')} placeholder="FR12345678901" />
          </FormField>
          <FormField className="sm:col-span-3" error={errors.notes?.message} label="Notes">
            <TextArea {...register('notes')} placeholder="Notes internes…" />
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
