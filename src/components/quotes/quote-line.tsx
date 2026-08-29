import { SymbolView } from 'expo-symbols';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { TextField } from '@/components/ui/text-field';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { components } from '@/constants/theme/design-system';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { formatPriceHT, formatSpokenEuros } from '@/lib/format/currency';
import { mapQuoteLineValueToTotals } from '@/lib/quotes/mappers';
import type { QuoteLineValue } from '@/types/quote';

export type QuoteLineProps = {
  index: number;
  value: QuoteLineValue;
  onChange: (value: QuoteLineValue) => void;
  onRemove?: () => void;
};

export function QuoteLine({ index, value, onChange, onRemove }: QuoteLineProps) {
  const styles = useStyles();
  const colors = useColors();
  const lineTotals = useMemo(() => mapQuoteLineValueToTotals(value), [value]);

  function updateField<K extends keyof QuoteLineValue>(field: K, fieldValue: QuoteLineValue[K]) {
    onChange({ ...value, [field]: fieldValue });
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.lineTitle}>Prestation {index + 1}</Text>
        {onRemove ? (
          <Pressable
            accessibilityLabel={`Supprimer la prestation ${index + 1}`}
            accessibilityRole="button"
            onPress={onRemove}
            style={({ pressed }) => [
              styles.removeButton,
              pressed ? styles.removeButtonPressed : null,
            ]}>
            <SymbolView
              name={{ ios: 'trash', android: 'delete', web: 'delete' }}
              size={20}
              tintColor={colors.error}
              type="hierarchical"
            />
          </Pressable>
        ) : null}
      </View>

      <TextField
        label="Description"
        multiline
        numberOfLines={2}
        onChangeText={(text) => updateField('description', text)}
        placeholder="Description de la prestation"
        textAlignVertical="top"
        value={value.description}
      />

      <View style={styles.chipsRow}>
        <View style={styles.chipField}>
          <TextField
            accessibilityLabel="Quantité de la prestation"
            keyboardType="decimal-pad"
            label="Quantité"
            onChangeText={(text) => updateField('quantity', text)}
            selectTextOnFocus
            style={styles.chipInput}
            value={value.quantity}
          />
        </View>
        <View style={styles.chipField}>
          <TextField
            accessibilityLabel="Prix unitaire hors taxes"
            keyboardType="decimal-pad"
            label="PU HT"
            onChangeText={(text) => updateField('unitPrice', text)}
            selectTextOnFocus
            style={styles.chipInput}
            value={value.unitPrice}
          />
        </View>
        <View style={styles.chipField}>
          <TextField
            accessibilityLabel="Taux de TVA en pourcentage"
            keyboardType="decimal-pad"
            label="TVA %"
            onChangeText={(text) => updateField('vatRate', text)}
            selectTextOnFocus
            style={styles.chipInput}
            value={value.vatRate}
          />
        </View>
        <View style={styles.chipField}>
          <TextField
            accessibilityLabel="Remise en pourcentage"
            keyboardType="decimal-pad"
            label="Remise %"
            onChangeText={(text) => updateField('discountPercent', text)}
            selectTextOnFocus
            style={styles.chipInput}
            value={value.discountPercent}
          />
        </View>
      </View>

      <View style={styles.totals}>
        <Text
          accessibilityLabel={`Prestation, ${formatSpokenEuros(lineTotals.lineTotalHt)} hors taxes, ${formatSpokenEuros(lineTotals.lineTotalTtc)} toutes taxes comprises`}
          style={styles.totalsLabel}>
          Prestation : {formatPriceHT(lineTotals.lineTotalHt)} HT ·{' '}
          {formatPriceHT(lineTotals.lineTotalTtc)} TTC
        </Text>
      </View>
    </View>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
  container: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lineTitle: {
    ...typography.headline,
    color: colors.text,
  },
  removeButton: {
    width: components.touchTarget,
    minHeight: components.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.buttonSmall,
  },
  removeButtonPressed: {
    backgroundColor: colors.errorSubtle,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chipField: {
    width: '48%',
    flexGrow: 1,
    paddingHorizontal: spacing.group,
    borderRadius: radius.filterChip,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSecondary,
  },
  chipInput: {
    ...typography.amount,
    color: colors.text,
  },
  totals: {
    paddingTop: spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.separator,
  },
  totalsLabel: {
    ...typography.footnote,
    color: colors.textSecondary,
  },
}));
}
