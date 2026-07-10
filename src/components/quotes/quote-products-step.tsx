import { SymbolView } from 'expo-symbols';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { colors } from '@/constants/theme/colors';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useInfiniteProducts } from '@/hooks/use-products';
import { formatPriceHT, formatVatRate } from '@/lib/format/currency';
import type { Product } from '@/types/product';
import type { QuoteLineValue } from '@/types/quote';
import { createQuoteLineFromProduct } from '@/types/quote';

import { ProductSearchBar } from '@/components/products/product-search-bar';

type QuoteProductsStepProps = {
  lines: QuoteLineValue[];
  onAddLine: (line: QuoteLineValue) => void;
};

export function QuoteProductsStep({ lines, onAddLine }: QuoteProductsStepProps) {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const { products, isLoading } = useInfiniteProducts(debouncedSearch);

  const addedProductIds = useMemo(
    () => new Set(lines.map((line) => line.productId).filter(Boolean)),
    [lines],
  );

  function handleAddProduct(product: Product) {
    onAddLine(createQuoteLineFromProduct(product));
  }

  if (isLoading && products.length === 0) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={styles.loadingText}>Chargement des produits...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.description}>
        Ajoutez des produits ou services au devis. ({lines.length} ligne
        {lines.length > 1 ? 's' : ''})
      </Text>

      <ProductSearchBar onChangeText={setSearch} value={search} />

      <FlatList
        contentContainerStyle={styles.listContent}
        data={products}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            Aucun produit trouvé. Ajoutez un produit d'abord.
          </Text>
        }
        renderItem={({ item }) => {
          const isAdded = addedProductIds.has(item.id);

          return (
            <Pressable
              accessibilityRole="button"
              disabled={isAdded}
              onPress={() => handleAddProduct(item)}
              style={({ pressed }) => [
                styles.productRow,
                isAdded && styles.productRowAdded,
                pressed && !isAdded && styles.pressed,
              ]}>
              <View style={styles.productInfo}>
                <Text style={styles.productName}>{item.name}</Text>
                <Text style={styles.productMeta}>
                  {formatPriceHT(item.unitPrice)} · {formatVatRate(item.vatRate)} · {item.unit}
                </Text>
              </View>
              <SymbolView
                name={
                  isAdded
                    ? { ios: 'checkmark.circle.fill', android: 'check_circle', web: 'check_circle' }
                    : { ios: 'plus.circle.fill', android: 'add_circle', web: 'add_circle' }
                }
                size={22}
                tintColor={isAdded ? colors.success : colors.primary}
                type="hierarchical"
              />
            </Pressable>
          );
        }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: spacing.md,
  },
  description: {
    ...typography.subheadline,
    color: colors.textSecondary,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  loadingText: {
    ...typography.subheadline,
    color: colors.textSecondary,
  },
  listContent: {
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  productRowAdded: {
    opacity: 0.7,
  },
  pressed: {
    backgroundColor: colors.backgroundSecondary,
  },
  productInfo: {
    flex: 1,
    gap: 2,
  },
  productName: {
    ...typography.bodyMedium,
    color: colors.text,
  },
  productMeta: {
    ...typography.footnote,
    color: colors.textSecondary,
  },
  emptyText: {
    ...typography.subheadline,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },
});
