import { SymbolView } from 'expo-symbols';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { TextField } from '@/components/ui/text-field';
import { colors } from '@/constants/theme/colors';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { mapQuoteLineValueToTotals } from '@/lib/quotes/mappers';
import { formatPriceHT } from '@/lib/format/currency';
import type { Product } from '@/types/product';
import type { QuoteLineValue } from '@/types/quote';
import { createQuoteLineFromProduct } from '@/types/quote';

import { ProductPickerModal } from './product-picker-modal';

export type QuoteLineProps = {
  index: number;
  value: QuoteLineValue;
  products: Product[];
  onChange: (value: QuoteLineValue) => void;
  onRemove?: () => void;
};

export function QuoteLine({ index, value, products, onChange, onRemove }: QuoteLineProps) {
  const [pickerVisible, setPickerVisible] = useState(false);

  const lineTotals = useMemo(() => mapQuoteLineValueToTotals(value), [value]);

  const selectedProduct = products.find((product) => product.id === value.productId);
  const productLabel = selectedProduct?.name ?? 'Sélectionner un produit';

  function updateField<K extends keyof QuoteLineValue>(field: K, fieldValue: QuoteLineValue[K]) {
    onChange({ ...value, [field]: fieldValue });
  }

  function handleProductSelect(product: Product) {
    onChange(createQuoteLineFromProduct(product));
    setPickerVisible(false);
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.lineTitle}>Ligne {index + 1}</Text>
        {onRemove ? (
          <Pressable accessibilityRole="button" hitSlop={8} onPress={onRemove}>
            <SymbolView
              name={{ ios: 'trash', android: 'delete', web: 'delete' }}
              size={18}
              tintColor={colors.error}
              type="hierarchical"
            />
          </Pressable>
        ) : null}
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={() => setPickerVisible(true)}
        style={({ pressed }) => [styles.productButton, pressed && styles.pressed]}>
        <Text style={styles.productButtonLabel}>Produit</Text>
        <View style={styles.productButtonValue}>
          <Text numberOfLines={1} style={styles.productButtonText}>
            {productLabel}
          </Text>
          <SymbolView
            name={{ ios: 'chevron.down', android: 'expand_more', web: 'expand_more' }}
            size={16}
            tintColor={colors.iconTertiary}
            type="hierarchical"
          />
        </View>
      </Pressable>

      <TextField
        label="Description"
        multiline
        numberOfLines={2}
        onChangeText={(text) => updateField('description', text)}
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
            label="Unité"
            onChangeText={(text) => updateField('unit', text)}
            value={value.unit}
          />
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.halfField}>
          <TextField
            keyboardType="decimal-pad"
            label="Prix HT"
            onChangeText={(text) => updateField('unitPrice', text)}
            value={value.unitPrice}
          />
        </View>
        <View style={styles.halfField}>
          <TextField
            keyboardType="decimal-pad"
            label="TVA (%)"
            onChangeText={(text) => updateField('vatRate', text)}
            value={value.vatRate}
          />
        </View>
      </View>

      <View style={styles.totals}>
        <Text style={styles.totalsLabel}>
          Ligne : {formatPriceHT(lineTotals.lineTotalHt)} HT ·{' '}
          {formatPriceHT(lineTotals.lineTotalTtc)} TTC
        </Text>
      </View>

      <ProductPickerModal
        onClose={() => setPickerVisible(false)}
        onSelect={handleProductSelect}
        products={products}
        visible={pickerVisible}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
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
  productButton: {
    gap: spacing.xs,
  },
  pressed: {
    opacity: 0.8,
  },
  productButtonLabel: {
    ...typography.footnoteMedium,
    color: colors.textSecondary,
  },
  productButtonValue: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: radius.input,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.inputPadding,
  },
  productButtonText: {
    ...typography.body,
    color: colors.text,
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
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
});
