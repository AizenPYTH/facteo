import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { z } from 'zod';

import { SettingsScreenHeader } from '@/components/settings';
import { Button } from '@/components/ui/button';
import { LoadingView } from '@/components/ui/loading-view';
import { TextField } from '@/components/ui/text-field';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { spacing } from '@/constants/theme/spacing';
import { useSettings, useUpdateSettings } from '@/hooks/use-settings';
import { useToast } from '@/providers/toast-provider';
import { createDefaultSettingsFormValues } from '@/types/settings';

const numberingSchema = z.object({
  quotePrefix: z.string().trim().min(1, 'Le préfixe devis est requis.'),
  invoicePrefix: z.string().trim().min(1, 'Le préfixe facture est requis.'),
  nextQuoteNumber: z
    .string()
    .trim()
    .regex(/^\d+$/, 'Numéro invalide.')
    .refine((value) => Number(value) > 0, 'Le numéro doit être supérieur à 0.'),
  nextInvoiceNumber: z
    .string()
    .trim()
    .regex(/^\d+$/, 'Numéro invalide.')
    .refine((value) => Number(value) > 0, 'Le numéro doit être supérieur à 0.'),
});

type NumberingFormValues = z.infer<typeof numberingSchema>;

export default function NumberingSettingsScreen() {
  const styles = useStyles();
  const colors = useColors();
  const { data, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();
  const { showError, showSuccess } = useToast();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<NumberingFormValues>({
    resolver: zodResolver(numberingSchema),
    defaultValues: {
      quotePrefix: createDefaultSettingsFormValues().quotePrefix,
      invoicePrefix: createDefaultSettingsFormValues().invoicePrefix,
      nextQuoteNumber: createDefaultSettingsFormValues().nextQuoteNumber,
      nextInvoiceNumber: createDefaultSettingsFormValues().nextInvoiceNumber,
    },
  });

  useEffect(() => {
    if (data) {
      reset({
        quotePrefix: data.quotePrefix,
        invoicePrefix: data.invoicePrefix,
        nextQuoteNumber: data.nextQuoteNumber,
        nextInvoiceNumber: data.nextInvoiceNumber,
      });
    }
  }, [data, reset]);

  async function onSubmit(values: NumberingFormValues) {
    if (!data) {
      return;
    }

    try {
      await updateSettings.mutateAsync({
        ...data,
        ...values,
      });
      showSuccess('Numérotation enregistrée.');
      reset(values);
    } catch {
      showError('Impossible d’enregistrer la numérotation.');
    }
  }

  if (isLoading) {
    return (
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <LoadingView message="Chargement..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}>
        <SettingsScreenHeader title="Numérotation" />
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <Controller
            control={control}
            name="quotePrefix"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextField
                autoCapitalize="characters"
                error={errors.quotePrefix?.message}
                label="Préfixe devis"
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
                label="Prochain numéro devis"
                onBlur={onBlur}
                onChangeText={onChange}
                placeholder="1"
                value={value}
              />
            )}
          />
          <Controller
            control={control}
            name="invoicePrefix"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextField
                autoCapitalize="characters"
                error={errors.invoicePrefix?.message}
                label="Préfixe facture"
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
                keyboardType="number-pad"
                label="Prochain numéro facture"
                onBlur={onBlur}
                onChangeText={onChange}
                placeholder="1"
                value={value}
              />
            )}
          />

          <View style={styles.actions}>
            <Button
              disabled={!isDirty}
              loading={isSubmitting || updateSettings.isPending}
              onPress={handleSubmit(onSubmit)}
              title="Enregistrer"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
  safeArea: {
    flex: 1,
    backgroundColor: colors.backgroundGrouped,
  },
  flex: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.screenPaddingHorizontal,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  actions: {
    marginTop: spacing.sm,
  },
}));
}
