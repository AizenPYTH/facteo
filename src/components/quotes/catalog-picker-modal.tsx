import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, TextInput, View } from 'react-native';

import {
  ComposerIcon,
  ComposerSheet,
  PrimaryButton,
  SearchTrack,
  SegmentedControl,
} from '@/components/composer/primitives';
import { EmptyState } from '@/components/ui/empty-state';
import {
  composerRadius,
  tabularNums,
  useComposerColors,
  useComposerStyles,
  type ComposerColors,
} from '@/constants/theme/composer';
import { useCatalogItems } from '@/hooks/use-catalog';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { formatPriceHT, formatVatRate } from '@/lib/format/currency';
import { triggerSelectionHaptic } from '@/lib/haptics';
import type { ProductRow } from '@/types/database';
import { createEmptyQuoteLine, formatDecimalForInput, type QuoteLineValue } from '@/types/quote';

type CatalogType = 'product' | 'service';

const TYPE_OPTIONS = [
  { value: 'service' as const, label: 'Prestations' },
  { value: 'product' as const, label: 'Produits' },
];

type CatalogPickerModalProps = {
  visible: boolean;
  onClose: () => void;
  /** Éléments cochés, produits et prestations confondus. */
  onSelect: (items: ProductRow[]) => void;
};

/** Ligne de document créée depuis un élément du catalogue. */
export function mapCatalogItemToLine(item: ProductRow): QuoteLineValue {
  return {
    ...createEmptyQuoteLine(),
    productId: item.id,
    title: item.name,
    description: item.description ?? '',
    unit: item.unit || 'unité',
    unitPrice: formatDecimalForInput(item.unit_price),
    vatRate: formatDecimalForInput(item.vat_rate),
  };
}

/**
 * Ajout de lignes depuis le catalogue : on choisit Prestations ou Produits,
 * on coche ce qu'on veut (la sélection survit au changement d'onglet), puis on
 * ajoute tout d'un coup.
 */
export function CatalogPickerModal({ visible, onClose, onSelect }: CatalogPickerModalProps) {
  const styles = useComposerStyles(catalogStyles);
  const colors = useComposerColors();
  const [type, setType] = useState<CatalogType>('service');
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
    void triggerSelectionHaptic();
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
  const count = selected.size;
  const ctaLabel =
    count === 0
      ? 'Ajouter la sélection'
      : count === 1
        ? 'Ajouter 1 élément'
        : `Ajouter ${count} éléments`;

  return (
    <ComposerSheet
      footer={
        <PrimaryButton
          disabled={count === 0}
          label={ctaLabel}
          onPress={() => {
            onSelect([...selected.values()]);
            close();
          }}
        />
      }
      onClose={close}
      title="Catalogue"
      visible={visible}>
      <View style={styles.toolbar}>
        <SegmentedControl height={32} onChange={setType} options={TYPE_OPTIONS} value={type} />
        <SearchTrack>
          <TextInput
            accessibilityLabel="Rechercher dans le catalogue"
            autoCapitalize="none"
            autoCorrect={false}
            onChangeText={setSearch}
            placeholder="Rechercher"
            placeholderTextColor={colors.ink3}
            returnKeyType="search"
            style={styles.searchInput}
            value={search}
          />
        </SearchTrack>
      </View>

      <FlatList
        contentContainerStyle={items.length === 0 ? styles.emptyContent : styles.list}
        data={items}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          query.isLoading ? (
            <ActivityIndicator color={colors.accent} />
          ) : (
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
          const meta = [
            `${formatPriceHT(item.unit_price)} / ${item.unit || 'unité'}`,
            `TVA ${formatVatRate(item.vat_rate)}`,
            item.reference,
          ]
            .filter(Boolean)
            .join(' · ');

          return (
            <Pressable
              accessibilityHint={checked ? 'Retirer de la sélection' : 'Ajouter à la sélection'}
              accessibilityLabel={`${item.name}, ${meta}`}
              accessibilityRole="checkbox"
              accessibilityState={{ checked }}
              onPress={() => toggle(item)}
              style={({ pressed }) => [
                styles.row,
                index === 0 && styles.rowFirst,
                index === items.length - 1 && styles.rowLast,
                index > 0 && styles.rowSeparated,
                checked && styles.rowChecked,
                pressed && styles.rowPressed,
              ]}>
              <View style={[styles.check, checked && styles.checkOn]}>
                {checked ? (
                  <ComposerIcon
                    color={colors.onAccent}
                    name={{ ios: 'checkmark', android: 'check', web: 'check' }}
                    size={12}
                  />
                ) : null}
              </View>
              <View style={styles.rowText}>
                <Text maxFontSizeMultiplier={1.4} numberOfLines={2} style={styles.rowTitle}>
                  {item.name}
                </Text>
                <Text maxFontSizeMultiplier={1.4} numberOfLines={1} style={styles.rowMeta}>
                  {meta}
                </Text>
              </View>
            </Pressable>
          );
        }}
        showsVerticalScrollIndicator={false}
      />
    </ComposerSheet>
  );
}

function catalogStyles(colors: ComposerColors) {
  return {
    toolbar: {
      gap: 10,
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 12,
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
      color: colors.ink,
      paddingVertical: 0,
    },
    list: {
      paddingHorizontal: 16,
      paddingBottom: 24,
    },
    emptyContent: {
      flexGrow: 1,
      justifyContent: 'center' as const,
      padding: 24,
    },
    row: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 12,
      minHeight: 56,
      paddingHorizontal: 16,
      paddingVertical: 11,
      backgroundColor: colors.surface,
    },
    rowFirst: {
      borderTopLeftRadius: composerRadius.card,
      borderTopRightRadius: composerRadius.card,
    },
    rowLast: {
      borderBottomLeftRadius: composerRadius.card,
      borderBottomRightRadius: composerRadius.card,
    },
    rowSeparated: {
      borderTopWidth: 1,
      borderTopColor: colors.line2,
    },
    rowChecked: {
      backgroundColor: colors.accentSoft,
    },
    rowPressed: {
      opacity: 0.7,
    },
    check: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: colors.line,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    checkOn: {
      borderColor: colors.accent,
      backgroundColor: colors.accent,
    },
    rowText: {
      flex: 1,
      minWidth: 0,
    },
    rowTitle: {
      fontSize: 15.5,
      fontWeight: '600' as const,
      color: colors.ink,
    },
    rowMeta: {
      ...tabularNums,
      fontSize: 13,
      color: colors.ink3,
      marginTop: 1,
    },
  };
}
