import { Image } from 'expo-image';
import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import type { ProductAnalysisDraft } from '@/components/ai/product-analysis-confirmation-modal';

type ProductAnalysisBatchModalProps = {
  visible: boolean;
  imageUri: string | null;
  items: ProductAnalysisDraft[];
  isSaving: boolean;
  onChangeItems: (items: ProductAnalysisDraft[]) => void;
  onClose: () => void;
  onConfirmSelected: (items: ProductAnalysisDraft[], persistCatalog: boolean) => void;
};

export function ProductAnalysisBatchModal({
  visible,
  imageUri,
  items,
  isSaving,
  onChangeItems,
  onClose,
  onConfirmSelected,
}: ProductAnalysisBatchModalProps) {
  const styles = useStyles();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<Record<number, boolean>>(() =>
    Object.fromEntries(items.map((_, index) => [index, true])),
  );
  const [expanded, setExpanded] = useState<number | null>(0);
  const [persistCatalog, setPersistCatalog] = useState(false);

  const stats = useMemo(() => {
    const selectedItems = items.filter((_, index) => selected[index]);
    const needsReview = selectedItems.filter(
      (item) => item.confidence < 0.7 || !item.vatRate.trim() || !item.unitPriceHt.trim(),
    ).length;
    return {
      selectedCount: selectedItems.length,
      needsReview,
      ready: selectedItems.length - needsReview,
    };
  }, [items, selected]);

  function updateItem(index: number, next: ProductAnalysisDraft) {
    const copy = [...items];
    copy[index] = next;
    onChangeItems(copy);
  }

  function toggle(index: number) {
    setSelected((prev) => ({ ...prev, [index]: !prev[index] }));
  }

  function handleConfirm() {
    const chosen = items.filter((_, index) => selected[index]);
    onConfirmSelected(chosen, persistCatalog);
  }

  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={visible}>
      <View style={styles.overlay}>
        <Pressable accessibilityLabel="Fermer" onPress={onClose} style={StyleSheet.absoluteFill} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
          <Text style={styles.title}>Produits identifiés</Text>
          <Text style={styles.subtitle}>
            ✓ {stats.ready} prêts · ⚠ {stats.needsReview} à vérifier · {stats.selectedCount}{' '}
            sélectionné(s)
          </Text>

          {imageUri ? (
            <Image contentFit="cover" source={{ uri: imageUri }} style={styles.banner} />
          ) : null}

          <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
            {items.map((item, index) => {
              const isOpen = expanded === index;
              const needsReview =
                item.confidence < 0.7 || !item.vatRate.trim() || !item.unitPriceHt.trim();
              return (
                <View key={`${item.title}-${index}`} style={styles.card}>
                  <Pressable onPress={() => toggle(index)} style={styles.cardHeader}>
                    <Text style={styles.check}>{selected[index] ? '☑' : '☐'}</Text>
                    <View style={styles.cardHeaderText}>
                      <Text numberOfLines={2} style={styles.cardTitle}>
                        {item.title || `Produit ${index + 1}`}
                      </Text>
                      <Text style={styles.cardMeta}>
                        {needsReview ? '⚠ À vérifier' : '✓ OK'} · conf.{' '}
                        {Math.round(item.confidence * 100)}%
                        {!item.vatRate.trim() ? ' · TVA non déterminée' : ''}
                      </Text>
                    </View>
                    <Pressable onPress={() => setExpanded(isOpen ? null : index)} hitSlop={8}>
                      <Text style={{ color: colors.primary }}>{isOpen ? 'Masquer' : 'Éditer'}</Text>
                    </Pressable>
                  </Pressable>

                  {isOpen ? (
                    <View style={styles.form}>
                      <TextField
                        label="Nom"
                        onChangeText={(text) => updateItem(index, { ...item, title: text })}
                        value={item.title}
                      />
                      <TextField
                        label="Référence"
                        onChangeText={(text) => updateItem(index, { ...item, reference: text })}
                        value={item.reference}
                      />
                      <View style={styles.row}>
                        <View style={styles.half}>
                          <TextField
                            label="Prix HT"
                            keyboardType="decimal-pad"
                            onChangeText={(text) =>
                              updateItem(index, { ...item, unitPriceHt: text })
                            }
                            value={item.unitPriceHt}
                          />
                        </View>
                        <View style={styles.half}>
                          <TextField
                            label="TVA % (vide = non déterminée)"
                            keyboardType="decimal-pad"
                            onChangeText={(text) => updateItem(index, { ...item, vatRate: text })}
                            placeholder="Non déterminée"
                            value={item.vatRate}
                          />
                        </View>
                      </View>
                      <View style={styles.row}>
                        <View style={styles.half}>
                          <TextField
                            label="Quantité"
                            keyboardType="decimal-pad"
                            onChangeText={(text) => updateItem(index, { ...item, quantity: text })}
                            value={item.quantity}
                          />
                        </View>
                        <View style={styles.half}>
                          <TextField
                            label="EAN"
                            onChangeText={(text) => updateItem(index, { ...item, ean: text })}
                            value={item.ean}
                          />
                        </View>
                      </View>
                    </View>
                  ) : null}
                </View>
              );
            })}
          </ScrollView>

          <View style={styles.actions}>
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: persistCatalog }}
              onPress={() => setPersistCatalog((current) => !current)}
              style={styles.persistRow}>
              <Text style={styles.persistLabel}>
                {persistCatalog ? '☑' : '☐'} Enregistrer aussi dans le catalogue
              </Text>
            </Pressable>
            <Button
              loading={isSaving}
              onPress={handleConfirm}
              title={`Ajouter les ${stats.selectedCount} produit(s)`}
            />
            <Button onPress={onClose} title="Annuler" variant="ghost" />
          </View>
        </View>
      </View>
    </Modal>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.45)',
      justifyContent: 'flex-end',
    },
    sheet: {
      maxHeight: '92%',
      backgroundColor: colors.background,
      borderTopLeftRadius: radius.sheet,
      borderTopRightRadius: radius.sheet,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
      gap: spacing.sm,
    },
    title: {
      ...typography.title3,
      color: colors.text,
    },
    subtitle: {
      ...typography.subheadline,
      color: colors.textSecondary,
    },
    banner: {
      height: 120,
      borderRadius: radius.md,
      backgroundColor: colors.surfaceSecondary,
    },
    list: {
      gap: spacing.sm,
      paddingVertical: spacing.sm,
    },
    card: {
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      borderRadius: radius.md,
      padding: spacing.sm,
      gap: spacing.sm,
      backgroundColor: colors.surface,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    check: {
      fontSize: 20,
      color: colors.text,
    },
    cardHeaderText: {
      flex: 1,
      gap: 2,
    },
    cardTitle: {
      ...typography.bodyMedium,
      color: colors.text,
    },
    cardMeta: {
      ...typography.caption1,
      color: colors.textSecondary,
    },
    form: {
      gap: spacing.sm,
    },
    row: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    half: {
      flex: 1,
    },
    actions: {
      gap: spacing.xs,
    },
    persistRow: {
      minHeight: 44,
      justifyContent: 'center',
    },
    persistLabel: {
      ...typography.subheadline,
      color: colors.text,
    },
  }));
}
