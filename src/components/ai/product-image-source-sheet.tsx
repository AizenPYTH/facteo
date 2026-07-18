import { SymbolView } from 'expo-symbols';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';

type ProductImageSourceSheetProps = {
  visible: boolean;
  onClose: () => void;
  onCameraPress: () => void;
  onGalleryPress: () => void;
};

export function ProductImageSourceSheet({
  visible,
  onClose,
  onCameraPress,
  onGalleryPress,
}: ProductImageSourceSheetProps) {
  const styles = useStyles();
  const colors = useColors();
  const insets = useSafeAreaInsets();

  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={visible}>
      <View style={styles.overlay}>
        <Pressable onPress={onClose} style={StyleSheet.absoluteFill} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
          <Text style={styles.title}>Ajouter avec l’IA</Text>
          <Text style={styles.subtitle}>Choisissez une source d’image pour analyser le produit.</Text>

          <Pressable onPress={onCameraPress} style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
            <SymbolView
              name={{ ios: 'camera.fill', android: 'photo_camera', web: 'camera' }}
              size={20}
              tintColor={colors.primary}
              type="hierarchical"
            />
            <Text style={styles.rowLabel}>Prendre une photo</Text>
          </Pressable>

          <Pressable
            onPress={onGalleryPress}
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
            <SymbolView
              name={{ ios: 'photo.on.rectangle', android: 'photo_library', web: 'image' }}
              size={20}
              tintColor={colors.primary}
              type="hierarchical"
            />
            <Text style={styles.rowLabel}>Choisir une photo</Text>
          </Pressable>

          <Pressable onPress={onClose} style={({ pressed }) => [styles.cancel, pressed && styles.rowPressed]}>
            <Text style={styles.cancelLabel}>Annuler</Text>
          </Pressable>
        </View>
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
      padding: spacing.md,
    },
    sheet: {
      backgroundColor: colors.surface,
      borderRadius: radius.sheet,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.lg,
      gap: spacing.sm,
    },
    title: {
      ...typography.title3,
      color: colors.text,
    },
    subtitle: {
      ...typography.subheadline,
      color: colors.textSecondary,
      marginBottom: spacing.xs,
    },
    row: {
      minHeight: 52,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      borderRadius: radius.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      paddingHorizontal: spacing.md,
      backgroundColor: colors.surfaceSecondary,
    },
    rowPressed: {
      opacity: 0.78,
    },
    rowLabel: {
      ...typography.callout,
      color: colors.text,
      fontWeight: '600',
    },
    cancel: {
      minHeight: 48,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: radius.md,
      marginTop: spacing.xs,
    },
    cancelLabel: {
      ...typography.callout,
      color: colors.textSecondary,
      fontWeight: '600',
    },
  }));
}
