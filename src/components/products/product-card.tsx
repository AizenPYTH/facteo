import { StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { colors } from '@/constants/theme/colors';
import { spacing } from '@/constants/theme/spacing';
import { formatPriceHT, formatVatRate } from '@/lib/format/currency';
import type { Product } from '@/types/product';

import { ProductField } from './product-field';

export type ProductCardProps = {
  product: Product;
  style?: ViewStyle;
  testID?: string;
};

export function ProductCard({ product, style, testID }: ProductCardProps) {
  return (
    <View style={[styles.wrapper, style]} testID={testID}>
      <View style={styles.card}>
        <View style={styles.header}>
          <ProductField emphasize label="Nom" value={product.name} />
        </View>

        <View style={styles.fields}>
          <ProductField label="Prix HT" value={formatPriceHT(product.unitPrice)} />
          <ProductField label="TVA" value={formatVatRate(product.vatRate)} />
          <ProductField label="Unité" value={product.unit} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.surface,
  },
  card: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  fields: {
    gap: spacing.sm,
  },
});
