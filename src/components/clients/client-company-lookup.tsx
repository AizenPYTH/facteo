import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useEffect, useRef } from 'react';
import {
  type Control,
  Controller,
  type FieldErrors,
  type UseFormSetValue,
  useWatch,
} from 'react-hook-form';

import { FormDivider, FormField, FormSection } from '@/components/company/form-section';
import { PremiumUpgradeBanner } from '@/components/subscription/premium-upgrade-banner';
import { TextField } from '@/components/ui/text-field';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
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
  const styles = useStyles();
  const colors = useColors();
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
      return 'La recherche automatique n\'est pas configurée.';
    }

    if (isLoading) {
      return 'Recherche de l\'entreprise…';
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
    <FormSection title="Recherche entreprise">
      {!sirenSearchEnabled ? (
        <PremiumUpgradeBanner
          compact
          message="Recherche SIREN / SIRET — offre Basique ou supérieure"
        />
      ) : null}

      <FormField>
        <Controller
          control={control}
          name="siren"
          render={({ field: { onChange, onBlur, value } }) => (
            <View style={styles.fieldRow}>
              <View style={styles.fieldInput}>
                <TextField
                  error={errors.siren?.message}
                  keyboardType="number-pad"
                  label="SIREN"
                  onBlur={onBlur}
                  onChangeText={(text) => onChange(formatRegistrationInput(text, 9))}
                  placeholder="123456789"
                  value={value}
                />
              </View>
              {isLoading ? (
                <ActivityIndicator color={colors.primary} style={styles.loader} />
              ) : null}
            </View>
          )}
        />
      </FormField>
      <FormDivider />
      <FormField>
        <Controller
          control={control}
          name="siret"
          render={({ field: { onChange, onBlur, value } }) => (
            <View style={styles.fieldRow}>
              <View style={styles.fieldInput}>
                <TextField
                  error={errors.siret?.message}
                  keyboardType="number-pad"
                  label="SIRET"
                  onBlur={onBlur}
                  onChangeText={(text) => onChange(formatRegistrationInput(text, 14))}
                  placeholder="12345678900012"
                  value={value}
                />
              </View>
              {isLoading ? (
                <ActivityIndicator color={colors.primary} style={styles.loader} />
              ) : null}
            </View>
          )}
        />
      </FormField>
      {statusMessage ? (
        <Text
          accessibilityLiveRegion="polite"
          style={[
            styles.status,
            statusIsError ? styles.statusError : null,
            statusIsSuccess ? styles.statusSuccess : null,
          ]}>
          {statusMessage}
        </Text>
      ) : null}
      <Text style={styles.hint}>
        {sirenSearchEnabled
          ? 'Saisissez un SIREN (9 chiffres) ou un SIRET (14 chiffres) pour remplir automatiquement les informations de l\'entreprise.'
          : 'La saisie manuelle reste possible. La recherche automatique est incluse dès l’offre Basique.'}
      </Text>
    </FormSection>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
    fieldRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
    },
    fieldInput: {
      flex: 1,
    },
    loader: {
      marginTop: 28,
    },
    status: {
      ...typography.footnote,
      color: colors.textSecondary,
      paddingHorizontal: spacing.xs,
    },
    statusError: {
      color: colors.error,
    },
    statusSuccess: {
      color: colors.success,
    },
    hint: {
      ...typography.caption1,
      color: colors.textTertiary,
      paddingHorizontal: spacing.xs,
    },
  }));
}
