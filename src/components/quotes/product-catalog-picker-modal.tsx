import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { ActivityIndicator, FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TextField } from '@/components/ui/text-field';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { formatPriceHT, formatVatRate } from '@/lib/format/currency';
import { searchProducts } from '@/lib/supabase/products';
import type { ProductRow } from '@/types/database';

type ProductCatalogPickerModalProps = {
  visible: boolean;
  onClose: () => void;
  onSelect: (product: ProductRow) => void;
};

/**
 * DESIGN §5.3 — Étape Prestations : entrée « Catalogue » exposée d'emblée,
 * recherche dans les produits déjà enregistrés (pas seulement par code-barres).
 */
export function ProductCatalogPickerModal({
  visible,
  onClose,
  onSelect,
}: ProductCatalogPickerModalProps) {
  const styles = useStyles();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, 250);

  const productsQuery = useQuery({
    queryKey: ['product-catalog-picker', debouncedQuery],
    queryFn: () => searchProducts(debouncedQuery),
    enabled: visible,
  });

  const products = productsQuery.data ?? [];

  return (
    <Modal animationType="slide" onRequestClose={onClose} visible={visible}>
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Catalogue</Text>
          <Pressable accessibilityRole="button" hitSlop={12} onPress={onClose}>
            <Text style={[styles.close, { color: colors.primary }]}>Fermer</Text>
          </Pressable>
        </View>

        <View style={styles.searchRow}>
          <TextField
            autoFocus
            onChangeText={setQuery}
            placeholder="Rechercher un produit ou une référence"
            value={query}
          />
        </View>

        {productsQuery.isLoading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : products.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              {debouncedQuery
                ? 'Aucun produit ne correspond à cette recherche.'
                : 'Aucun produit dans votre catalogue pour le moment.'}
            </Text>
          </View>
        ) : (
          <FlatList
            contentContainerStyle={styles.listContent}
            data={products}
            keyExtractor={(item) => item.id}
            keyboardDismissMode="on-drag"
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <Pressable
                accessibilityRole="button"
                onPress={() => onSelect(item)}
                style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
                <View style={styles.rowInfo}>
                  <Text style={styles.rowTitle}>{item.name}</Text>
                  <Text style={styles.rowMeta}>
                    {item.reference ? `Réf. ${item.reference} · ` : ''}
                    {formatVatRate(item.vat_rate)} TVA
                  </Text>
                </View>
                <Text style={styles.rowPrice}>{formatPriceHT(item.unit_price)}</Text>
              </Pressable>
            )}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </Modal>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    title: {
      ...typography.headline,
      color: colors.text,
    },
    close: {
      ...typography.subheadlineMedium,
    },
    searchRow: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.sm,
    },
    listContent: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.lg,
      gap: spacing.xs,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.md,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: 12,
      backgroundColor: colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    rowPressed: {
      backgroundColor: colors.surfaceSecondary,
    },
    rowInfo: {
      flex: 1,
      gap: 2,
    },
    rowTitle: {
      ...typography.subheadlineMedium,
      color: colors.text,
    },
    rowMeta: {
      ...typography.caption1,
      color: colors.textSecondary,
    },
    rowPrice: {
      ...typography.subheadlineMedium,
      color: colors.text,
    },
    loadingState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.lg,
    },
    emptyText: {
      ...typography.subheadline,
      color: colors.textSecondary,
      textAlign: 'center',
    },
  }));
}
