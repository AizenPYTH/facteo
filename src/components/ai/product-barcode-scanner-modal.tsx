import {
  CameraView,
  useCameraPermissions,
  type BarcodeScanningResult,
} from 'expo-camera';
import { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';

type ProductBarcodeScannerModalProps = {
  visible: boolean;
  onClose: () => void;
  onBarcode: (code: string) => void;
  onFallbackPhotoSearch: () => void;
};

export function ProductBarcodeScannerModal({
  visible,
  onClose,
  onBarcode,
  onFallbackPhotoSearch,
}: ProductBarcodeScannerModalProps) {
  const styles = useStyles();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [manualCode, setManualCode] = useState('');
  const lockedRef = useRef(false);

  useEffect(() => {
    if (visible) {
      lockedRef.current = false;
      setManualCode('');
    }
  }, [visible]);

  function handleScanned(result: BarcodeScanningResult) {
    if (lockedRef.current) {
      return;
    }
    const data = (result.data ?? '').replace(/\s/g, '').trim();
    if (!data) {
      return;
    }
    lockedRef.current = true;
    onBarcode(data);
  }

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
          <Text style={styles.title}>Scanner un code-barres</Text>
          <Pressable onPress={onClose} hitSlop={12}>
            <Text style={[styles.close, { color: colors.primary }]}>Fermer</Text>
          </Pressable>
        </View>

        {!permission?.granted ? (
          <View style={styles.permissionBox}>
            <Text style={styles.permissionText}>
              Autorisez la caméra pour scanner EAN / UPC / GTIN.
            </Text>
            <Button onPress={() => void requestPermission()} title="Autoriser la caméra" />
          </View>
        ) : (
          <View style={styles.cameraWrap}>
            <CameraView
              barcodeScannerSettings={{
                barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39', 'qr'],
              }}
              onBarcodeScanned={handleScanned}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.frame} pointerEvents="none" />
            <Text style={styles.hint}>Cadrez le code-barres du produit</Text>
          </View>
        )}

        <View style={styles.footer}>
          <TextField
            label="Saisie manuelle (EAN / UPC / GTIN)"
            onChangeText={setManualCode}
            placeholder="Ex. 3017620422003"
            value={manualCode}
            keyboardType="number-pad"
          />
          <Button onPress={handleManualSubmit} title="Rechercher ce code" />
          <Button
            onPress={onFallbackPhotoSearch}
            title="Pas de résultat ? Photo / capture produit"
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
    permissionBox: {
      flex: 1,
      justifyContent: 'center',
      gap: spacing.md,
      paddingHorizontal: spacing.lg,
    },
    permissionText: {
      ...typography.body,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    cameraWrap: {
      flex: 1,
      marginHorizontal: spacing.lg,
      borderRadius: radius.lg,
      overflow: 'hidden',
      backgroundColor: '#000',
    },
    frame: {
      position: 'absolute',
      left: '10%',
      right: '10%',
      top: '30%',
      bottom: '30%',
      borderWidth: 2,
      borderColor: 'rgba(255,255,255,0.85)',
      borderRadius: radius.md,
    },
    hint: {
      position: 'absolute',
      bottom: spacing.md,
      left: 0,
      right: 0,
      textAlign: 'center',
      color: '#fff',
      ...typography.footnote,
    },
    footer: {
      gap: spacing.sm,
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.md,
    },
  }));
}
