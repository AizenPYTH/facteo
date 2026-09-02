import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';

type ProductBarcodeScannerModalProps = {
  visible: boolean;
  onClose: () => void;
  onBarcode: (code: string) => void;
  onFallbackPhotoSearch: () => void;
};

/**
 * Barcode entry without expo-camera / ZXing.
 * Live camera barcode was removed: those native frameworks caused an immediate
 * cold-start crash on TestFlight (absent from last stable build #41).
 * Flow: type EAN/UPC, or continue with product photo (IA).
 */
export function ProductBarcodeScannerModal({
  visible,
  onClose,
  onBarcode,
  onFallbackPhotoSearch,
}: ProductBarcodeScannerModalProps) {
  const styles = useStyles();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [manualCode, setManualCode] = useState('');

  useEffect(() => {
    if (visible) {
      setManualCode('');
    }
  }, [visible]);

  function handleManualSubmit() {
    const data = manualCode.replace(/\s/g, '').trim();
    if (!data) {
      return;
    }
    onBarcode(data);
  }

  return (
    <Modal animationType="slide" onRequestClose={onClose} visible={visible}>
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Code-barres produit</Text>
          <Pressable onPress={onClose} hitSlop={12}>
            <Text style={[styles.close, { color: colors.primary }]}>Fermer</Text>
          </Pressable>
        </View>

        <View style={styles.body}>
          <Text style={styles.help}>
            Saisissez l’EAN / UPC / GTIN du produit, ou utilisez une photo pour l’identifier avec
            l’IA (comme sur le site).
          </Text>

          <TextField
            label="Code-barres (EAN / UPC / GTIN)"
            onChangeText={setManualCode}
            placeholder="Ex. 3017620422003"
            value={manualCode}
            keyboardType="number-pad"
            autoFocus
          />

          <Button onPress={handleManualSubmit} title="Rechercher ce code" />
          <Button
            onPress={onFallbackPhotoSearch}
            title="Photo / capture produit (IA)"
            variant="ghost"
          />
        </View>
      </View>
    </Modal>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      gap: spacing.md,
    },
    header: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    title: {
      ...typography.headline,
      color: colors.text,
    },
    close: {
      ...typography.subheadlineMedium,
    },
    body: {
      flex: 1,
      gap: spacing.md,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
    },
    help: {
      ...typography.subheadline,
      color: colors.textSecondary,
    },
  }));
}
