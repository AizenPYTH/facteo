import { useEffect, useRef } from 'react';
import { Text, View } from 'react-native';

import { TextField } from '@/components/ui/text-field';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { useThemedStyles } from '@/hooks/use-colors';
import { useCompanyRegistrationLookup } from '@/hooks/use-company-registration-lookup';
import { getCompanySearchErrorMessage, normalizeRegistrationDigits } from '@/lib/company-search';
import type { CompanyLookupResult } from '@/lib/company-search/types';

/**
 * SIREN ou SIRET de SA propre entreprise : l'entreprise est retrouvée et ses
 * informations remplies. Ouvert à toutes les offres et hors quota de
 * recherches, contrairement à la recherche de clients.
 */
export function OwnCompanyLookup({
  label = 'SIREN ou SIRET',
  onChange,
  onFound,
  value,
}: {
  label?: string;
  onChange: (value: string) => void;
  onFound: (result: CompanyLookupResult) => void;
  value: string;
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
          ? `Trouvée : ${lookup.data.companyName}`
          : 'Tapez le SIREN (9 chiffres) ou le SIRET (14 chiffres) : le reste se remplit tout seul.';

  return (
    <View style={styles.container}>
      <TextField
        keyboardType="number-pad"
        label={label}
        maxLength={14}
        onChangeText={(text) => onChange(normalizeRegistrationDigits(text).slice(0, 14))}
        placeholder="SIREN ou SIRET"
        value={value}
      />
      <Text style={[styles.message, isError && styles.error, found && styles.success]}>{message}</Text>
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
    },
    error: {
      color: colors.error,
    },
    success: {
      color: colors.success,
    },
  }));
}
