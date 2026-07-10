import { SymbolView } from 'expo-symbols';
import { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { colors } from '@/constants/theme/colors';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { formatPriceHT, formatVatRate } from '@/lib/format/currency';
import type { Product } from '@/types/product';

type ProductPickerModalProps = {
  visible: boolean;
  products: Product[];
  onClose: () => void;
  onSelect: (product: Product) => void;
};

export function ProductPickerModal({
  visible,
  products,
  onClose,
  onSelect,
}: ProductPickerModalProps) {
  const [search, setSearch] = useState('');

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) {
      return products;
    }

    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(term) ||
        product.unit.toLowerCase().includes(term) ||
        (product.description?.toLowerCase().includes(term) ?? false),
    );
  }, [products, search]);

  function handleClose() {
    setSearch('');
    onClose();
  }

  function handleSelect(product: Product) {
    setSearch('');
    onSelect(product);
  }

  return (
    <Modal animationType="slide" onRequestClose={handleClose} visible={visible}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Sélectionner un produit</Text>
          <Pressable accessibilityRole="button" hitSlop={8} onPress={handleClose}>
            <SymbolView
              name={{ ios: 'xmark.circle.fill', android: 'close', web: 'close' }}
              size={24}
              tintColor={colors.iconTertiary}
              type="hierarchical"
            />
          </Pressable>
        </View>

        <View style={styles.searchWrap}>
          <SymbolView
            name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }}
            size={18}
            tintColor={colors.iconTertiary}
            type="hierarchical"
          />
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            onChangeText={setSearch}
            placeholder="Rechercher un produit..."
            placeholderTextColor={colors.textPlaceholder}
            style={styles.searchInput}
            value={search}
          />
        </View>

        <FlatList
          contentContainerStyle={styles.listContent}
          data={filteredProducts}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Aucun produit disponible.</Text>
          }
          renderItem={({ item }) => (
            <Pressable
              accessibilityRole="button"
              onPress={() => handleSelect(item)}
              style={({ pressed }) => [styles.productRow, pressed && styles.pressed]}>
              <View style={styles.productInfo}>
                <Text style={styles.productName}>{item.name}</Text>
                <Text style={styles.productMeta}>
                  {formatPriceHT(item.unitPrice)} · {formatVatRate(item.vatRate)} · {item.unit}
                </Text>
              </View>
              <SymbolView
                name={{ ios: 'plus.circle.fill', android: 'add_circle', web: 'add_circle' }}
                size={22}
                tintColor={colors.primary}
                type="hierarchical"
              />
            </Pressable>
          )}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundGrouped,
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.screenPaddingHorizontal,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.title3,
    color: colors.text,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.input,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.inputPadding,
    marginBottom: spacing.md,
  },
  searchInput: {
    ...typography.body,
    flex: 1,
    color: colors.text,
    padding: 0,
    margin: 0,
  },
  listContent: {
    paddingBottom: spacing.xl,
    gap: spacing.sm,
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
