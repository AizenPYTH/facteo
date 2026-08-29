import { router, type Href, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/app-text';
import { useThemedStyles } from '@/hooks/use-colors';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { shadows } from '@/constants/theme/theme';

/**
 * Onglet central Créer — DESIGN §4
 * Ouvre un sheet Facture / Devis / Client puis revient à l’onglet précédent.
 */
export default function CreateTabScreen() {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const [visible, setVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setVisible(true);
      return () => setVisible(false);
    }, []),
  );

  function closeAndGo(href?: Href) {
    setVisible(false);
    if (href) {
      router.push(href);
      return;
    }
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/' as Href);
  }

  return (
    <View style={styles.root}>
      <Modal animationType="slide" onRequestClose={() => closeAndGo()} transparent visible={visible}>
        <View style={styles.overlay}>
          <Pressable accessibilityLabel="Fermer" onPress={() => closeAndGo()} style={StyleSheet.absoluteFill} />
          <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
            <View style={styles.handle} />
            <AppText variant="title">Créer</AppText>
            <AppText color="secondary" variant="caption">
              Choisissez ce que vous voulez créer.
            </AppText>

            <Pressable
              accessibilityRole="button"
              onPress={() => closeAndGo('/invoices/new' as Href)}
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
              <AppText medium variant="body">
                Facture
              </AppText>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => closeAndGo('/quotes/new' as Href)}
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
              <AppText medium variant="body">
                Devis
              </AppText>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => closeAndGo('/clients/new' as Href)}
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
              <AppText medium variant="body">
                Client
              </AppText>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={() => closeAndGo()}
              style={({ pressed }) => [styles.cancel, pressed && styles.rowPressed]}>
              <AppText color="secondary" medium variant="body">
                Annuler
              </AppText>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
    root: {
      flex: 1,
      backgroundColor: colors.background,
    },
    overlay: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: 'flex-end' as const,
    },
    sheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: radius.sheet,
      borderTopRightRadius: radius.sheet,
      paddingHorizontal: spacing.md,
      paddingTop: spacing.sm,
      gap: spacing.sm,
      ...shadows.modal,
    },
    handle: {
      alignSelf: 'center' as const,
      width: 36,
      height: 4,
      borderRadius: radius.full,
      backgroundColor: colors.borderControl,
      marginBottom: spacing.xs,
    },
    row: {
      minHeight: 52,
      borderRadius: radius.buttonSmall,
      backgroundColor: colors.surfaceSecondary,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      paddingHorizontal: spacing.md,
    },
    rowPressed: {
      opacity: 0.85,
    },
    cancel: {
      minHeight: 44,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      marginTop: spacing.xs,
    },
  }));
}
