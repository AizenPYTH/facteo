import { useMemo, useState } from 'react';
import { FlatList, Modal, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { FilterChipBar } from '@/components/ui/filter-chip';
import { ListRow, ListRowSeparator } from '@/components/ui/list-row';
import { ModalHeader } from '@/components/ui/navigation-header';
import { SearchField } from '@/components/ui/search-field';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { useCatalogItems } from '@/hooks/use-catalog';
import { useThemedStyles } from '@/hooks/use-colors';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { formatPriceHT, formatVatRate } from '@/lib/format/currency';
import type { ProductRow } from '@/types/database';

type CatalogType = 'product' | 'service';

const TYPE_OPTIONS = [
  { value: 'product' as const, label: 'Produits' },
  { value: 'service' as const, label: 'Prestations' },
];

type CatalogPickerModalProps = {
  visible: boolean;
  onClose: () => void;
  /** Éléments cochés, produits et prestations confondus. */
  onSelect: (items: ProductRow[]) => void;
};

/**
 * Ajout de lignes depuis le catalogue : on choisit Produits ou Prestations,
 * on coche ce qu'on veut (la sélection survit au changement d'onglet), puis on
 * ajoute tout d'un coup.
 */
export function CatalogPickerModal({ visible, onClose, onSelect }: CatalogPickerModalProps) {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const [type, setType] = useState<CatalogType>('product');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const query = useCatalogItems(type, debouncedSearch);
  const items = useMemo(() => query.data ?? [], [query.data]);
  const [selected, setSelected] = useState<Map<string, ProductRow>>(new Map());

  function close() {
    setSelected(new Map());
    setSearch('');
    onClose();
  }

  function toggle(item: ProductRow) {
    setSelected((previous) => {
      const next = new Map(previous);
      if (next.has(item.id)) {
        next.delete(item.id);
      } else {
        next.set(item.id, item);
      }
      return next;
    });
  }

  const isService = type === 'service';

  return (
    <Modal animationType="slide" onRequestClose={close} presentationStyle="pageSheet" visible={visible}>
      <View style={styles.root}>
        <ModalHeader onClose={close} title="Ajouter depuis le catalogue" />
        <View style={styles.toolbar}>
          <FilterChipBar onChange={setType} options={TYPE_OPTIONS} value={type} />
          <SearchField
            accessibilityLabel="Rechercher dans le catalogue"
            onChangeText={setSearch}
            placeholder="Désignation, référence…"
            value={search}
          />
        </View>

        <FlatList
          contentContainerStyle={items.length === 0 ? styles.emptyContent : styles.list}
          data={items}
          keyboardShouldPersistTaps="handled"
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            query.isLoading ? null : (
              <EmptyState
                description={
                  debouncedSearch.trim()
                    ? 'Essayez une autre désignation ou référence.'
                    : `Ajoutez vos ${isService ? 'prestations' : 'produits'} depuis le menu Catalogue.`
                }
                icon={
                  isService
                    ? { ios: 'wrench.and.screwdriver', android: 'handyman', web: 'handyman' }
                    : { ios: 'cube', android: 'inventory_2', web: 'inventory_2' }
                }
                title={isService ? 'Aucune prestation' : 'Aucun produit'}
              />
            )
          }
          renderItem={({ item, index }) => {
            const checked = selected.has(item.id);
            return (
              <View>
                {index > 0 ? <ListRowSeparator /> : null}
                <ListRow
                  accessibilityHint={checked ? 'Retirer de la sélection' : 'Ajouter à la sélection'}
                  icon={checked ? 'checkmark.circle.fill' : 'circle'}
                  onPress={() => toggle(item)}
                  showChevron={false}
                  subtitle={[item.brand, item.reference, item.unit].filter(Boolean).join(' · ') || undefined}
                  title={item.name}
                  trailing={
                    <View style={styles.priceBlock}>
                      <Text numberOfLines={1} style={styles.price}>
                        {formatPriceHT(item.unit_price)}
                      </Text>
                      <Text numberOfLines={1} style={styles.vat}>
                        {`TVA ${formatVatRate(item.vat_rate)}`}
                      </Text>
                    </View>
                  }
                />
              </View>
            );
          }}
          showsVerticalScrollIndicator={false}
        />

        <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
          <Button
            disabled={selected.size === 0}
            onPress={() => {
              onSelect([...selected.values()]);
              close();
            }}
            title={selected.size > 0 ? `Ajouter la sélection (${selected.size})` : 'Ajouter la sélection'}
          />
        </View>
      </View>
    </Modal>
  );
}

const useStyles = () =>
  useThemedStyles((colors) => ({
    root: {
      flex: 1,
      backgroundColor: colors.backgroundGrouped,
    },
    toolbar: {
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    list: {
      paddingBottom: spacing.lg,
    },
    emptyContent: {
      flexGrow: 1,
      justifyContent: 'center',
      padding: spacing.lg,
    },
    priceBlock: {
      alignItems: 'flex-end',
    },
    price: {
      ...typography.subheadlineMedium,
      color: colors.text,
    },
    vat: {
      ...typography.caption1,
      color: colors.textSecondary,
    },
    footer: {
      paddingHorizontal: spacing.md,
      paddingTop: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.background,
    },
  }));
