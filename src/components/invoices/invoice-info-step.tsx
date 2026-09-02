import { useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

import { TextField } from '@/components/ui/text-field';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import {
  addDaysFrenchDateInput,
  frenchDateInputToIso,
  todayFrenchDateInput,
} from '@/lib/format/date-input';
import { useSettings } from '@/hooks/use-settings';
import type { InvoiceInfoValues } from '@/types/invoice';

type InvoiceInfoStepProps = {
  value: InvoiceInfoValues;
  onChange: (value: InvoiceInfoValues) => void;
};

export function InvoiceInfoStep({ value, onChange }: InvoiceInfoStepProps) {
  const styles = useStyles();
  const colors = useColors();
  const { data: settings } = useSettings();
  const defaultsAppliedRef = useRef(Boolean(value.issuedAt));

  useEffect(() => {
    if (defaultsAppliedRef.current || value.issuedAt) {
      return;
    }

    const paymentDays = Number(settings?.paymentTermsDays ?? 30);

    defaultsAppliedRef.current = true;
    onChange({
      ...value,
      issuedAt: todayFrenchDateInput(),
      dueAt: addDaysFrenchDateInput(paymentDays),
      paymentTermsDays: String(paymentDays),
    });
  }, [onChange, settings, value]);

  function updateField<K extends keyof InvoiceInfoValues>(field: K, fieldValue: InvoiceInfoValues[K]) {
    onChange({ ...value, [field]: fieldValue });
  }

  function handlePaymentTermsChange(text: string) {
    const next = { ...value, paymentTermsDays: text };
    const days = Number(text);

    if (value.issuedAt && /^\d+$/.test(text) && days > 0) {
      const issuedIso = frenchDateInputToIso(value.issuedAt);

      if (issuedIso) {
        next.dueAt = addDaysFrenchDateInput(days, new Date(issuedIso));
      }
    }

    onChange(next);
  }

  function handleIssuedAtChange(text: string) {
    const next = { ...value, issuedAt: text };
    const days = Number(value.paymentTermsDays);

    if (/^\d+$/.test(value.paymentTermsDays) && days > 0) {
      const issuedIso = frenchDateInputToIso(text);

      if (issuedIso) {
        next.dueAt = addDaysFrenchDateInput(days, new Date(issuedIso));
      }
    }

    onChange(next);
  }

  return (
    <KeyboardAwareScrollView
      bottomOffset={24}
      contentContainerStyle={styles.container}
      keyboardDismissMode="on-drag"
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}>
      <Text style={styles.description}>
        Renseignez les dates et conditions de cette facture.
      </Text>

      <View style={styles.card}>
        <TextField
          label="Date d'émission"
          onChangeText={handleIssuedAtChange}
          placeholder="JJ/MM/AAAA"
          value={value.issuedAt}
        />
        <TextField
          label="Date d'échéance"
          onChangeText={(text) => updateField('dueAt', text)}
          placeholder="JJ/MM/AAAA"
          value={value.dueAt}
        />
        <TextField
          keyboardType="number-pad"
          label="Délai de paiement (jours)"
          onChangeText={handlePaymentTermsChange}
          placeholder="30"
          value={value.paymentTermsDays}
        />
      </View>

      <View style={styles.card}>
        <TextField
          label="Notes (visibles sur la facture)"
          multiline
          numberOfLines={4}
          onChangeText={(text) => updateField('notes', text)}
          placeholder="Conditions particulières, remarques client..."
          textAlignVertical="top"
          value={value.notes}
        />
      </View>
    </KeyboardAwareScrollView>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
  container: {
    gap: spacing.md,
    paddingBottom: spacing.lg,
  },
  description: {
    ...typography.subheadline,
    color: colors.textSecondary,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.md,
  },
}));
}
