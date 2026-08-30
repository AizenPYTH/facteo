import { useEffect, useState } from 'react';
import { Modal, Pressable, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActionBar } from '@/components/ui/action-bar';
import { Button } from '@/components/ui/button';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { components } from '@/constants/theme/design-system';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';

type ScannerMode = 'scan' | 'reference' | 'photo';

type ProductBarcodeScannerModalProps = {
  visible: boolean;
  onClose: () => void;
  /** Référence / code saisi — parent ouvre l’écran de vérification. */
  onReferenceSubmit: (reference: string) => void;
  /** Photo IA — parent lance la caméra puis la vérification. */
  onPhotoSearch: () => void;
  /** Caméra code-barres disponible sur cet appareil (sinon état honnête). */
  cameraReady?: boolean;
  onCameraScan?: () => void;
};

/**
 * Scanner produit — DESIGN §5.6
 * Seul écran sombre. Viser → Identifier → Vérifier → Ajouter.
 * Aucun produit n’entre dans le document depuis cet écran.
 */
export function ProductBarcodeScannerModal({
  visible,
  onClose,
  onReferenceSubmit,
  onPhotoSearch,
  cameraReady = false,
  onCameraScan,
}: ProductBarcodeScannerModalProps) {
  const styles = useStyles();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<ScannerMode>(cameraReady ? 'scan' : 'reference');
  const [reference, setReference] = useState('');

  useEffect(() => {
    if (!visible) {
      setReference('');
      setMode(cameraReady ? 'scan' : 'reference');
    }
  }, [visible, cameraReady]);

  function handleSubmitReference() {
    const value = reference.trim();
    if (!value) return;
    onReferenceSubmit(value);
  }

  return (
    <Modal animationType="slide" onRequestClose={onClose} visible={visible}>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text maxFontSizeMultiplier={1.4} style={styles.title}>
            Scanner
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
              { value: 'scan', label: 'Scanner' },
              { value: 'reference', label: 'Référence' },
              { value: 'photo', label: 'Photo' },
            ]}
            value={mode}
          />
        </View>

        <View style={styles.body}>
          {mode === 'scan' ? (
            <View style={styles.frame}>
              <View style={styles.viewfinder} />
              <Text style={styles.stateTitle}>
                {cameraReady ? 'Visez le code-barres' : 'Caméra non prête'}
              </Text>
              <Text style={styles.stateBody}>
                {cameraReady
                  ? 'Stabilisez le cadre. Le produit sera proposé à la vérification avant ajout.'
                  : 'Le scan caméra n’est pas disponible pour le moment. Utilisez Référence ou Photo.'}
              </Text>
              {cameraReady && onCameraScan ? (
                <Button onPress={onCameraScan} title="Activer la caméra" variant="secondary" />
              ) : (
                <Button
                  onPress={() => setMode('reference')}
                  title="Saisir une référence"
                  variant="secondary"
                />
              )}
            </View>
          ) : null}

          {mode === 'reference' ? (
            <View style={styles.panel}>
              <Text style={styles.stateTitle}>Référence produit</Text>
              <Text style={styles.stateBody}>
                Saisissez un EAN, une référence catalogue ou un nom. Vous vérifierez prix et TVA
                avant l’ajout.
              </Text>
              <TextInput
                autoCapitalize="characters"
                autoCorrect={false}
                onChangeText={setReference}
                placeholder="EAN ou référence"
                placeholderTextColor={colors.textPlaceholder}
                returnKeyType="done"
                style={styles.input}
                value={reference}
              />
            </View>
          ) : null}

          {mode === 'photo' ? (
            <View style={styles.panel}>
              <Text style={styles.stateTitle}>Photo produit</Text>
              <Text style={styles.stateBody}>
                L’analyse IA propose une fiche. Aucun produit n’est ajouté sans l’écran de
                vérification (prix, TVA, quantité).
              </Text>
            </View>
          ) : null}
        </View>

        <ActionBar
          caption="Aucun résultat n’entre dans le document sans vérification."
          style={{ backgroundColor: colors.surface }}
          transparent={false}>
          {mode === 'reference' ? (
            <Button
              disabled={!reference.trim()}
              onPress={handleSubmitReference}
              title="Vérifier"
            />
          ) : null}
          {mode === 'photo' ? (
            <Button onPress={onPhotoSearch} title="Prendre une photo" />
          ) : null}
          {mode === 'scan' ? (
            <Button onPress={() => setMode('reference')} title="Passer à la référence" variant="tertiary" />
          ) : (
            <Button onPress={onClose} title="Annuler" variant="tertiary" />
          )}
        </ActionBar>
      </View>
    </Modal>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
    container: {
      flex: 1,
      backgroundColor: '#0E1015',
    },
    header: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      minHeight: components.touchTarget,
    },
    title: {
      ...typography.title3,
      color: '#E9EBF0',
    },
    closeHit: {
      minWidth: components.touchTarget,
      minHeight: components.touchTarget,
      alignItems: 'flex-end' as const,
      justifyContent: 'center' as const,
    },
    close: {
      ...typography.subheadlineMedium,
      color: '#7FA1E8',
    },
    segmentWrap: {
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.md,
    },
    body: {
      flex: 1,
      paddingHorizontal: spacing.md,
      justifyContent: 'center' as const,
    },
    frame: {
      alignItems: 'center' as const,
      gap: spacing.md,
    },
    viewfinder: {
      width: 220,
      height: 140,
      borderRadius: radius.md,
      borderWidth: 2,
      borderColor: 'rgba(233,235,240,0.55)',
      backgroundColor: 'rgba(27,30,38,0.5)',
    },
    panel: {
      backgroundColor: '#1B1E26',
      borderRadius: radius.card,
      borderWidth: 1,
      borderColor: '#2B2F3A',
      padding: spacing.md,
      gap: spacing.sm,
    },
    stateTitle: {
      ...typography.headline,
      color: '#E9EBF0',
      textAlign: 'center' as const,
    },
    stateBody: {
      ...typography.footnote,
      color: '#9AA0B0',
      textAlign: 'center' as const,
      lineHeight: 18,
    },
    input: {
      ...typography.body,
      minHeight: components.inputHeight,
      borderRadius: radius.input,
      borderWidth: 1,
      borderColor: '#3A3F4C',
      backgroundColor: '#21242E',
      color: '#E9EBF0',
      paddingHorizontal: spacing.md,
      fontVariant: ['tabular-nums'],
    },
  }));
}
