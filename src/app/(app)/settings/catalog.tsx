import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { InvoiceSearchBar } from '@/components/invoices/invoice-search-bar';
import { SettingsScreenFrame } from '@/components/web/desktop/settings-screen-frame';
import { LoadingView } from '@/components/ui/loading-view';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useCatalogItems } from '@/hooks/use-catalog';
import { useThemedStyles } from '@/hooks/use-colors';
import { formatPriceHT } from '@/lib/format/currency';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import type { ProductRow } from '@/types/database';

export default function CatalogSettingsScreen() {
  const styles = useStyles();
  const params = useLocalSearchParams<{ type?: string }>();
  const type = params.type === 'service' ? 'service' : 'product';
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const query = useCatalogItems(type, debouncedSearch);
  const items = useMemo(() => query.data ?? [], [query.data]);
  const title = type === 'service' ? 'Prestations' : 'Produits';

  return (
    <SettingsScreenFrame scrollable={false} title={title}>
      <View style={styles.toolbar}>
        <InvoiceSearchBar
          onChangeText={setSearch}
          placeholder="Désignation, référence…"
          value={search}
        />
        <View style={styles.chips}>
          <Pressable
            onPress={() => router.setParams({ type: 'product' })}
            style={[styles.chip, type === 'product' && styles.chipActive]}>
            <Text style={[styles.chipLabel, type === 'product' && styles.chipLabelActive]}>
              Produits
            </Text>
          </Pressable>
          <Pressable
            onPress={() => router.setParams({ type: 'service' })}
            style={[styles.chip, type === 'service' && styles.chipActive]}>
            <Text style={[styles.chipLabel, type === 'service' && styles.chipLabelActive]}>
              Prestations
            </Text>
          </Pressable>
        </View>
      </View>

      {query.isLoading ? (
        <LoadingView message="Chargement du catalogue..." />
      ) : (
        <FlatList
          contentContainerStyle={styles.list}
          data={items}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <Text style={styles.empty}>
              Aucun {type === 'service' ? 'prestation' : 'produit'}. Ajoutez-en depuis un devis ou
              une facture.
            </Text>
          }
          renderItem={({ item }) => <CatalogRow item={item} />}
        />
      )}
    </SettingsScreenFrame>
  );
}

function CatalogRow({ item }: { item: ProductRow }) {
  const styles = useStyles();

  return (
    <View style={styles.row}>
      <View style={styles.rowBody}>
        <Text numberOfLines={1} style={styles.name}>
          {item.name}
        </Text>
        <Text numberOfLines={1} style={styles.meta}>
          {[item.reference, item.unit].filter(Boolean).join(' · ')}
        </Text>
      </View>
      <Text style={styles.price}>{formatPriceHT(item.unit_price)}</Text>
    </View>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
    toolbar: {
      gap: spacing.md,
      marginBottom: spacing.md,
    },
    chips: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    chip: {
      borderRadius: radius.full,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    chipActive: {
      backgroundColor: colors.primarySubtle,
      borderColor: colors.primary,
    },
    chipLabel: {
      ...typography.subheadlineMedium,
      color: colors.textSecondary,
    },
    chipLabelActive: {
      color: colors.primary,
    },
    list: {
      gap: spacing.sm,
      paddingBottom: spacing.xl,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      backgroundColor: colors.surface,
      borderRadius: radius.card,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      padding: spacing.md,
    },
    rowBody: {
      flex: 1,
      gap: 2,
    },
    name: {
      ...typography.bodyMedium,
      color: colors.text,
    },
    meta: {
      ...typography.footnote,
      color: colors.textSecondary,
    },
    price: {
      ...typography.bodyMedium,
      color: colors.primary,
    },
    empty: {
      ...typography.subheadline,
      color: colors.textSecondary,
      textAlign: 'center',
      paddingVertical: spacing.xl,
    },
  }));
}
