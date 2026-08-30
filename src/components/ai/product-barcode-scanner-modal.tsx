import { useEffect } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActionBar } from '@/components/ui/action-bar';
import { Button } from '@/components/ui/button';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { components } from '@/constants/theme/design-system';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';

type ProductBarcodeScannerModalProps = {
  visible: boolean;
  onClose: () => void;
  /** Conservé pour compat — non utiliséé (plus de saisie EAN manuelle). */
  onBarcode?: (code: string) => void;
  onFallbackPhotoSearch: () => void;
};

/**
 * Ajout produit par photo — caméra iOS → analyse IA.
 * La saisie EAN chiffre par chiffre a été retirée (UX).
 */
export function ProductBarcodeScannerModal({
  visible,
  onClose,
  onFallbackPhotoSearch,
}: ProductBarcodeScannerModalProps) {
  const styles = useStyles();
  const colors = useColors();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    // Ouverture : rien à reset (plus de champ manuel).
  }, [visible]);

  return (
    <Modal animationType="slide" onRequestClose={onClose} visible={visible}>
      <View
        style={[
          styles.container,
          { paddingTop: insets.top, backgroundColor: colors.ink },
        ]}>
        <View style={styles.header}>
          <Text maxFontSizeMultiplier={1.4} style={styles.title}>
            Photo produit
          </Text>
          <Pressable
            accessibilityLabel="Fermer"
            accessibilityRole="button"
            hitSlop={12}
            onPress={onClose}
            style={styles.closeHit}>
            <Text style={styles.close}>Fermer</Text>
          </Pressable>
        </View>

        <View style={styles.body}>
          <View style={styles.stateCard}>
            <Text maxFontSizeMultiplier={1.5} style={styles.stateTitle}>
              Prendre une photo du produit
            </Text>
            <Text maxFontSizeMultiplier={1.5} style={styles.stateBody}>
              L’IA identifie nom, marque, référence, EAN, prix, TVA et quantité. Si plusieurs
              produits sont visibles, vous pourrez les vérifier un par un avant de les ajouter.
            </Text>
          </View>
        </View>

        <ActionBar
          caption="Aucun produit n’est ajouté sans l’écran de vérification."
          style={{ backgroundColor: colors.surface }}
          transparent={false}>
          <Button onPress={onFallbackPhotoSearch} title="Ouvrir la caméra" />
          <Button onPress={onClose} title="Annuler" variant="tertiary" />
        </ActionBar>
      </View>
    </Modal>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
    container: {
      flex: 1,
    },
    header: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
    },
    title: {
      ...typography.title3,
      color: colors.onInk,
    },
    closeHit: {
      minWidth: components.touchTarget,
      minHeight: components.touchTarget,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    close: {
      ...typography.subheadlineMedium,
      color: colors.primary,
    },
    body: {
      flex: 1,
      paddingHorizontal: spacing.md,
      justifyContent: 'center' as const,
    },
    stateCard: {
      gap: spacing.md,
      padding: spacing.lg,
      borderRadius: 14,
      backgroundColor: 'rgba(255,255,255,0.08)',
    },
    stateTitle: {
      ...typography.title3,
      color: colors.onInk,
    },
    stateBody: {
      ...typography.subheadline,
      color: 'rgba(233,235,240,0.82)',
      lineHeight: 22,
    },
  }));
}
