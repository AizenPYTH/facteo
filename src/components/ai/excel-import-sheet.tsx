import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActionBar } from '@/components/ui/action-bar';
import { Button } from '@/components/ui/button';
import { useThemedStyles } from '@/hooks/use-colors';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';

type ExcelImportSheetProps = {
  visible: boolean;
  onClose: () => void;
  onDownloadTemplate: () => void;
  onPickFile: () => void;
  downloading?: boolean;
};

/**
 * Un seul parcours « Importer Excel » :
 * 1. Télécharger le modèle (optionnel)
 * 2. Remplir les données
 * 3. Choisir le fichier
 */
export function ExcelImportSheet({
  visible,
  onClose,
  onDownloadTemplate,
  onPickFile,
  downloading = false,
}: ExcelImportSheetProps) {
  const styles = useStyles();
  const insets = useSafeAreaInsets();

  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={visible}>
      <View style={styles.overlay}>
        <Pressable accessibilityLabel="Fermer" onPress={onClose} style={styles.scrim} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
          <View style={styles.handle} />
          <Text style={styles.title}>Importer Excel</Text>
          <Text style={styles.subtitle}>Importez plusieurs produits rapidement.</Text>

          <View style={styles.steps}>
            <Step n={1} text="Téléchargez le modèle Excel si nécessaire" />
            <Step n={2} text="Remplissez vos données (nom, prix, TVA…)" />
            <Step n={3} text="Importez le fichier rempli" />
          </View>

          <ActionBar style={{ paddingHorizontal: 0 }} transparent>
            <Button
              loading={downloading}
              onPress={onDownloadTemplate}
              title="Télécharger le modèle"
              variant="secondary"
            />
            <Button onPress={onPickFile} title="Choisir mon fichier Excel" />
            <Button onPress={onClose} title="Annuler" variant="tertiary" />
          </ActionBar>
        </View>
      </View>
    </Modal>
  );
}

function Step({ n, text }: { n: number; text: string }) {
  const styles = useStyles();
  return (
    <View style={styles.stepRow}>
      <View style={styles.stepBadge}>
        <Text style={styles.stepBadgeText}>{n}</Text>
      </View>
      <Text style={styles.stepText}>{text}</Text>
    </View>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
    overlay: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: colors.overlay,
    },
    scrim: {
      ...StyleSheet.absoluteFill,
    },
    sheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 22,
      borderTopRightRadius: 22,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      gap: spacing.md,
    },
    handle: {
      alignSelf: 'center',
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.border,
      marginBottom: spacing.xs,
    },
    title: {
      ...typography.title3,
      color: colors.text,
    },
    subtitle: {
      ...typography.subheadline,
      color: colors.textSecondary,
    },
    steps: {
      gap: spacing.sm,
      paddingVertical: spacing.sm,
    },
    stepRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
    },
    stepBadge: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: colors.primarySubtle,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stepBadgeText: {
      ...typography.caption1,
      fontWeight: '600',
      color: colors.primary,
    },
    stepText: {
      ...typography.subheadline,
      color: colors.text,
      flex: 1,
      lineHeight: 20,
      paddingTop: 2,
    },
  }));
}
