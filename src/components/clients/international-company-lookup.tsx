import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import type { UseFormSetValue } from 'react-hook-form';

import { FormField } from '@/components/company/form-section';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { getCompanySearchErrorMessage } from '@/lib/company-search';
import {
  lookupEuVatNumber,
  parseEuVatNumber,
  searchCompaniesByName,
  type InternationalCompanyResult,
} from '@/lib/company-search/international';
import { consumeSirenSearch } from '@/lib/supabase/subscriptions';
import type { ClientFormValues } from '@/types/client';

type SearchOutcome =
  | { kind: 'vat'; result: InternationalCompanyResult }
  | { kind: 'name'; results: InternationalCompanyResult[] };

/**
 * Client à l'étranger : n° de TVA intracommunautaire (vérifié auprès de la
 * Commission européenne) ou nom de l'entreprise (registre mondial GLEIF).
 */
export function InternationalCompanyLookup({
  enabled,
  setValue,
}: {
  /** Offre incluant la recherche d'entreprise. */
  enabled: boolean;
  setValue: UseFormSetValue<ClientFormValues>;
}) {
  const styles = useStyles();
  const colors = useColors();
  const [query, setQuery] = useState('');
  const [applied, setApplied] = useState<string | null>(null);

  const search = useMutation<SearchOutcome, unknown, string>({
    mutationFn: async (text) => {
      await consumeSirenSearch();
      if (parseEuVatNumber(text)) {
        return { kind: 'vat', result: await lookupEuVatNumber(text) };
      }
      return { kind: 'name', results: await searchCompaniesByName(text) };
    },
    onSuccess: (outcome) => {
      if (outcome.kind === 'vat') apply(outcome.result);
    },
  });

  function apply(result: InternationalCompanyResult) {
    const options = { shouldDirty: true, shouldValidate: true };
    if (result.companyName) setValue('company', result.companyName, options);
    if (result.address) setValue('address', result.address, options);
    setValue('postalCode', result.postalCode, options);
    setValue('city', result.city, options);
    setValue('country', result.country, options);
    // SIREN et SIRET n'existent qu'en France.
    setValue('siren', '', options);
    setValue('siret', '', options);
    if (result.vatNumber) setValue('vatNumber', result.vatNumber, options);
    setApplied(result.companyName || result.vatNumber || '');
  }

  function submit() {
    const text = query.trim();
    if (text.length < 2 || !enabled) return;
    setApplied(null);
    search.mutate(text);
  }

  const outcome = search.data;
  const errorMessage = search.error ? getCompanySearchErrorMessage(search.error) : null;
  const vatHint =
    outcome?.kind === 'vat' && !outcome.result.companyName
      ? 'N° de TVA valide. Ce pays ne communique pas le nom : complétez-le à la main.'
      : null;

  return (
    <View style={styles.root}>
      <FormField>
        <TextField
          autoCapitalize="none"
          autoCorrect={false}
          editable={enabled}
          label="N° de TVA, NIPC ou nom de l’entreprise"
          onChangeText={setQuery}
          onSubmitEditing={submit}
          placeholder="BE0417497106, NIPC ou Siemens"
          returnKeyType="search"
          value={query}
        />
      </FormField>
      <View style={styles.body}>
      <Button
        disabled={!enabled || query.trim().length < 2}
        loading={search.isPending}
        onPress={submit}
        title="Rechercher"
        variant="ghost"
      />

      {errorMessage ? (
        <Text accessibilityLiveRegion="polite" style={[styles.status, styles.statusError]}>
          {search.error && (search.error as { code?: string }).code === 'COMPANY_NOT_FOUND'
            ? 'Numéro de TVA inconnu ou inactif dans l’Union européenne.'
            : errorMessage}
        </Text>
      ) : null}
      {applied !== null && !search.isPending ? (
        <Text accessibilityLiveRegion="polite" style={[styles.status, styles.statusSuccess]}>
          {vatHint ?? `Entreprise ajoutée : ${applied}`}
        </Text>
      ) : null}

      {outcome?.kind === 'name' && applied === null ? (
        outcome.results.length === 0 ? (
          <Text style={styles.status}>
            Aucune entreprise trouvée. Essayez le n° de TVA, ou saisissez les informations à la main.
          </Text>
        ) : (
          <View style={styles.results}>
            {outcome.results.map((result, index) => (
              <Pressable
                accessibilityRole="button"
                key={`${result.companyName}-${result.city}-${index}`}
                onPress={() => apply(result)}
                style={({ pressed }) => [styles.result, index > 0 && styles.resultSeparated, pressed && styles.pressed]}>
                <Text numberOfLines={2} style={styles.resultName}>
                  {result.companyName}
                </Text>
                <Text numberOfLines={1} style={styles.resultMeta}>
                  {[result.city, result.country].filter(Boolean).join(' · ')}
                </Text>
              </Pressable>
            ))}
          </View>
        )
      ) : null}

      {search.isPending ? <ActivityIndicator color={colors.primary} /> : null}

      <Text style={styles.hint}>
        Union européenne : saisissez le n° de TVA intracommunautaire, avec le code pays (ex.
        BE0417497106). Portugal : le NIPC seul suffit (ex. 500100144). Autres pays : saisissez le
        nom de l’entreprise.
      </Text>
      </View>
    </View>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
    root: {
      paddingBottom: spacing.md,
    },
    body: {
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
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
    results: {
      borderRadius: radius.card,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      overflow: 'hidden',
    },
    result: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      minHeight: 52,
      justifyContent: 'center',
    },
    resultSeparated: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    pressed: {
      opacity: 0.6,
    },
    resultName: {
      ...typography.subheadlineMedium,
      color: colors.text,
    },
    resultMeta: {
      ...typography.footnote,
      color: colors.textSecondary,
      marginTop: 2,
    },
    hint: {
      ...typography.caption1,
      color: colors.textTertiary,
      paddingHorizontal: spacing.xs,
    },
  }));
}
