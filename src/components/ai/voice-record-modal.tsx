import { SymbolView } from 'expo-symbols';
import { useEffect, useRef } from 'react';
import { Animated, Modal, Text, View } from 'react-native';

import { VoiceWaveAnimation } from '@/components/ai/voice-wave-animation';
import { Button } from '@/components/ui/button';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';

type VoiceRecordModalProps = {
  visible: boolean;
  durationMs: number;
  transcriptPreview: string;
  onStop: () => void;
};

export function VoiceRecordModal({
  visible,
  durationMs,
  transcriptPreview,
  onStop,
}: VoiceRecordModalProps) {
  const styles = useStyles();
  const colors = useColors();
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!visible) {
      pulse.stopAnimation();
      pulse.setValue(1);
      return;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.08, duration: 680, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 680, useNativeDriver: true }),
      ]),
    );
    loop.start();

    return () => {
      loop.stop();
      pulse.setValue(1);
    };
  }, [pulse, visible]);

  return (
    <Modal animationType="fade" transparent visible={visible}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Animated.View style={[styles.micCircle, { transform: [{ scale: pulse }] }]}>
            <SymbolView
              name={{ ios: 'mic.fill', android: 'mic', web: 'mic' }}
              size={34}
              tintColor={colors.onPrimary}
              type="hierarchical"
            />
          </Animated.View>

          <Text style={styles.title}>Je vous écoute…</Text>
          <Text style={styles.timer}>{formatRecordingDuration(durationMs)}</Text>

          <VoiceWaveAnimation active />

          <View style={styles.transcriptBox}>
            <Text style={styles.transcriptLabel}>Transcription en cours</Text>
            <Text style={styles.transcriptText}>
              {transcriptPreview || 'Parlez naturellement, INVEQ prépare votre devis ou facture.'}
            </Text>
          </View>

          <Button onPress={onStop} title="Arrêter" />
        </View>
      </View>
    </Modal>
  );
}

function formatRecordingDuration(durationMs: number): string {
  const totalSeconds = Math.floor(durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function useStyles() {
  return useThemedStyles((colors) => ({
    overlay: {
      flex: 1,
      justifyContent: 'center',
      padding: spacing.lg,
      backgroundColor: colors.overlay,
    },
    card: {
      borderRadius: radius.modal,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      alignItems: 'center',
      gap: spacing.md,
      padding: spacing.xl,
    },
    micCircle: {
      width: 108,
      height: 108,
      borderRadius: radius.full,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      ...typography.title3,
      color: colors.text,
    },
    timer: {
      ...typography.title2,
      color: colors.primary,
      fontVariant: ['tabular-nums'],
    },
    transcriptBox: {
      width: '100%',
      borderRadius: radius.lg,
      borderWidth: 1,
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
