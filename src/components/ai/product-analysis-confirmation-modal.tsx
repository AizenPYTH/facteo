import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { KeyboardAwareScrollView, KeyboardToolbar } from 'react-native-keyboard-controller';

import { Button } from '@/components/ui/button';
import { StickyFooter } from '@/components/ui/sticky-footer';
import { KEYBOARD_TOOLBAR_HEIGHT } from '@/components/ui/keyboard/constants';
import { TextField } from '@/components/ui/text-field';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';

export type ProductAnalysisDraft = {
  title: string;
  brand: string;
  model: string;
  reference: string;
  description: string;
  unitPriceHt: string;
  unitPriceTtc: string;
  vatRate: string;
  currency: string;
  unit: string;
  quantity: string;
  confidence: number;
};

type ProductAnalysisConfirmationModalProps = {
  visible: boolean;
  imageUri: string;
  value: ProductAnalysisDraft;
  isSaving: boolean;
  onChange: (value: ProductAnalysisDraft) => void;
  onClose: () => void;
  onConfirm: () => void;
};

export function ProductAnalysisConfirmationModal({
  visible,
  imageUri,
  value,
  isSaving,
  onChange,
  onClose,
  onConfirm,
}: ProductAnalysisConfirmationModalProps) {
  const styles = useStyles();
  const colors = useColors();
  const confidencePercent = Math.round(Math.min(100, Math.max(0, value.confidence * 100)));

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
        <KeyboardToolbar.Group>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Vérifier le produit détecté</Text>
            <Text style={styles.subtitle}>Tous les champs sont modifiables avant création.</Text>
          </View>

          <View style={styles.summaryCard}>
            <Image contentFit="cover" source={{ uri: imageUri }} style={styles.photo} />
            <View style={styles.summaryContent}>
              <Text numberOfLines={2} style={styles.summaryTitle}>
                {value.title || 'Produit sans nom'}
              </Text>
              <Text numberOfLines={2} style={styles.summaryDescription}>
                {value.description || 'Ajoutez une description pour améliorer votre catalogue.'}
              </Text>
              <View style={styles.metaRow}>
                <Text style={styles.metaChip}>
                  {value.unitPriceTtc || value.unitPriceHt || 'Prix à compléter'} {value.currency || 'EUR'}
                </Text>
                <Text style={styles.metaChip}>TVA {value.vatRate || '0'}%</Text>
              </View>
            </View>
          </View>

          <View style={styles.confidenceRow}>
            <SymbolView
              name={{ ios: 'sparkles', android: 'auto_awesome', web: 'auto_awesome' }}
              size={16}
              tintColor={colors.primary}
              type="hierarchical"
            />
            <Text style={styles.confidenceText}>Confiance IA : {confidencePercent}%</Text>
          </View>

          <KeyboardAwareScrollView
            bottomOffset={96 + KEYBOARD_TOOLBAR_HEIGHT}
            contentContainerStyle={styles.form}
            keyboardDismissMode="on-drag"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
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
                  label="TVA (%)"
                  onChangeText={(text) => updateField('vatRate', text)}
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
          </KeyboardAwareScrollView>

          <StickyFooter>
            <Button loading={isSaving} onPress={onConfirm} title="Créer le produit" />
            <Button onPress={onClose} title="Annuler" variant="ghost" />
          </StickyFooter>
        </View>
        </KeyboardToolbar.Group>
      </View>
    </Modal>
  );
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
      paddingTop: spacing.lg,
    },
    header: {
      gap: spacing.xs,
      paddingHorizontal: spacing.lg,
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
      marginHorizontal: spacing.lg,
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
    confidenceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingHorizontal: spacing.lg,
    },
    confidenceText: {
      ...typography.footnoteMedium,
      color: colors.textSecondary,
    },
    form: {
      gap: spacing.md,
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.sm,
    },
    row: {
      flexDirection: 'row',
      gap: spacing.md,
    },
    half: {
      flex: 1,
    },
  }));
}
