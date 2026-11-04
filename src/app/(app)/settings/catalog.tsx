import { useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useMemo, useState } from 'react';
import { FlatList, Switch, Text, View } from 'react-native';

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
import { useCatalogImport } from '@/hooks/use-catalog-import';
import { useCatalogMutations } from '@/hooks/use-catalog-mutations';
import { useAuth } from '@/hooks/use-auth';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { shareImportTemplate } from '@/lib/catalog/spreadsheet-import';
import { formatPriceHT, formatVatRate } from '@/lib/format/currency';
import { catalogQueryKeys } from '@/lib/supabase/query-keys';
import { deleteProducts } from '@/lib/supabase/products';
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
  const spreadsheet = useCatalogImport(type);

  const [sheetVisible, setSheetVisible] = useState(false);
  const [editing, setEditing] = useState<ProductRow | null>(null);
  const [pendingDelete, setPendingDelete] = useState<ProductRow | null>(null);
  /** Import : mettre à jour les articles dont la référence existe déjà (sinon : les laisser). */
  const [updateExisting, setUpdateExisting] = useState(true);
  const [sharingTemplate, setSharingTemplate] = useState(false);
  /** Sélection multiple : `null` hors sélection. */
  const [selected, setSelected] = useState<Set<string> | null>(null);
  const [bulkConfirm, setBulkConfirm] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const colors = useColors();
  const selecting = selected !== null;

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

  async function handlePickSpreadsheet() {
    try {
      const message = await spreadsheet.pickFile();
      if (message) showError(message);
    } catch {
      showError('Impossible d’ouvrir vos fichiers. Réessayez.');
    }
  }

  async function handleImport() {
    try {
      const { created, updated, duplicates } = await spreadsheet.confirm(updateExisting);
      const parts = [
        `${created} ajouté${created > 1 ? 's' : ''}`,
        updated > 0 ? `${updated} mis à jour` : null,
        duplicates > updated ? `${duplicates - updated} déjà présent${duplicates - updated > 1 ? 's' : ''}` : null,
      ].filter(Boolean);
      showSuccess(`Import terminé : ${parts.join(', ')}.`);
    } catch {
      showError('Import interrompu. Les articles déjà enregistrés sont conservés ; réessayez.');
    }
  }

  async function handleShareTemplate() {
    setSharingTemplate(true);
    try {
      await shareImportTemplate();
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Modèle indisponible. Réessayez.');
    } finally {
      setSharingTemplate(false);
    }
  }

  function toggleSelected(id: string) {
    setSelected((current) => {
      const next = new Set(current ?? []);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleBulkDelete() {
    if (!user || !selected || selected.size === 0) return;
    setBulkDeleting(true);
    try {
      const count = await deleteProducts(user.id, [...selected]);
      showSuccess(`${count} élément${count > 1 ? 's' : ''} supprimé${count > 1 ? 's' : ''}.`);
      setSelected(null);
    } catch {
      showError('Suppression impossible. Réessayez.');
    } finally {
      setBulkDeleting(false);
      setBulkConfirm(false);
      void queryClient.invalidateQueries({ queryKey: catalogQueryKeys.all });
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
          onChange={(value) => {
            setSelected(null);
            router.setParams({ type: value });
          }}
          options={TYPE_OPTIONS}
          value={type}
        />
        {items.length > 0 ? (
          <View style={styles.selectionBar}>
            {selecting ? (
              <>
                <Button
                  onPress={() =>
                    setSelected(selected.size === items.length ? new Set() : new Set(items.map((item) => item.id)))
                  }
                  title={selected.size === items.length ? 'Tout désélectionner' : 'Tout sélectionner'}
                  variant="ghost"
                />
                <Button onPress={() => setSelected(null)} title="Terminé" variant="ghost" />
              </>
            ) : (
              <Button onPress={() => setSelected(new Set())} title="Sélectionner" variant="ghost" />
            )}
          </View>
        ) : null}
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
              <CatalogRow
                item={item}
                onPress={() => (selecting ? toggleSelected(item.id) : openEdit(item))}
                selected={selecting ? selected.has(item.id) : undefined}
                tint={colors.primary}
                untint={colors.textTertiary}
              />
            </View>
          )}
          showsVerticalScrollIndicator={false}
        />
      )}

      {selecting ? (
        <View style={styles.footer}>
          <Button
            disabled={selected.size === 0}
            onPress={() => setBulkConfirm(true)}
            style={styles.destructive}
            title={
              selected.size > 0
                ? `Supprimer ${selected.size} élément${selected.size > 1 ? 's' : ''}`
                : 'Choisissez les éléments à supprimer'
            }
          />
        </View>
      ) : (
        <View style={styles.footer}>
          {items.length > 0 ? (
            <Button
              onPress={openCreate}
              title={`Créer un${isService ? 'e' : ''} ${singular}`}
              variant="ghost"
            />
          ) : null}
          <Button
            loading={spreadsheet.reading}
            onPress={() => void handlePickSpreadsheet()}
            title="Importer un fichier Excel ou CSV"
            variant="ghost"
          />
          <Button
            loading={sharingTemplate}
            onPress={() => void handleShareTemplate()}
            title="Télécharger le modèle Excel"
            variant="ghost"
          />
        </View>
      )}

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
        confirmLabel={
          spreadsheet.progress && spreadsheet.progress.total > 0
            ? `Import… ${spreadsheet.progress.done}/${spreadsheet.progress.total}`
            : `Importer ${spreadsheet.pending?.items.length ?? 0} article${(spreadsheet.pending?.items.length ?? 0) > 1 ? 's' : ''}`
        }
        loading={spreadsheet.saving}
        message={
          spreadsheet.pending
            ? `${spreadsheet.pending.items.length} ligne${spreadsheet.pending.items.length > 1 ? 's' : ''} trouvée${spreadsheet.pending.items.length > 1 ? 's' : ''} dans « ${spreadsheet.pending.fileName} ». Elles rejoignent vos ${isService ? 'prestations' : 'produits'}, communs à toutes vos entreprises, sans doublon.`
            : undefined
        }
        onCancel={() => {
          if (!spreadsheet.saving) spreadsheet.cancel();
        }}
        onConfirm={() => void handleImport()}
        title={`Importer dans ${isService ? 'Prestations' : 'Produits'} ?`}
        visible={spreadsheet.pending !== null}>
        <View style={styles.switchRow}>
          <View style={styles.switchText}>
            <Text style={styles.switchTitle}>Mettre à jour les articles existants</Text>
            <Text style={styles.switchHint}>
              {updateExisting
                ? 'Même référence : prix, stock et infos remplacés par ceux du fichier.'
                : 'Même référence : l’article existant est laissé tel quel.'}
            </Text>
          </View>
          <Switch
            accessibilityLabel="Mettre à jour les articles existants"
            disabled={spreadsheet.saving}
            onValueChange={setUpdateExisting}
            trackColor={{ true: colors.primary }}
            value={updateExisting}
          />
        </View>
      </ConfirmDialog>

      <ConfirmDialog
        confirmLabel={`Supprimer ${selected?.size ?? 0}`}
        destructive
        loading={bulkDeleting}
        message="Ils ne seront plus proposés à l’ajout. Les devis et factures déjà émis ne changent pas."
        onCancel={() => setBulkConfirm(false)}
        onConfirm={() => void handleBulkDelete()}
        title={`Supprimer ${selected?.size ?? 0} élément${(selected?.size ?? 0) > 1 ? 's' : ''} ?`}
        visible={bulkConfirm}
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

function CatalogRow({
  item,
  onPress,
  selected,
  tint,
  untint,
}: {
  item: ProductRow;
  onPress: () => void;
  /** `undefined` hors sélection multiple. */
  selected?: boolean;
  tint: string;
  untint: string;
}) {
  const styles = useStyles();
  const meta = [item.reference, item.unit].filter(Boolean).join(' · ');
  const selecting = selected !== undefined;

  return (
    <ListRow
      accessibilityHint={
        selecting ? (selected ? 'Sélectionné. Touchez pour retirer.' : 'Touchez pour sélectionner.') : 'Modifier cet élément'
      }
      leading={
        selecting ? (
          <SymbolView
            name={selected ? 'checkmark.circle.fill' : 'circle'}
            size={24}
            tintColor={selected ? tint : untint}
          />
        ) : undefined
      }
      onPress={onPress}
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
      gap: spacing.xs,
    },
    selectionBar: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: spacing.xs,
    },
    destructive: {
      backgroundColor: colors.error,
    },
    switchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      marginTop: spacing.sm,
    },
    switchText: {
      flex: 1,
      gap: 2,
    },
    switchTitle: {
      ...typography.subheadlineMedium,
      color: colors.text,
    },
    switchHint: {
      ...typography.caption1,
      color: colors.textSecondary,
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
      color: colors.textSecondary,
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
