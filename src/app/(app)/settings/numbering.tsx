import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { Switch, Text, View } from 'react-native';
import { z } from 'zod';

import { SettingsScreenFrame } from '@/components/web/desktop/settings-screen-frame';
import { Button } from '@/components/ui/button';
import { FilterChipBar } from '@/components/ui/filter-chip';
import { LoadingView } from '@/components/ui/loading-view';
import { TextField } from '@/components/ui/text-field';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { useSettings, useUpdateSettings } from '@/hooks/use-settings';
import { useTenant } from '@/hooks/use-tenant';
import { useToast } from '@/providers/toast-provider';
import { INVOICE_TITLE_SUGGESTIONS } from '@/types/pdf-options';
import { createDefaultSettingsFormValues, formatDocumentNumber } from '@/types/settings';

const nextNumber = z
  .string()
  .trim()
  .regex(/^\d{1,9}$/, 'Numéro invalide.')
  .refine((value) => Number(value) > 0, 'Le numéro doit être supérieur à 0.');

const prefix = z
  .string()
  .trim()
  .max(20, '20 caractères au plus.')
  .regex(/^[^\s]*$/, 'Pas d’espace dans le préfixe.');

const numberingSchema = z.object({
  quotePrefix: prefix,
  invoicePrefix: prefix,
  nextQuoteNumber: nextNumber,
  nextInvoiceNumber: nextNumber,
  numberIncludeYear: z.boolean(),
  numberSeparator: z.enum(['-', '/', '_', '.', '']),
  numberDigits: z.string().regex(/^[1-8]$/),
  invoiceTitle: z.string().trim().max(60, '60 caractères au plus.'),
});

type NumberingFormValues = z.infer<typeof numberingSchema>;

const SEPARATOR_OPTIONS = [
  { value: '-', label: 'Tiret  -' },
  { value: '/', label: 'Barre  /' },
  { value: '_', label: 'Souligné  _' },
  { value: '.', label: 'Point  .' },
  { value: '', label: 'Aucun' },
] as const;

const DIGIT_OPTIONS = ['1', '2', '3', '4', '5', '6', '7', '8'].map((value) => ({
  value,
  label: `${value} (${'1'.padStart(Number(value), '0')})`,
}));

function pickFormValues(values: ReturnType<typeof createDefaultSettingsFormValues>): NumberingFormValues {
  const separator = SEPARATOR_OPTIONS.some((option) => option.value === values.numberSeparator)
    ? (values.numberSeparator as NumberingFormValues['numberSeparator'])
    : '-';
  const digits = Math.min(8, Math.max(1, Number(values.numberDigits) || 6));
  return {
    quotePrefix: values.quotePrefix,
    invoicePrefix: values.invoicePrefix,
    nextQuoteNumber: values.nextQuoteNumber,
    nextInvoiceNumber: values.nextInvoiceNumber,
    numberIncludeYear: values.numberIncludeYear,
    numberSeparator: separator,
    numberDigits: String(digits),
    invoiceTitle: values.invoiceTitle,
  };
}

export default function NumberingSettingsScreen() {
  const styles = useStyles();
  const colors = useColors();
  const { activeCompany } = useTenant();
  const { data, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();
  const { showError, showSuccess } = useToast();

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<NumberingFormValues>({
    resolver: zodResolver(numberingSchema),
    defaultValues: pickFormValues(createDefaultSettingsFormValues()),
  });

  useEffect(() => {
    if (data) {
      reset(pickFormValues(data));
    }
  }, [data, reset]);

  const watched = useWatch({ control });
  const format = {
    includeYear: watched.numberIncludeYear ?? true,
    separator: watched.numberSeparator ?? '-',
    digits: Number(watched.numberDigits) || 6,
  };
  const invoicePreview = formatDocumentNumber(watched.invoicePrefix, watched.nextInvoiceNumber || 1, format);
  const quotePreview = formatDocumentNumber(watched.quotePrefix, watched.nextQuoteNumber || 1, format);
  const activeTitle = watched.invoiceTitle?.trim() || 'Facture';

  async function onSubmit(values: NumberingFormValues) {
    if (!data) {
      return;
    }

    try {
      await updateSettings.mutateAsync({
        ...data,
        ...values,
        quotePrefix: values.quotePrefix.trim(),
        invoicePrefix: values.invoicePrefix.trim(),
        invoiceTitle: values.invoiceTitle.trim(),
      });
      showSuccess('Numérotation enregistrée.');
      reset(values);
    } catch {
      showError('Impossible d’enregistrer la numérotation.');
    }
  }

  if (isLoading) {
    return (
      <SettingsScreenFrame scrollable={false} title="Numérotation">
        <LoadingView message="Chargement..." />
      </SettingsScreenFrame>
    );
  }

  const digitsOnly = (value: string) => value.replace(/\D/g, '').slice(0, 9);

  return (
    <SettingsScreenFrame
      footer={
        <Button
          disabled={!isDirty}
          loading={isSubmitting || updateSettings.isPending}
          onPress={handleSubmit(onSubmit)}
          title="Enregistrer"
        />
      }
      title="Numérotation">
      <View style={styles.content}>
        <Text style={styles.intro}>
          Ces réglages ne concernent que {activeCompany?.name?.trim() || 'cette entreprise'}. Chaque
          entreprise de votre compte a ses propres préfixes et sa propre suite de numéros.
        </Text>

        <View style={styles.preview} accessibilityLiveRegion="polite">
          <Text style={styles.previewLabel}>Prochaine facture</Text>
          <Text selectable style={styles.previewValue}>
            {invoicePreview}
          </Text>
          <Text style={[styles.previewLabel, styles.previewSpacer]}>Prochain devis</Text>
          <Text selectable style={styles.previewValue}>
            {quotePreview}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Factures</Text>
        <Controller
          control={control}
          name="invoicePrefix"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextField
              autoCapitalize="characters"
              autoCorrect={false}
              error={errors.invoicePrefix?.message}
              hint="Vide : pas de préfixe."
              label="Préfixe des factures"
              maxLength={20}
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder="FAC"
              value={value}
            />
          )}
        />
        <Controller
          control={control}
          name="nextInvoiceNumber"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextField
              error={errors.nextInvoiceNumber?.message}
              hint="Un numéro déjà utilisé est sauté automatiquement."
              keyboardType="number-pad"
              label="Prochain numéro de facture"
              onBlur={onBlur}
              onChangeText={(text) => onChange(digitsOnly(text))}
              placeholder="1"
              value={value}
            />
          )}
        />

        <Text style={styles.sectionTitle}>Devis</Text>
        <Controller
          control={control}
          name="quotePrefix"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextField
              autoCapitalize="characters"
              autoCorrect={false}
              error={errors.quotePrefix?.message}
              label="Préfixe des devis"
              maxLength={20}
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder="DEV"
              value={value}
            />
          )}
        />
        <Controller
          control={control}
          name="nextQuoteNumber"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextField
              error={errors.nextQuoteNumber?.message}
              keyboardType="number-pad"
              label="Prochain numéro de devis"
              onBlur={onBlur}
              onChangeText={(text) => onChange(digitsOnly(text))}
              placeholder="1"
              value={value}
            />
          )}
        />

        <Text style={styles.sectionTitle}>Format du numéro</Text>
        <Controller
          control={control}
          name="numberIncludeYear"
          render={({ field: { onChange, value } }) => (
            <View style={styles.switchRow}>
              <View style={styles.switchTextBlock}>
                <Text style={styles.switchText}>Année dans le numéro</Text>
                <Text style={styles.hint}>{value ? 'FAC-2026-000001' : 'FAC-000001'}</Text>
              </View>
              <Switch
                accessibilityLabel="Année dans le numéro"
                onValueChange={onChange}
                trackColor={{ true: colors.primary }}
                value={value}
              />
            </View>
          )}
        />
        <View style={styles.group}>
          <Text style={styles.label}>Séparateur</Text>
          <Controller
            control={control}
            name="numberSeparator"
            render={({ field: { value } }) => (
              <FilterChipBar
                onChange={(next) => setValue('numberSeparator', next, { shouldDirty: true })}
                options={SEPARATOR_OPTIONS}
                value={value}
              />
            )}
          />
        </View>
        <View style={styles.group}>
          <Text style={styles.label}>Nombre de chiffres</Text>
          <Controller
            control={control}
            name="numberDigits"
            render={({ field: { value } }) => (
              <FilterChipBar
                onChange={(next) => setValue('numberDigits', next, { shouldDirty: true })}
                options={DIGIT_OPTIONS}
                value={value}
              />
            )}
          />
        </View>

        <Text style={styles.sectionTitle}>Nom des factures</Text>
        <Controller
          control={control}
          name="invoiceTitle"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextField
              error={errors.invoiceTitle?.message}
              hint="Titre en haut des nouvelles factures de cette entreprise. Il reste modifiable sur chaque facture."
              label="Titre des factures"
              maxLength={60}
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder="Facture"
              value={value}
            />
          )}
        />
        <FilterChipBar
          onChange={(next) =>
            setValue('invoiceTitle', next === 'Facture' ? '' : next, { shouldDirty: true })
          }
          options={INVOICE_TITLE_SUGGESTIONS.map((title) => ({ value: title, label: title }))}
          value={activeTitle}
        />
      </View>
    </SettingsScreenFrame>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
    content: {
      gap: spacing.lg,
    },
    intro: {
      ...typography.footnote,
      color: colors.textSecondary,
    },
    preview: {
      borderRadius: radius.lg,
      backgroundColor: colors.primarySubtle,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
    },
    previewLabel: {
      ...typography.caption1,
      color: colors.textSecondary,
    },
    previewSpacer: {
      marginTop: spacing.sm,
    },
    previewValue: {
      ...typography.headline,
      color: colors.text,
      fontVariant: ['tabular-nums' as const],
    },
    sectionTitle: {
      ...typography.headline,
      color: colors.text,
      marginTop: spacing.sm,
    },
    group: {
      gap: spacing.sm,
    },
    label: {
      ...typography.subheadlineMedium,
      color: colors.textSecondary,
    },
    hint: {
      ...typography.caption1,
      color: colors.textTertiary,
    },
    switchRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      gap: spacing.md,
    },
    switchTextBlock: {
      flex: 1,
      gap: 2,
    },
    switchText: {
      ...typography.subheadline,
      color: colors.text,
    },
  }));
}
