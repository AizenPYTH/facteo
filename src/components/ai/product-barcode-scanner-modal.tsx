import { useEffect, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActionBar } from '@/components/ui/action-bar';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { components } from '@/constants/theme/design-system';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';

type ScannerMode = 'scanner' | 'reference' | 'photo';

type ProductBarcodeScannerModalProps = {
  visible: boolean;
  onClose: () => void;
  onBarcode: (code: string) => void;
  onFallbackPhotoSearch: () => void;
};

/**
 * Scanner produit — DESIGN §5.6
 * Caméra native absente (crash TestFlight) : mode Scanner affiche l'état réel,
 * défaut = Référence. Photo = IA Premium, annoncée avant la prise.
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
  const [mode, setMode] = useState<ScannerMode>('reference');
  const [manualCode, setManualCode] = useState('');

  useEffect(() => {
    if (visible) {
      setManualCode('');
      setMode('reference');
    }
  }, [visible]);

  function handleManualSubmit() {
    const data = manualCode.replace(/\s/g, '').trim();
    if (!data) {
      return;
    }
    onBarcode(data);
  }

  const canSubmit = manualCode.replace(/\s/g, '').trim().length > 0;

  return (
    <Modal animationType="slide" onRequestClose={onClose} visible={visible}>
      <View
        style={[
          styles.container,
          { paddingTop: insets.top, backgroundColor: colors.ink },
        ]}>
        <View style={styles.header}>
          <Text maxFontSizeMultiplier={1.4} style={styles.title}>
            Produit
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

        <View style={styles.segmentWrap}>
          <SegmentedControl
            accessibilityLabel="Mode d’ajout produit"
            onChange={setMode}
            options={[
              { value: 'scanner', label: 'Scanner' },
              { value: 'reference', label: 'Référence' },
              { value: 'photo', label: 'Photo' },
            ]}
            value={mode}
          />
        </View>

        <View style={styles.body}>
          {mode === 'scanner' ? (
            <View style={styles.stateCard}>
              <Text maxFontSizeMultiplier={1.5} style={styles.stateTitle}>
                Caméra non disponible
              </Text>
              <Text maxFontSizeMultiplier={1.5} style={styles.stateBody}>
                Le scan live n’est pas activé sur cette version. Saisissez la référence du produit
                ou utilisez une photo.
              </Text>
              <Button
                onPress={() => setMode('reference')}
                title="Saisir la référence"
                variant="secondary"
              />
            </View>
          ) : null}

          {mode === 'reference' ? (
            <View style={styles.form}>
              <Text maxFontSizeMultiplier={1.5} style={styles.help}>
                Saisissez le code EAN / UPC / GTIN ou une référence catalogue.
              </Text>
              <Field
                autoFocus
                keyboardType="number-pad"
                label="Référence produit"
                onChangeText={setManualCode}
                placeholder="Ex. 3017620422003"
                value={manualCode}
              />
            </View>
          ) : null}

          {mode === 'photo' ? (
            <View style={styles.stateCard}>
              <Text maxFontSizeMultiplier={1.5} style={styles.stateTitle}>
                Analyse photo (Premium)
              </Text>
              <Text maxFontSizeMultiplier={1.5} style={styles.stateBody}>
                Une photo du produit sera analysée par l’IA. Vous vérifierez prix, TVA et quantité
                avant tout ajout au document.
              </Text>
            </View>
          ) : null}
        </View>

        <ActionBar
          caption={
            mode === 'photo'
              ? 'Aucun produit n’est ajouté sans l’écran de vérification.'
              : undefined
          }
          style={{ backgroundColor: colors.surface }}
          transparent={false}>
          {mode === 'reference' ? (
            <>
              <Button
                disabled={!canSubmit}
                onPress={handleManualSubmit}
                title="Rechercher"
              />
              {!canSubmit ? (
                <Text style={styles.disabledReason}>Saisissez une référence pour continuer.</Text>
              ) : null}
            </>
          ) : null}
          {mode === 'photo' ? (
            <Button onPress={onFallbackPhotoSearch} title="Prendre une photo" />
          ) : null}
          {mode === 'scanner' ? (
            <Button onPress={() => setMode('reference')} title="Passer en référence" />
          ) : null}
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
    segmentWrap: {
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.md,
    },
    body: {
      flex: 1,
      paddingHorizontal: spacing.md,
      gap: spacing.md,
    },
    form: {
      gap: spacing.md,
    },
    help: {
      ...typography.subheadline,
      color: colors.textSecondary,
    },
    stateCard: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: spacing.md,
      gap: spacing.md,
    },
    stateTitle: {
      ...typography.headline,
      color: colors.text,
    },
    stateBody: {
      ...typography.subheadline,
      color: colors.textSecondary,
    },
    disabledReason: {
      ...typography.caption1,
      color: colors.textTertiary,
      textAlign: 'center' as const,
    },
  }));
}
