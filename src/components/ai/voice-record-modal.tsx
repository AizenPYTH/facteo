import { SymbolView } from 'expo-symbols';
import { useEffect, useState } from 'react';
import { Animated, Easing, Modal, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/composer/primitives';
import {
  composerRadius,
  tabularNums,
  useComposerColors,
  useComposerStyles,
  type ComposerColors,
} from '@/constants/theme/composer';
import { useReduceMotion } from '@/hooks/use-reduce-motion';

type VoiceRecordModalProps = {
  visible: boolean;
  durationMs: number;
  transcriptPreview: string;
  /** Termine l'enregistrement et lance l'analyse. */
  onStop: () => void;
  /** Abandonne l'enregistrement sans rien remplir. */
  onCancel?: () => void;
};

/** Hauteurs relatives des barres de l'onde (motif fixe, animé en `scaleY`). */
const WAVE_BARS = [
  0.35, 0.6, 0.9, 0.5, 0.75, 1, 0.45, 0.3, 0.7, 0.95, 0.55, 0.4, 0.8, 1, 0.6, 0.35, 0.5, 0.85,
  0.65, 0.4, 0.9, 0.55, 0.3, 0.7,
];

const CUES = ['Client', 'Lignes et prix', 'Délai de paiement'];

/**
 * Dictée en cours, présentée en feuille au bas de l'écran : micro pulsant,
 * onde, minuteur, rappel de ce qu'il faut dire.
 */
export function VoiceRecordModal({
  visible,
  durationMs,
  transcriptPreview,
  onStop,
  onCancel,
}: VoiceRecordModalProps) {
  const styles = useComposerStyles(recordStyles);
  const colors = useComposerColors();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReduceMotion();
  // Valeurs animées stables, créées une seule fois (pas de lecture de ref au rendu).
  const [pulse] = useState(() => new Animated.Value(0));
  const [sheet] = useState(() => new Animated.Value(0));
  const [bars] = useState(() => WAVE_BARS.map(() => new Animated.Value(0.3)));

  useEffect(() => {
    if (!visible) {
      sheet.setValue(0);
      pulse.stopAnimation();
      pulse.setValue(0);
      return;
    }

    Animated.timing(sheet, {
      toValue: 1,
      duration: reduceMotion ? 0 : 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    if (reduceMotion) {
      return;
    }

    const pulseLoop = Animated.loop(
      Animated.timing(pulse, {
        toValue: 1,
        duration: 1400,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    );
    const waveLoops = bars.map((value, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay((index % 6) * 70),
          Animated.timing(value, {
            toValue: 1,
            duration: 360 + (index % 4) * 90,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: 0.25,
            duration: 380 + (index % 3) * 110,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      ),
    );
    pulseLoop.start();
    waveLoops.forEach((loop) => loop.start());

    return () => {
      pulseLoop.stop();
      waveLoops.forEach((loop) => loop.stop());
      pulse.setValue(0);
    };
  }, [bars, pulse, reduceMotion, sheet, visible]);

  const ringScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.5] });
  const ringOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0] });
  const sheetTranslate = sheet.interpolate({ inputRange: [0, 1], outputRange: [420, 0] });

  return (
    <Modal
      animationType="fade"
      onRequestClose={onCancel ?? onStop}
      statusBarTranslucent
      transparent
      visible={visible}>
      <View style={styles.overlay}>
        <Pressable
          accessibilityLabel="Annuler la dictée"
          accessibilityRole="button"
          disabled={!onCancel}
          onPress={onCancel}
          style={styles.scrim}
        />
        <Animated.View
          accessibilityViewIsModal
          style={[
            styles.sheet,
            { paddingBottom: Math.max(insets.bottom, 16) + 8, transform: [{ translateY: sheetTranslate }] },
          ]}>
          <View style={styles.grabber} />
          <Text maxFontSizeMultiplier={1.3} style={styles.status}>
            Écoute en cours · {formatRecordingDuration(durationMs)}
          </Text>

          <View style={styles.micStage}>
            <Animated.View
              style={[styles.micRing, { opacity: ringOpacity, transform: [{ scale: ringScale }] }]}
            />
            <View style={styles.micCircle}>
              <SymbolView
                name={{ ios: 'mic.fill', android: 'mic', web: 'mic' }}
                size={34}
                tintColor={colors.onAccent}
                type="monochrome"
              />
            </View>
          </View>

          <View style={styles.wave}>
            {bars.map((value, index) => (
              <Animated.View
                key={index}
                style={[
                  styles.waveBar,
                  { height: 8 + 28 * (WAVE_BARS[index] ?? 0.5), transform: [{ scaleY: value }] },
                ]}
              />
            ))}
          </View>

          <Text maxFontSizeMultiplier={1.3} style={styles.transcript}>
            {transcriptPreview ? (
              `« ${transcriptPreview} »`
            ) : (
              <>
                « Facture pour Boulangerie Martin : 12 heures à 45 €,{' '}
                <Text style={styles.transcriptMuted}>paiement à 30 jours. »</Text>
              </>
            )}
          </Text>

          <View style={styles.cues}>
            {CUES.map((cue) => (
              <View key={cue} style={styles.cue}>
                <Text maxFontSizeMultiplier={1.3} style={styles.cueLabel}>
                  {cue}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.actions}>
            <PrimaryButton label="Terminer et remplir" onPress={onStop} />
            {onCancel ? (
              <Pressable
                accessibilityRole="button"
                onPress={onCancel}
                style={({ pressed }) => [styles.cancel, pressed && styles.pressed]}>
                <Text maxFontSizeMultiplier={1.3} style={styles.cancelLabel}>
                  Annuler
                </Text>
              </Pressable>
            ) : null}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

function formatRecordingDuration(durationMs: number): string {
  const totalSeconds = Math.floor(durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function recordStyles(colors: ComposerColors) {
  return {
    overlay: {
      flex: 1,
      justifyContent: 'flex-end' as const,
    },
    scrim: {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: colors.scrim,
    },
    sheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: composerRadius.sheet,
      borderTopRightRadius: composerRadius.sheet,
      paddingHorizontal: 20,
      paddingTop: 8,
      alignItems: 'center' as const,
    },
    grabber: {
      width: 36,
      height: 5,
      borderRadius: 99,
      backgroundColor: colors.line,
      marginBottom: 18,
    },
    status: {
      ...tabularNums,
      fontSize: 15,
      color: colors.ink3,
    },
    micStage: {
      marginTop: 18,
      width: 84,
      height: 84,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    micRing: {
      position: 'absolute' as const,
      width: 84,
      height: 84,
      borderRadius: 42,
      backgroundColor: colors.accent,
    },
    micCircle: {
      width: 84,
      height: 84,
      borderRadius: 42,
      backgroundColor: colors.accent,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      borderWidth: 4,
      borderColor: colors.accentSoft,
    },
    wave: {
      marginTop: 18,
      height: 40,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 3,
    },
    waveBar: {
      width: 3,
      borderRadius: 2,
      backgroundColor: colors.accent,
    },
    transcript: {
      marginTop: 20,
      fontSize: 19,
      lineHeight: 28,
      letterSpacing: -0.2,
      textAlign: 'center' as const,
      color: colors.ink,
    },
    transcriptMuted: {
      color: colors.ink3,
    },
    cues: {
      marginTop: 16,
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      justifyContent: 'center' as const,
      gap: 6,
    },
    cue: {
      height: 28,
      paddingHorizontal: 10,
      borderRadius: 99,
      backgroundColor: colors.soft,
      justifyContent: 'center' as const,
    },
    cueLabel: {
      fontSize: 13,
      fontWeight: '600' as const,
      color: colors.ink2,
    },
    actions: {
      alignSelf: 'stretch' as const,
      marginTop: 28,
      gap: 6,
    },
    cancel: {
      height: 44,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    cancelLabel: {
      fontSize: 16,
      color: colors.ink2,
    },
    pressed: {
      opacity: 0.6,
    },
  };
}
