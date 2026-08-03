import { SymbolView } from 'expo-symbols';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { TextField } from '@/components/ui/text-field';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { radius } from '@/constants/theme/radius';
import { shadows } from '@/constants/theme/theme';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { formatPriceHT } from '@/lib/format/currency';
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
          <Pressable accessibilityRole="button" hitSlop={12} onPress={onRemove}>
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

      <View style={styles.row}>
        <View style={styles.halfField}>
          <TextField
            keyboardType="decimal-pad"
            label="Quantité"
            onChangeText={(text) => updateField('quantity', text)}
            value={value.quantity}
          />
        </View>
        <View style={styles.halfField}>
          <TextField
            keyboardType="decimal-pad"
            label="Prix HT"
            onChangeText={(text) => updateField('unitPrice', text)}
            value={value.unitPrice}
          />
        </View>
      </View>

      <TextField
        keyboardType="decimal-pad"
        label="TVA (%)"
        onChangeText={(text) => updateField('vatRate', text)}
        value={value.vatRate}
      />

      <View style={styles.totals}>
        <Text style={styles.totalsLabel}>
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
    ...shadows.sm,
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
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  halfField: {
    flex: 1,
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
