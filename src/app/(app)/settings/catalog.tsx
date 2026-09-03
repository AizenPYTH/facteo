import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Text, View } from 'react-native';

import {
  CatalogItemSheet,
  type CatalogItemValues,
} from '@/components/settings/catalog-item-sheet';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { FilterChipBar } from '@/components/ui/filter-chip';
import { ListRow, ListRowSeparator } from '@/components/ui/list-row';
import { SearchField } from '@/components/ui/search-field';
import { Skeleton } from '@/components/ui/skeleton';
import { SettingsScreenFrame } from '@/components/web/desktop/settings-screen-frame';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { useCatalogItems } from '@/hooks/use-catalog';
import { useCatalogMutations } from '@/hooks/use-catalog-mutations';
import { useThemedStyles } from '@/hooks/use-colors';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { formatPriceHT, formatVatRate } from '@/lib/format/currency';
import { useToast } from '@/providers/toast-provider';
import type { ProductRow } from '@/types/database';

const TYPE_OPTIONS = [
  { value: 'product' as const, label: 'Produits' },
  { value: 'service' as const, label: 'Prestations' },
];

/**
 * Catalogue produits et prestations.
 *
 * L'écran était en lecture seule — « Ajoutez-en depuis un devis ou une
 * facture ». Il porte désormais la création, l'édition et la suppression, et
 * affiche la TVA en plus du prix.
 */
export default function CatalogSettingsScreen() {
  const styles = useStyles();
  const params = useLocalSearchParams<{ type?: string }>();
  const type = params.type === 'service' ? 'service' : 'product';

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const query = useCatalogItems(type, debouncedSearch);
  const items = useMemo(() => query.data ?? [], [query.data]);

  const { create, update, remove } = useCatalogMutations(type);
  const { showError, showSuccess } = useToast();

  const [sheetVisible, setSheetVisible] = useState(false);
  const [editing, setEditing] = useState<ProductRow | null>(null);
  const [pendingDelete, setPendingDelete] = useState<ProductRow | null>(null);

  const isService = type === 'service';
  const title = isService ? 'Prestations' : 'Produits';
  const singular = isService ? 'prestation' : 'produit';
  const isSearching = debouncedSearch.trim().length > 0;

  function openCreate() {
    setEditing(null);
    setSheetVisible(true);
  }

  function openEdit(item: ProductRow) {
    setEditing(item);
    setSheetVisible(true);
  }

  async function handleSubmit(values: CatalogItemValues) {
    try {
      if (editing) {
        await update.mutateAsync({ ...values, productId: editing.id });
        showSuccess('Modifications enregistrées.');
      } else {
        await create.mutateAsync(values);
        showSuccess(isService ? 'Prestation créée.' : 'Produit créé.');
      }
      setSheetVisible(false);
      setEditing(null);
    } catch {
      showError('Enregistrement impossible. Réessayez.');
    }
  }

  async function handleDelete() {
    if (!pendingDelete) {
      return;
    }

    try {
      await remove.mutateAsync(pendingDelete.id);
      showSuccess(isService ? 'Prestation supprimée.' : 'Produit supprimé.');
    } catch {
      showError('Suppression impossible. Réessayez.');
    } finally {
      setPendingDelete(null);
    }
  }

  return (
    <SettingsScreenFrame scrollable={false} title={title}>
      <View style={styles.toolbar}>
        <SearchField
          accessibilityLabel={`Rechercher un ${singular} par désignation ou référence`}
          onChangeText={setSearch}
          placeholder="Désignation, référence…"
          value={search}
        />
        <FilterChipBar
          onChange={(value) => router.setParams({ type: value })}
          options={TYPE_OPTIONS}
          value={type}
        />
      </View>

      {query.isLoading ? (
        <CatalogSkeleton />
      ) : query.error ? (
        <ErrorState
          message="Vérifiez votre connexion, puis réessayez."
          onRetry={() => void query.refetch()}
          title="Impossible de charger le catalogue"
          variant="screen"
        />
      ) : (
        <FlatList
          contentContainerStyle={items.length === 0 ? styles.emptyContent : styles.list}
          data={items}
          keyboardShouldPersistTaps="handled"
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <EmptyState
              actionLabel={isSearching ? undefined : `Créer un${isService ? 'e' : ''} ${singular}`}
              description={
                isSearching
                  ? 'Essayez une autre désignation ou référence.'
                  : `Vos ${isService ? 'prestations' : 'produits'} récurrents se retrouvent ici et se réutilisent en un geste.`
              }
              icon={
                isService
                  ? { ios: 'wrench.and.screwdriver', android: 'handyman', web: 'handyman' }
                  : { ios: 'cube', android: 'inventory_2', web: 'inventory_2' }
              }
              onAction={isSearching ? undefined : openCreate}
              title={isSearching ? 'Aucun résultat' : `Aucun${isService ? 'e' : ''} ${singular}`}
            />
          }
          renderItem={({ item, index }) => (
            <View>
              {index > 0 ? <ListRowSeparator /> : null}
              <CatalogRow item={item} onEdit={() => openEdit(item)} />
            </View>
          )}
          showsVerticalScrollIndicator={false}
        />
      )}

      {items.length > 0 ? (
        <View style={styles.footer}>
          <Button
            onPress={openCreate}
            title={`Créer un${isService ? 'e' : ''} ${singular}`}
            variant="ghost"
          />
        </View>
      ) : null}

      <CatalogItemSheet
        item={editing}
        loading={create.isPending || update.isPending}
        onClose={() => {
          setSheetVisible(false);
          setEditing(null);
        }}
        onDelete={
          editing
            ? () => {
                // On referme la feuille avant la confirmation : deux surfaces
                // modales empilées ne se présentent pas correctement sur iOS.
                const target = editing;
                setSheetVisible(false);
                setEditing(null);
                setPendingDelete(target);
              }
            : undefined
        }
        onSubmit={(values) => void handleSubmit(values)}
        type={type}
        visible={sheetVisible}
      />

      <ConfirmDialog
        confirmLabel="Supprimer"
        destructive
        loading={remove.isPending}
        message={`« ${pendingDelete?.name ?? ''} » ne sera plus proposé à l’ajout. Les documents déjà émis ne changent pas.`}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => void handleDelete()}
        title={`Supprimer cet${isService ? 'te' : ''} ${singular} ?`}
        visible={pendingDelete !== null}
      />
    </SettingsScreenFrame>
  );
}

function CatalogRow({ item, onEdit }: { item: ProductRow; onEdit: () => void }) {
  const styles = useStyles();
  const meta = [item.reference, item.unit].filter(Boolean).join(' · ');

  return (
    <ListRow
      accessibilityHint="Modifier cet élément"
      onPress={onEdit}
      showChevron={false}
      subtitle={meta || undefined}
      title={item.name}
      trailing={
        <View style={styles.priceBlock}>
          <Text maxFontSizeMultiplier={1.3} numberOfLines={1} style={styles.price}>
            {formatPriceHT(item.unit_price)}
          </Text>
          <Text maxFontSizeMultiplier={1.3} numberOfLines={1} style={styles.vat}>
            {`TVA ${formatVatRate(item.vat_rate)}`}
          </Text>
        </View>
      }
    />
  );
}

function CatalogSkeleton() {
  const styles = useStyles();

  return (
    <View accessibilityLabel="Chargement du catalogue" accessibilityRole="progressbar">
      <Card flush variant="surface">
        {[0, 1, 2, 3].map((index) => (
          <View key={index} style={styles.skeletonRow}>
            <View style={styles.skeletonBody}>
              <Skeleton height={14} width="58%" />
              <Skeleton height={11} width="32%" />
            </View>
            <View style={styles.skeletonTrailing}>
              <Skeleton height={14} width={64} />
              <Skeleton height={11} width={48} />
            </View>
          </View>
        ))}
      </Card>
    </View>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
    toolbar: {
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    list: {
      paddingBottom: spacing.md,
    },
    emptyContent: {
      flexGrow: 1,
      justifyContent: 'center',
    },
    footer: {
      paddingTop: spacing.sm,
    },
    priceBlock: {
      alignItems: 'flex-end',
      gap: spacing[0.5],
    },
    price: {
      ...typography.subheadlineMedium,
      color: colors.text,
    },
    vat: {
      ...typography.caption1,
      color: colors.textTertiary,
    },
    skeletonRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      minHeight: 56,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing[2.5],
    },
    skeletonBody: {
      flex: 1,
      gap: spacing[1.5],
    },
    skeletonTrailing: {
      alignItems: 'flex-end',
      gap: spacing[1.5],
    },
  }));
}
