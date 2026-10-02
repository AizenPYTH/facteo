import { router, type Href } from 'expo-router';
import { RecordingPresets, useAudioRecorder } from 'expo-audio';
import { SymbolView } from 'expo-symbols';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { VoiceRecordModal } from '@/components/ai/voice-record-modal';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { useSubscription } from '@/hooks/use-subscription';
import {
  openSystemSettings,
  requestMicrophonePermission,
  startVoiceRecording,
  stopVoiceRecording,
  type VoiceRecordingSession,
} from '@/lib/ai/voice-recorder';
import { processVoiceCommand, type ProcessVoiceCommandResult } from '@/lib/ai/voice-transcription';
import { useToast } from '@/providers/toast-provider';

/** Durée maximale d'une dictée : au-delà, l'enregistrement s'arrête seul. */
const MAX_MS = 120_000;

type VoiceDictationCardProps = {
  documentType: 'invoice' | 'quote';
  /** Remplit le document ; renvoie le récapitulatif affiché à l'utilisateur. */
  onResult: (result: ProcessVoiceCommandResult) => Promise<string>;
};

/**
 * Dictée d'une facture : on parle, l'IA remplit le client, les lignes, la TVA
 * et le délai de paiement. Même fonctionnement que sur le site.
 */
export function VoiceDictationCard({ documentType, onResult }: VoiceDictationCardProps) {
  const styles = useStyles();
  const colors = useColors();
  const { hasFeature } = useSubscription();
  const { showError, showSuccess } = useToast();
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [session, setSession] = useState<VoiceRecordingSession | null>(null);
  const [durationMs, setDurationMs] = useState(0);
  const [processing, setProcessing] = useState(false);
  const sessionRef = useRef<VoiceRecordingSession | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current) clearInterval(timerRef.current);
    },
    [],
  );

  async function start() {
    if (!hasFeature('ai_assistant')) {
      router.push('/settings/premium' as Href);
      return;
    }

    const permission = await requestMicrophonePermission();
    if (permission !== 'granted') {
      showError(
        permission === 'blocked'
          ? 'Micro bloqué : autorisez-le pour INVEQ dans les réglages du téléphone.'
          : 'Autorisez le micro pour dicter la facture.',
      );
      if (permission === 'blocked') {
        void openSystemSettings();
      }
      return;
    }

    try {
      const next = await startVoiceRecording(recorder);
      sessionRef.current = next;
      setSession(next);
      setDurationMs(0);
      let elapsed = 0;
      timerRef.current = setInterval(() => {
        elapsed += 1000;
        setDurationMs(elapsed);
        if (elapsed >= MAX_MS) {
          void stop();
        }
      }, 1000);
    } catch {
      showError('Impossible de démarrer l’enregistrement.');
    }
  }

  async function stop() {
    const current = sessionRef.current;
    if (!current) return;
    sessionRef.current = null;
    if (timerRef.current) clearInterval(timerRef.current);
    setSession(null);
    setProcessing(true);

    try {
      const audio = await stopVoiceRecording(current);
      if (audio.durationMs < 1500) {
        throw new Error('Enregistrement trop court. Parlez quelques secondes.');
      }
      const result = await processVoiceCommand({
        documentType,
        audioBase64: audio.audioBase64,
        mimeType: audio.mimeType,
      });
      showSuccess(await onResult(result));
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Dictée impossible.');
    } finally {
      setProcessing(false);
    }
  }

  return (
    <>
      <Pressable
        accessibilityLabel={documentType === 'invoice' ? 'Dicter la facture' : 'Dicter le devis'}
        accessibilityRole="button"
        disabled={processing}
        onPress={() => void start()}
        style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
        <View style={styles.mic}>
          {processing ? (
            <ActivityIndicator color={colors.onPrimary} />
          ) : (
            <SymbolView
              name={{ ios: 'mic.fill', android: 'mic', web: 'mic' }}
              size={20}
              tintColor={colors.onPrimary}
              type="hierarchical"
            />
          )}
        </View>
        <View style={styles.text}>
          <Text style={styles.title}>
            {processing
              ? 'Analyse de la dictée…'
              : documentType === 'invoice'
                ? 'Dicter la facture'
                : 'Dicter le devis'}
          </Text>
          <Text style={styles.hint}>
            « Facture pour Boulangerie Martin : 12 heures à 45 €, paiement à 30 jours. »
          </Text>
        </View>
      </Pressable>
      <VoiceRecordModal
        durationMs={durationMs}
        onStop={() => void stop()}
        transcriptPreview=""
        visible={session !== null}
      />
    </>
  );
}

const useStyles = () =>
  useThemedStyles((colors) => ({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      padding: spacing.md,
      borderRadius: radius.card,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      marginHorizontal: spacing.md,
      marginTop: spacing.sm,
    },
    pressed: {
      opacity: 0.85,
    },
    mic: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
    },
    text: {
      flex: 1,
      gap: 2,
    },
    title: {
      ...typography.subheadlineMedium,
      color: colors.text,
    },
    hint: {
      ...typography.caption1,
      color: colors.textSecondary,
    },
  }));
