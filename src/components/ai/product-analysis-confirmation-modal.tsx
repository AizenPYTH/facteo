import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { formatPriceHT, formatSpokenEuros } from '@/lib/format/currency';

export type ProductAnalysisDraft = {
  title: string;
  brand: string;
  model: string;
  reference: string;
  description: string;
  unitPriceHt: string;
  unitPriceTtc: string;
  /** Empty string = TVA non déterminée (never invent a rate). */
  vatRate: string;
  currency: string;
  unit: string;
  quantity: string;
  confidence: number;
  sku: string;
  ean: string;
  sourceUrl: string;
};

type ProductAnalysisConfirmationModalProps = {
  visible: boolean;
  imageUri: string;
  value: ProductAnalysisDraft;
  isSaving: boolean;
  onChange: (value: ProductAnalysisDraft) => void;
  onClose: () => void;
  /** persistCatalog : choix explicite après l’ajout — DESIGN §5.7 */
  onConfirm: (persistCatalog: boolean) => void;
  /** Rouvre le scanner après ajout / sans ajouter — DESIGN §5.6 */
  onScanNext?: () => void;
  confirmLabel?: string;
};

export function ProductAnalysisConfirmationModal({
  visible,
  imageUri,
  value,
  isSaving,
  onChange,
  onClose,
  onConfirm,
  onScanNext,
  confirmLabel = 'Ajouter',
}: ProductAnalysisConfirmationModalProps) {
  const styles = useStyles();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [persistCatalog, setPersistCatalog] = useState(false);
  const [editing, setEditing] = useState(false);
  const confidencePercent = Math.round(Math.min(100, Math.max(0, value.confidence * 100)));
  const lineAmount = useMemo(() => computeDraftLineAmount(value), [value]);
  const priceUncertain =
    (!value.unitPriceHt.trim() && !value.unitPriceTtc.trim()) || value.confidence < 0.7;

  function updateField<K extends keyof ProductAnalysisDraft>(
    field: K,
    fieldValue: ProductAnalysisDraft[K],
  ) {
    onChange({ ...value, [field]: fieldValue });
  }

  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={visible}>
      <View style={styles.overlay}>
        <Pressable accessibilityLabel="Fermer" onPress={onClose} style={StyleSheet.absoluteFill} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
          <View style={styles.header}>
            <Text style={styles.title}>Vérifier avant d’ajouter</Text>
            <Text style={styles.subtitle}>
              {value.sourceUrl
                ? `Source : ${value.sourceUrl}`
                : 'Contrôlez le prix, la TVA et la quantité avant l’ajout.'}
            </Text>
          </View>

          <View style={styles.summaryCard}>
            {imageUri ? (
              <Image contentFit="cover" source={{ uri: imageUri }} style={styles.photo} />
            ) : (
              <View style={[styles.photo, { alignItems: 'center', justifyContent: 'center' }]}>
                <Text style={styles.summaryDescription}>Produit</Text>
              </View>
            )}
            <View style={styles.summaryContent}>
              <Text numberOfLines={2} style={styles.summaryTitle}>
                {value.title || 'Produit sans nom'}
              </Text>
              <Text numberOfLines={2} style={styles.summaryDescription}>
                {value.description || 'Ajoutez une description si besoin.'}
              </Text>
              <View style={styles.metaRow}>
                <Text style={styles.metaChip}>
                  Qté {value.quantity || '1'} ·{' '}
                  {value.unitPriceHt || value.unitPriceTtc || 'Prix à confirmer'}{' '}
                  {value.currency || 'EUR'}
                </Text>
                <Text style={styles.metaChip}>
                  {value.vatRate.trim() ? `TVA ${value.vatRate}%` : 'TVA non déterminée'}
                </Text>
                {priceUncertain ? (
                  <Text style={[styles.metaChip, styles.warningChip]}>Prix à confirmer</Text>
                ) : null}
              </View>
              <Text
                accessibilityLabel={
                  lineAmount === null
                    ? 'Montant de la ligne à confirmer'
                    : `Montant de la ligne, ${formatSpokenEuros(lineAmount)}`
                }
                style={styles.lineAmount}>
                Montant de la ligne :{' '}
                {lineAmount === null ? 'à confirmer' : formatPriceHT(lineAmount)}
              </Text>
            </View>
          </View>

          <View style={styles.confidenceRow}>
            <SymbolView
              name={{ ios: 'sparkles', android: 'auto_awesome', web: 'auto_awesome' }}
              size={16}
              tintColor={colors.primary}
              type="hierarchical"
            />
            <Text style={styles.confidenceText}>Confiance : {confidencePercent}%</Text>
          </View>

          {editing ? (
          <ScrollView contentContainerStyle={styles.form} showsVerticalScrollIndicator={false}>
            <TextField
              label="Nom"
              onChangeText={(text) => updateField('title', text)}
              placeholder="Nom du produit"
              value={value.title}
            />
            <TextField
              label="Description"
              multiline
              numberOfLines={3}
              onChangeText={(text) => updateField('description', text)}
              placeholder="Description du produit"
              textAlignVertical="top"
              value={value.description}
            />
            <View style={styles.row}>
              <View style={styles.half}>
                <TextField
                  label="Marque"
                  onChangeText={(text) => updateField('brand', text)}
                  value={value.brand}
                />
              </View>
              <View style={styles.half}>
                <TextField
                  label="Modèle"
                  onChangeText={(text) => updateField('model', text)}
                  value={value.model}
                />
              </View>
            </View>
            <TextField
              label="Référence"
              onChangeText={(text) => updateField('reference', text)}
              value={value.reference}
            />
            <View style={styles.row}>
              <View style={styles.half}>
                <TextField
                  label="SKU"
                  onChangeText={(text) => updateField('sku', text)}
                  value={value.sku}
                />
              </View>
              <View style={styles.half}>
                <TextField
                  label="EAN / GTIN"
                  onChangeText={(text) => updateField('ean', text)}
                  value={value.ean}
                />
              </View>
            </View>
            <View style={styles.row}>
              <View style={styles.half}>
                <TextField
                  keyboardType="decimal-pad"
                  label="Prix TTC"
                  onChangeText={(text) => updateField('unitPriceTtc', text)}
                  value={value.unitPriceTtc}
                />
              </View>
              <View style={styles.half}>
                <TextField
                  keyboardType="decimal-pad"
                  label="Prix HT"
                  onChangeText={(text) => updateField('unitPriceHt', text)}
                  value={value.unitPriceHt}
                />
              </View>
            </View>
            <View style={styles.row}>
              <View style={styles.half}>
                <TextField
                  keyboardType="decimal-pad"
                  label="TVA (%) — vide si inconnue"
                  onChangeText={(text) => updateField('vatRate', text)}
                  placeholder="Non déterminée"
                  value={value.vatRate}
                />
              </View>
              <View style={styles.half}>
                <TextField
                  label="Unité"
                  onChangeText={(text) => updateField('unit', text)}
                  value={value.unit}
                />
              </View>
            </View>
            <View style={styles.row}>
              <View style={styles.half}>
                <TextField
                  label="Devise"
                  onChangeText={(text) => updateField('currency', text.toUpperCase())}
                  value={value.currency}
                />
              </View>
              <View style={styles.half}>
                <TextField
                  keyboardType="decimal-pad"
                  label="Quantité"
                  onChangeText={(text) => updateField('quantity', text)}
                  value={value.quantity}
                />
              </View>
            </View>
          </ScrollView>
          ) : null}

          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: persistCatalog }}
            onPress={() => setPersistCatalog((current) => !current)}
            style={styles.persistRow}>
            <View style={[styles.checkbox, persistCatalog && styles.checkboxChecked]}>
              {persistCatalog ? (
                <Text style={styles.checkboxMark}>✓</Text>
              ) : null}
            </View>
            <Text style={styles.persistLabel}>Enregistrer aussi dans le catalogue</Text>
          </Pressable>

          <View style={styles.actions}>
            <Button
              loading={isSaving}
              onPress={() => onConfirm(persistCatalog)}
              title={confirmLabel}
            />
            <Button onPress={() => setEditing((current) => !current)} title="Corriger" variant="secondary" />
            {onScanNext ? (
              <Button
                onPress={onScanNext}
                title="Scanner le suivant"
                variant="tertiary"
              />
            ) : (
              <Button onPress={onClose} title="Annuler" variant="tertiary" />
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

function parseDraftNumber(value: string): number | null {
  const normalized = value.trim().replace(/\s/g, '').replace(',', '.');
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function computeDraftLineAmount(draft: ProductAnalysisDraft): number | null {
  const quantity = parseDraftNumber(draft.quantity) ?? 1;
  const ht = parseDraftNumber(draft.unitPriceHt);
  if (ht !== null) {
    return ht * quantity;
  }
  const ttc = parseDraftNumber(draft.unitPriceTtc);
  const vat = parseDraftNumber(draft.vatRate);
  if (ttc === null || vat === null) {
    return ttc === null ? null : ttc * quantity;
  }
  return (ttc / (1 + Math.max(vat, 0) / 100)) * quantity;
}

function useStyles() {
  return useThemedStyles((colors) => ({
    overlay: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: 'flex-end',
    },
    sheet: {
      maxHeight: '95%',
      backgroundColor: colors.surface,
      borderTopLeftRadius: radius.sheet,
      borderTopRightRadius: radius.sheet,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      padding: spacing.lg,
      gap: spacing.md,
    },
    header: {
      gap: spacing.xs,
    },
    title: {
      ...typography.title3,
      color: colors.text,
    },
    subtitle: {
      ...typography.subheadline,
      color: colors.textSecondary,
    },
    summaryCard: {
      flexDirection: 'row',
      gap: spacing.md,
      borderRadius: radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      backgroundColor: colors.surfaceSecondary,
      padding: spacing.sm,
    },
    photo: {
      width: 88,
      height: 88,
      borderRadius: radius.md,
      backgroundColor: colors.backgroundSecondary,
    },
    summaryContent: {
      flex: 1,
      gap: spacing.xs,
    },
    summaryTitle: {
      ...typography.headline,
      color: colors.text,
    },
    summaryDescription: {
      ...typography.footnote,
      color: colors.textSecondary,
    },
    metaRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.xs,
      marginTop: spacing.xs,
    },
    metaChip: {
      ...typography.caption1,
      color: colors.primary,
      backgroundColor: colors.primarySubtle,
      borderRadius: radius.chip,
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
    },
    warningChip: {
      color: colors.warning,
      backgroundColor: colors.warningSubtle,
    },
    lineAmount: {
      ...typography.footnoteMedium,
      color: colors.text,
      marginTop: spacing.xs,
      fontVariant: ['tabular-nums'],
    },
    confidenceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    confidenceText: {
      ...typography.footnoteMedium,
      color: colors.textSecondary,
    },
    form: {
      gap: spacing.md,
      paddingBottom: spacing.sm,
    },
    row: {
      flexDirection: 'row',
      gap: spacing.md,
    },
    half: {
      flex: 1,
    },
    persistRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      minHeight: 44,
    },
    checkbox: {
      width: 22,
      height: 22,
      borderRadius: 6,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderStrong,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
    },
    checkboxChecked: {
      backgroundColor: colors.ink,
      borderColor: colors.ink,
    },
    checkboxMark: {
      ...typography.caption1,
      color: colors.onInk,
      fontWeight: '700',
    },
    persistLabel: {
      ...typography.subheadline,
      color: colors.text,
      flex: 1,
    },
    actions: {
      gap: spacing.xs,
    },
  }));
}
