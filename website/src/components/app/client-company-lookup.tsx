'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import {
  type Control,
  Controller,
  type FieldErrors,
  type UseFormSetValue,
  useWatch,
} from 'react-hook-form';
import { Loader2 } from 'lucide-react';

import { FormField, FormSection, TextInput } from '@/components/app/form-fields';
import { CLIENT_PLACEHOLDERS } from '@/constants/client-placeholders';
import { useCompanyRegistrationLookup } from '@/hooks/use-company-registration-lookup';
import { useSubscription } from '@/hooks/use-subscription';
import {
  getCompanySearchErrorMessage,
  isCompanySearchConfigured,
  normalizeRegistrationDigits,
} from '@/lib/company-search';
import type { ClientFormValues } from '@/types/client';

type ClientCompanyLookupProps = {
  control: Control<ClientFormValues>;
  errors: FieldErrors<ClientFormValues>;
  setValue: UseFormSetValue<ClientFormValues>;
};

function formatRegistrationInput(value: string, maxLength: number): string {
  return normalizeRegistrationDigits(value).slice(0, maxLength);
}

export function ClientCompanyLookup({ control, errors, setValue }: ClientCompanyLookupProps) {
  const { hasFeature } = useSubscription();
  const sirenSearchEnabled = hasFeature('siren_search');
  const siren = useWatch({ control, name: 'siren' }) ?? '';
  const siret = useWatch({ control, name: 'siret' }) ?? '';
  const lastAppliedRef = useRef<string | null>(null);

  const {
    data,
    isFetching,
    isTyping,
    isInvalidInput,
    isLookupEnabled,
    error,
    isSuccess,
    debouncedRegistrationNumber,
  } = useCompanyRegistrationLookup(siren, siret, sirenSearchEnabled);

  const isLoading = sirenSearchEnabled && (isFetching || isTyping);
  const isConfigured = isCompanySearchConfigured();

  useEffect(() => {
    if (!sirenSearchEnabled || !data || debouncedRegistrationNumber.length === 0) {
      return;
    }

    if (lastAppliedRef.current === debouncedRegistrationNumber) {
      return;
    }

    lastAppliedRef.current = debouncedRegistrationNumber;

    setValue('company', data.companyName, { shouldDirty: true });
    setValue('address', data.address, { shouldDirty: true });
    setValue('postalCode', data.postalCode, { shouldDirty: true });
    setValue('city', data.city, { shouldDirty: true });
    setValue('country', data.country, { shouldDirty: true });
    setValue('siren', data.siren, { shouldDirty: true });
    setValue('siret', data.siret, { shouldDirty: true });

    if (data.vatNumber) {
      setValue('vatNumber', data.vatNumber, { shouldDirty: true });
    }
  }, [data, debouncedRegistrationNumber, setValue, sirenSearchEnabled]);

  useEffect(() => {
    if (!isLookupEnabled) {
      lastAppliedRef.current = null;
    }
  }, [isLookupEnabled]);

  function renderStatusMessage(): string | null {
    if (!sirenSearchEnabled) {
      return null;
    }

    if (!isConfigured) {
      return "La recherche automatique n'est pas configurée.";
    }

    if (isLoading) {
      return "Recherche de l'entreprise…";
    }

    if (isInvalidInput) {
      return 'SIREN ou SIRET invalide.';
    }

    if (error) {
      return getCompanySearchErrorMessage(error);
    }

    if (isSuccess && data) {
      return `Entreprise trouvée : ${data.companyName}`;
    }

    return null;
  }

  const statusMessage = renderStatusMessage();
  const statusIsError =
    Boolean(error) || isInvalidInput || (statusMessage?.includes('non configurée') ?? false);
  const statusIsSuccess = isSuccess && Boolean(data) && !isLoading;

  return (
    <FormSection
      description={
        sirenSearchEnabled
          ? 'Saisissez un SIREN (9 chiffres) ou un SIRET (14 chiffres) pour remplir automatiquement les informations de l’entreprise.'
          : 'La saisie manuelle reste possible. La recherche automatique est incluse dans INVEQ Premium.'
      }
      title="Recherche entreprise">
      {!sirenSearchEnabled ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="font-medium">Recherche SIREN / SIRET — INVEQ Premium</p>
          <p className="mt-1 text-amber-800/90">
            Passez à Premium pour préremplir automatiquement les informations entreprise.{' '}
            <Link className="font-medium underline underline-offset-2" href="/tarifs">
              Débloquer Premium
            </Link>
          </p>
        </div>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField error={errors.siren?.message} label="SIREN">
          <div className="relative">
            <Controller
              control={control}
              name="siren"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  inputMode="numeric"
                  onBlur={onBlur}
                  onChange={(event) => onChange(formatRegistrationInput(event.target.value, 9))}
                  placeholder={CLIENT_PLACEHOLDERS.siren}
                  value={value}
                />
              )}
            />
            {isLoading ? (
              <Loader2
                aria-hidden
                className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-primary"
              />
            ) : null}
          </div>
        </FormField>

        <FormField error={errors.siret?.message} label="SIRET">
          <div className="relative">
            <Controller
              control={control}
              name="siret"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  inputMode="numeric"
                  onBlur={onBlur}
                  onChange={(event) => onChange(formatRegistrationInput(event.target.value, 14))}
                  placeholder={CLIENT_PLACEHOLDERS.siret}
                  value={value}
                />
              )}
            />
            {isLoading ? (
              <Loader2
                aria-hidden
                className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-primary"
              />
            ) : null}
          </div>
        </FormField>
      </div>

      {statusMessage ? (
        <p
          aria-live="polite"
          className={
            statusIsError
              ? 'text-sm text-red-600'
              : statusIsSuccess
                ? 'text-sm text-emerald-700'
                : 'text-sm text-slate-500'
          }>
          {statusMessage}
        </p>
      ) : null}
    </FormSection>
  );
}
