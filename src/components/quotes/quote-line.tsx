import { SymbolView } from 'expo-symbols';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { TextField } from '@/components/ui/text-field';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { formatPriceHT } from '@/lib/format/currency';
import { parseVatRateForTotals } from '@/lib/format/decimal';
import { mapLineValueToTotals } from '@/lib/quotes/mappers';
import type { QuoteLineValue } from '@/types/quote';

/** Taux en vigueur en France métropolitaine, proposés en raccourci. */
const VAT_RATE_SHORTCUTS = ['0', '2,1', '5,5', '10', '20'] as const;

export type QuoteLineProps = {
  index: number;
  value: QuoteLineValue;
  onChange: (value: QuoteLineValue) => void;
  onRemove?: () => void;
};

export function QuoteLine({ index, value, onChange, onRemove }: QuoteLineProps) {
  const styles = useStyles();
  const colors = useColors();
  const lineTotals = useMemo(() => mapLineValueToTotals(value), [value]);
  const activeVatRate = parseVatRateForTotals(value.vatRate);

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
            hitSlop={12}
            onPress={onRemove}>
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
        label="Titre de la prestation"
        onChangeText={(text) => updateField('title', text)}
        placeholder="Installation électrique"
        returnKeyType="next"
        value={value.title}
      />

      <TextField
        hint="Détaillez ce qui a réellement été réalisé (facultatif)."
        label="Description"
        multiline
        numberOfLines={3}
        onChangeText={(text) => updateField('description', text)}
        placeholder="Installation et raccordement de 6 prises dans le salon et la cuisine."
        value={value.description}
      />

      <View style={styles.row}>
        <View style={styles.halfField}>
          <TextField
            keyboardType="decimal-pad"
            label="Quantité"
            onChangeText={(text) => updateField('quantity', text)}
            placeholder="1"
            value={value.quantity}
          />
        </View>
        <View style={styles.halfField}>
          <TextField
            autoCapitalize="none"
            label="Unité"
            onChangeText={(text) => updateField('unit', text)}
            placeholder="prestation"
            value={value.unit}
          />
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.halfField}>
          <TextField
            keyboardType="decimal-pad"
            label="Prix unitaire HT (€)"
            onChangeText={(text) => updateField('unitPrice', text)}
            placeholder="450"
            value={value.unitPrice}
          />
        </View>
        <View style={styles.halfField}>
          <TextField
            hint="Vide = 0 %"
            keyboardType="decimal-pad"
            label="TVA (%)"
            onChangeText={(text) => updateField('vatRate', text)}
            placeholder="0"
            value={value.vatRate}
          />
        </View>
      </View>

      <View style={styles.vatShortcuts}>
        {VAT_RATE_SHORTCUTS.map((rate) => {
          const isActive =
            value.vatRate.trim() !== '' && parseVatRateForTotals(rate) === activeVatRate;

          return (
            <Pressable
              accessibilityLabel={`Appliquer une TVA de ${rate} %`}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              key={rate}
              onPress={() => updateField('vatRate', rate)}
              style={({ pressed }) => [
                styles.vatChip,
                isActive && styles.vatChipActive,
                pressed && styles.vatChipPressed,
              ]}>
              <Text style={[styles.vatChipLabel, isActive && styles.vatChipLabelActive]}>
                {rate} %
              </Text>
            </Pressable>
          );
        })}
      </View>

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
      gap: spacing.md,
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
    vatShortcuts: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.xs,
    },
    vatChip: {
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: radius.button,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      backgroundColor: colors.backgroundGrouped,
    },
    vatChipActive: {
      backgroundColor: colors.primarySubtle,
      borderColor: colors.primary,
    },
    vatChipPressed: {
      opacity: 0.7,
    },
    vatChipLabel: {
      ...typography.caption1,
      color: colors.textSecondary,
    },
    vatChipLabelActive: {
      color: colors.primary,
      fontWeight: '600',
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
