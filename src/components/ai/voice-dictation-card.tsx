import { router, type Href } from 'expo-router';
import { RecordingPresets, useAudioRecorder, type AudioRecorder } from 'expo-audio';
import { SymbolView } from 'expo-symbols';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { VoiceRecordModal } from '@/components/ai/voice-record-modal';
import {
  composerRadius,
  useComposerStyles,
  type ComposerColors,
} from '@/constants/theme/composer';
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
  /**
   * `hero` : grande carte indigo pleine couleur (assistant de facture iPhone),
   * `card` : carte discrète historique.
   */
  variant?: 'card' | 'hero';
};

/**
 * Crée l'enregistreur natif seulement pendant une dictée. Monté à l'ouverture
 * de l'écran, il prenait le micro juste après Siri (ouverture par raccourci),
 * au moment où iOS rend la session audio.
 */
function RecorderHost({ onReady }: { onReady: (recorder: AudioRecorder) => void }) {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  useEffect(() => {
    onReady(recorder);
  }, [onReady, recorder]);
  return null;
}

/**
 * Dictée d'une facture : on parle, l'IA remplit le client, les lignes, la TVA
 * et le délai de paiement. Même fonctionnement que sur le site.
 */
export function VoiceDictationCard({
  documentType,
  onResult,
  variant = 'card',
}: VoiceDictationCardProps) {
  const styles = useStyles();
  const heroStyles = useComposerStyles(heroCardStyles);
  const colors = useColors();
  const { hasFeature } = useSubscription();
  const { showError, showSuccess } = useToast();
  const [armed, setArmed] = useState(false);
  const recorderResolveRef = useRef<((recorder: AudioRecorder) => void) | null>(null);
  const handleRecorderReady = useRef((recorder: AudioRecorder) => {
    recorderResolveRef.current?.(recorder);
    recorderResolveRef.current = null;
  }).current;
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
      const recorder = await new Promise<AudioRecorder>((resolve) => {
        recorderResolveRef.current = resolve;
        setArmed(true);
      });
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
      setArmed(false);
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
      const audio = await stopVoiceRecording(current).finally(() => setArmed(false));
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

  /** Abandon : l'enregistrement est arrêté et jeté, rien n'est analysé. */
  async function cancel() {
    const current = sessionRef.current;
    if (!current) return;
    sessionRef.current = null;
    if (timerRef.current) clearInterval(timerRef.current);
    setSession(null);
    try {
      await stopVoiceRecording(current);
    } catch {
      // Rien à récupérer : l'utilisateur a abandonné la dictée.
    } finally {
      setArmed(false);
    }
  }

  const label = documentType === 'invoice' ? 'Dicter la facture' : 'Dicter le devis';

  const recordSheet = (
    <VoiceRecordModal
      durationMs={durationMs}
      onCancel={() => void cancel()}
      onStop={() => void stop()}
      transcriptPreview=""
      visible={session !== null}
    />
  );

  if (variant === 'hero') {
    return (
      <>
        {armed ? <RecorderHost onReady={handleRecorderReady} /> : null}
        <Pressable
          accessibilityHint="Client, lignes et délai en une phrase"
          accessibilityLabel={label}
          accessibilityRole="button"
          accessibilityState={{ busy: processing }}
          disabled={processing}
          onPress={() => void start()}
          style={({ pressed }) => [heroStyles.card, pressed && heroStyles.pressed]}>
          <View style={heroStyles.mic}>
            {processing ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <SymbolView
                name={{ ios: 'mic.fill', android: 'mic', web: 'mic' }}
                size={22}
                tintColor="#FFFFFF"
                type="monochrome"
              />
            )}
          </View>
          <View style={heroStyles.text}>
            <Text maxFontSizeMultiplier={1.3} style={heroStyles.title}>
              {processing ? 'Analyse de la dictée…' : label}
            </Text>
            <Text maxFontSizeMultiplier={1.3} style={heroStyles.hint}>
              Client, lignes et délai en une phrase
            </Text>
          </View>
          <SymbolView
            name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
            size={14}
            tintColor="rgba(255, 255, 255, 0.75)"
            type="monochrome"
          />
        </Pressable>
        {recordSheet}
      </>
    );
  }

  return (
    <>
      {armed ? <RecorderHost onReady={handleRecorderReady} /> : null}
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
      {recordSheet}
    </>
  );
}

function heroCardStyles(colors: ComposerColors) {
  return {
    card: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 14,
      padding: 16,
      borderRadius: composerRadius.hero,
      backgroundColor: colors.accent,
      shadowColor: '#4F46E5',
      shadowOpacity: 0.55,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 12 },
      elevation: 4,
    },
    pressed: {
      opacity: 0.9,
    },
    mic: {
      width: 46,
      height: 46,
      borderRadius: 23,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    text: {
      flex: 1,
      minWidth: 0,
    },
    title: {
      fontSize: 17,
      fontWeight: '700' as const,
      color: colors.onAccent,
    },
    hint: {
      fontSize: 14,
      color: 'rgba(255, 255, 255, 0.88)',
      marginTop: 2,
    },
  };
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
