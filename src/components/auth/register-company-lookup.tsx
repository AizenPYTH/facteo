import { useEffect, useRef } from 'react';
import { Text, View } from 'react-native';

import { AuthTextField } from '@/components/auth/auth-text-field';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { useThemedStyles } from '@/hooks/use-colors';
import { useCompanyRegistrationLookup } from '@/hooks/use-company-registration-lookup';
import { getCompanySearchErrorMessage, normalizeRegistrationDigits } from '@/lib/company-search';
import type { CompanyLookupResult } from '@/lib/company-search/types';

/**
 * Inscription : SIREN ou SIRET de son entreprise, facultatif. L'entreprise
 * est retrouvée (même recherche que la page Entreprise, hors quota) et son
 * nom, son adresse, son SIRET et sa TVA sont repris à la création du compte.
 */
export function RegisterCompanyLookup({
  value,
  onChange,
  onFound,
}: {
  value: string;
  onChange: (value: string) => void;
  onFound: (result: CompanyLookupResult | null) => void;
}) {
  const styles = useStyles();
  const digits = normalizeRegistrationDigits(value);
  const lookup = useCompanyRegistrationLookup(
    digits.length <= 9 ? digits : '',
    digits.length > 9 ? digits : '',
    true,
    false,
  );
  const appliedRef = useRef<string | null>(null);
  const onFoundRef = useRef(onFound);

  useEffect(() => {
    onFoundRef.current = onFound;
  }, [onFound]);

  useEffect(() => {
    if (!lookup.data || appliedRef.current === lookup.debouncedRegistrationNumber) return;
    appliedRef.current = lookup.debouncedRegistrationNumber;
    onFoundRef.current(lookup.data);
  }, [lookup.data, lookup.debouncedRegistrationNumber]);

  const loading = lookup.isFetching || (lookup.isTyping && digits.length >= 9);
  const isError = Boolean(lookup.error) || lookup.isInvalidInput;
  const found = Boolean(lookup.data) && lookup.isLookupEnabled && !loading;
  const message = loading
    ? 'Recherche de l’entreprise…'
    : lookup.isInvalidInput
      ? 'SIREN ou SIRET invalide.'
      : lookup.error
        ? getCompanySearchErrorMessage(lookup.error)
        : found && lookup.data
          ? `Trouvée : ${lookup.data.companyName}. Adresse, SIRET et TVA seront remplis.`
          : 'Facultatif : tapez le SIREN (9 chiffres) ou le SIRET (14 chiffres), le reste se remplit tout seul.';

  return (
    <View style={styles.container}>
      <AuthTextField
        autoComplete="off"
        icon="number"
        keyboardType="number-pad"
        label="SIREN ou SIRET"
        maxLength={14}
        onChangeText={(text) => {
          const next = normalizeRegistrationDigits(text).slice(0, 14);
          onChange(next);
          // Numéro effacé ou modifié : les infos trouvées ne valent plus.
          if (next !== lookup.debouncedRegistrationNumber) {
            appliedRef.current = null;
            onFoundRef.current(null);
          }
        }}
        placeholder="123 456 789"
        textContentType="none"
        value={value}
      />
      <Text
        accessibilityLiveRegion="polite"
        maxFontSizeMultiplier={1.4}
        style={[styles.message, isError && styles.error, found && styles.success]}>
        {message}
      </Text>
    </View>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
    container: {
      gap: spacing.xs,
    },
    message: {
      ...typography.footnote,
      color: colors.textSecondary,
      marginLeft: spacing[0.5],
    },
    error: {
      color: colors.error,
    },
    success: {
      color: colors.success,
    },
  }));
}
