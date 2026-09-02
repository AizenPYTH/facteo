import { SymbolView } from 'expo-symbols';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { KeyboardFormSheet } from '@/components/ui/keyboard';
import { TextField } from '@/components/ui/text-field';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import type { VoiceCommandDraft } from '@/types/voice-command';

type VoiceConfirmationModalProps = {
  visible: boolean;
  value: VoiceCommandDraft;
  loading: boolean;
  onChange: (value: VoiceCommandDraft) => void;
  onClose: () => void;
  onConfirm: () => void;
};

export function VoiceConfirmationModal({
  visible,
  value,
  loading,
  onChange,
  onClose,
  onConfirm,
}: VoiceConfirmationModalProps) {
  const styles = useStyles();
  const colors = useColors();
  const confidence = Math.round(Math.max(0, Math.min(1, value.confidence)) * 100);

  function updateField<K extends keyof VoiceCommandDraft>(field: K, fieldValue: VoiceCommandDraft[K]) {
    onChange({ ...value, [field]: fieldValue });
  }

  function updateItemField(
    index: number,
    field: 'description' | 'quantity' | 'unit' | 'price_ht',
    rawValue: string,
  ) {
    const nextItems = value.items.map((item, itemIndex) => {
      if (itemIndex !== index) {
        return item;
      }

      if (field === 'description' || field === 'unit') {
        return { ...item, [field]: rawValue };
      }

      const parsed = Number(rawValue.replace(',', '.'));
      return {
        ...item,
        [field]: Number.isFinite(parsed) ? parsed : 0,
      };
    });

    onChange({ ...value, items: nextItems });
  }

  function handleAddItem() {
    onChange({
      ...value,
      items: [...value.items, { description: '', quantity: 1, unit: 'unité', price_ht: 0 }],
    });
  }

  function handleRemoveItem(index: number) {
    const nextItems = value.items.filter((_, itemIndex) => itemIndex !== index);
    onChange({ ...value, items: nextItems.length > 0 ? nextItems : value.items });
  }

  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={visible}>
      <View style={styles.overlay}>
        <Pressable accessibilityLabel="Fermer" onPress={onClose} style={StyleSheet.absoluteFill} />
        <View style={styles.sheet}>
          <KeyboardFormSheet
            footer={
              <>
                <Button
                  loading={loading}
                  onPress={onConfirm}
                  title={value.documentType === 'invoice' ? 'Créer la facture' : 'Créer le devis'}
                />
                <Button onPress={onClose} title="Annuler" variant="ghost" />
              </>
            }>
          <Text style={styles.title}>Vérifier la demande vocale</Text>
          <Text style={styles.subtitle}>Aucune création n’est faite sans validation.</Text>

          <View style={styles.confidenceRow}>
            <SymbolView
              name={{ ios: 'sparkles', android: 'auto_awesome', web: 'auto_awesome' }}
              size={16}
              tintColor={colors.primary}
              type="hierarchical"
            />
            <Text style={styles.confidenceText}>Confiance IA : {confidence}%</Text>
          </View>
            <TextField
              label="Client"
              onChangeText={(text) => updateField('client', text)}
              placeholder="Nom du client"
              value={value.client}
            />

            <Text style={styles.sectionLabel}>Prestations / Produits</Text>
            {value.items.map((item, index) => (
              <View key={index} style={styles.itemCard}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemTitle}>Ligne {index + 1}</Text>
                  {value.items.length > 1 ? (
                    <Pressable onPress={() => handleRemoveItem(index)}>
                      <Text style={styles.removeLabel}>Supprimer</Text>
                    </Pressable>
                  ) : null}
                </View>
                <TextField
                  label="Description"
                  onChangeText={(text) => updateItemField(index, 'description', text)}
                  value={item.description}
                />
                <View style={styles.row}>
                  <View style={styles.half}>
                    <TextField
                      keyboardType="decimal-pad"
                      label="Quantité"
                      onChangeText={(text) => updateItemField(index, 'quantity', text)}
                      value={String(item.quantity)}
                    />
                  </View>
                  <View style={styles.half}>
                    <TextField
                      label="Unité"
                      onChangeText={(text) => updateItemField(index, 'unit', text)}
                      value={item.unit}
                    />
                  </View>
                </View>
                <TextField
                  keyboardType="decimal-pad"
                  label="Prix HT"
                  onChangeText={(text) => updateItemField(index, 'price_ht', text)}
                  value={String(item.price_ht)}
                />
              </View>
            ))}

            <Button onPress={handleAddItem} title="Ajouter une ligne" variant="ghost" />

            <View style={styles.row}>
              <View style={styles.half}>
                <TextField
                  keyboardType="decimal-pad"
                  label="TVA (%)"
                  onChangeText={(text) => updateField('vat', text)}
                  value={value.vat}
                />
              </View>
              <View style={styles.half}>
                <TextField
                  keyboardType="decimal-pad"
                  label="Remise (%)"
                  onChangeText={(text) => updateField('discount', text)}
                  value={value.discount}
                />
              </View>
            </View>
            <View style={styles.row}>
              <View style={styles.half}>
                <TextField
                  keyboardType="decimal-pad"
                  label="Paiement (jours)"
                  onChangeText={(text) => updateField('paymentTerms', text)}
                  value={value.paymentTerms}
                />
              </View>
              <View style={styles.half}>
                <TextField
                  label="Devise"
                  onChangeText={(text) => updateField('currency', text.toUpperCase())}
                  value={value.currency}
                />
              </View>
            </View>
            <TextField
              label="Moyen de paiement"
              onChangeText={(text) => updateField('paymentMethod', text)}
              placeholder="Ex: Virement, chèque, carte"
              value={value.paymentMethod}
            />
            <View style={styles.transcriptBlock}>
              <Text style={styles.transcriptLabel}>Transcription</Text>
            <Text style={styles.transcriptText}>{value.transcript}</Text>
          </View>
          </KeyboardFormSheet>
        </View>
      </View>
    </Modal>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
    overlay: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: colors.overlay,
    },
    sheet: {
      maxHeight: '94%',
      minHeight: '70%',
      borderTopLeftRadius: radius.sheet,
      borderTopRightRadius: radius.sheet,
      overflow: 'hidden',
    },
    title: {
      ...typography.title3,
      color: colors.text,
    },
    subtitle: {
      ...typography.subheadline,
      color: colors.textSecondary,
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
    sectionLabel: {
      ...typography.footnoteMedium,
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.3,
    },
    itemCard: {
      borderRadius: radius.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      backgroundColor: colors.surfaceSecondary,
      padding: spacing.md,
      gap: spacing.sm,
    },
    itemHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    itemTitle: {
      ...typography.subheadlineMedium,
      color: colors.text,
    },
    removeLabel: {
      ...typography.footnoteMedium,
      color: colors.error,
    },
    row: {
      flexDirection: 'row',
      gap: spacing.md,
    },
    half: {
      flex: 1,
    },
    transcriptBlock: {
      borderRadius: radius.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      backgroundColor: colors.surfaceSecondary,
      padding: spacing.md,
      gap: spacing.xs,
    },
    transcriptLabel: {
      ...typography.footnoteMedium,
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.3,
    },
    transcriptText: {
      ...typography.subheadline,
      color: colors.text,
    },
  }));
}
