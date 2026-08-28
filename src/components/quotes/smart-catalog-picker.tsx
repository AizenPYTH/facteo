import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SymbolView } from 'expo-symbols';

import { Button } from '@/components/ui/button';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { type } from '@/constants/theme/type-roles';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useTenant } from '@/hooks/use-tenant';
import { formatPriceHT } from '@/lib/format/currency';
import { triggerHaptic } from '@/lib/haptics';
import { requireScope } from '@/lib/tenant/scope';
import { fetchSmartCatalog, type CatalogProduct } from '@/lib/supabase/smart-catalog';
import { useQuery } from '@tanstack/react-query';
import { createLocalLineId, formatDecimalForInput, type QuoteLineValue } from '@/types/quote';

type SmartCatalogPickerProps = {
  visible: boolean;
  onClose: () => void;
  onSelect: (line: QuoteLineValue) => void;
  defaultVatRate?: number;
};

export function SmartCatalogPicker({
  visible,
  onClose,
  onSelect,
  defaultVatRate = 20,
}: SmartCatalogPickerProps) {
  const styles = useStyles();
  const colors = useColors();
  const { scope } = useTenant();
  const [search, setSearch] = useState('');
  const debounced = useDebouncedValue(search, 200);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['smart-catalog', scope?.companyId ?? 'anonymous', debounced],
    queryFn: () => fetchSmartCatalog(requireScope(scope), debounced),
    enabled: visible && Boolean(scope?.companyId),
    staleTime: 30_000,
  });

  const rankedHint = useMemo(
    () =>
      products.some((product) => product.usageCount > 0)
        ? 'Classés par usage (les plus utilisés d’abord)'
        : 'Recherchez une prestation du catalogue',
    [products],
  );

  function handleSelect(product: CatalogProduct) {
    void triggerHaptic('selection');
    onSelect({
      id: createLocalLineId(),
      productId: product.id,
      description: product.name || product.description || 'Prestation',
      quantity: '1',
      unit: product.unit || 'unité',
      unitPrice: formatDecimalForInput(product.unitPrice),
      vatRate: formatDecimalForInput(product.vatRate || defaultVatRate),
      discountPercent: '0',
    });
    onClose();
    setSearch('');
  }

  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={visible}>
      <Pressable accessibilityRole="button" onPress={onClose} style={styles.overlay}>
        <Pressable onPress={(event) => event.stopPropagation()} style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Catalogue</Text>
            <Pressable accessibilityRole="button" hitSlop={8} onPress={onClose}>
              <SymbolView
                name={{ ios: 'xmark', android: 'close', web: 'close' }}
                size={20}
                tintColor={colors.iconSecondary}
                type="hierarchical"
              />
            </Pressable>
          </View>
          <Text style={styles.hint}>{rankedHint}</Text>
          <View style={styles.searchField}>
            <SymbolView
              name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }}
              size={16}
              tintColor={colors.iconTertiary}
              type="hierarchical"
            />
            <TextInput
              autoFocus
              onChangeText={setSearch}
              placeholder="Rechercher…"
              placeholderTextColor={colors.textTertiary}
              style={styles.input}
              value={search}
            />
          </View>

          {isLoading ? (
            <ActivityIndicator color={colors.primary} style={styles.loader} />
          ) : products.length === 0 ? (
            <Text style={styles.empty}>Aucune prestation trouvée.</Text>
          ) : (
            <FlatList
              data={products}
              keyExtractor={(item) => item.id}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => handleSelect(item)}
                  style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
                  <View style={styles.rowCopy}>
                    <Text numberOfLines={1} style={styles.rowTitle}>
                      {item.name}
                    </Text>
                    <Text numberOfLines={1} style={styles.rowMeta}>
                      {formatPriceHT(item.unitPrice)}
                      {item.usageCount > 0 ? ` · utilisé ${item.usageCount}×` : ''}
                    </Text>
                  </View>
                </Pressable>
              )}
              style={styles.list}
            />
          )}

          <Button onPress={onClose} title="Fermer" variant="ghost" />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.4)',
      justifyContent: 'flex-end',
    },
    sheet: {
      maxHeight: '80%',
      backgroundColor: colors.surface,
      borderTopLeftRadius: radius.card,
      borderTopRightRadius: radius.card,
      padding: spacing.lg,
      gap: spacing.md,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    title: {
      ...type.section,
      color: colors.text,
    },
    hint: {
      ...type.caption,
      color: colors.textSecondary,
    },
    searchField: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: radius.full,
      backgroundColor: colors.backgroundSecondary,
      minHeight: 44,
    },
    input: {
      flex: 1,
      ...type.body,
      color: colors.text,
      paddingVertical: spacing.sm,
    },
    list: {
      maxHeight: 320,
    },
    row: {
      paddingVertical: spacing.md,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.separator,
    },
    rowPressed: {
      backgroundColor: colors.backgroundSelected,
    },
    rowCopy: {
      gap: 2,
    },
    rowTitle: {
      ...type.cardTitle,
      color: colors.text,
    },
    rowMeta: {
      ...type.caption,
      color: colors.textSecondary,
    },
    loader: {
      marginVertical: spacing.lg,
    },
    empty: {
      ...type.secondary,
      color: colors.textSecondary,
      textAlign: 'center',
      paddingVertical: spacing.lg,
    },
  }));
}
