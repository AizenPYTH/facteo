import { RecordingPresets, setAudioModeAsync, useAudioRecorder } from 'expo-audio';
import { SymbolView } from 'expo-symbols';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import {
  interpretVoiceReply,
  speakFrench,
  spokenAmount,
  stopSpeaking,
  type VoiceAssistantReply,
  type VoiceAssistantStage,
} from '@/lib/ai/voice-assistant';
import { requestMicrophonePermission, startVoiceRecording, stopVoiceRecording } from '@/lib/ai/voice-recorder';
import { formatCurrency } from '@/lib/format/currency';

export type VoiceAssistantSummary = {
  clientName: string;
  clientEmail: string | null;
  lines: { label: string; amountHt: number }[];
  totalHt: number;
  totalVat: number;
  totalTtc: number;
  /** Titre du document (« Facture », « Note d'honoraires »…). */
  title: string;
};

type Phase =
  | 'intro'
  | 'listening'
  | 'thinking'
  | 'review'
  | 'creating'
  | 'askSend'
  | 'askEmail'
  | 'sending'
  | 'done';

type VoiceInvoiceAssistantProps = {
  visible: boolean;
  summary: VoiceAssistantSummary;
  onPreview: () => void;
  /** Crée la facture ; renvoie son identifiant et son numéro. */
  onCreate: () => Promise<{ id: string; number: string }>;
  /** Envoie la facture créée ; `email` remplace l'adresse du client. Renvoie le destinataire. */
  onSend: (invoiceId: string, email: string | null) => Promise<string>;
  /** Fermeture : `invoiceId` si la facture a été créée. */
  onClose: (invoiceId: string | null) => void;
};

/** Silence qui termine une réponse, une fois que l'on a parlé. */
const END_SILENCE_MS = 1200;
/** Sans parole pendant ce délai, on arrête d'écouter. */
const NO_SPEECH_MS = 6000;
const MAX_LISTEN_MS = 12_000;
const SPEECH_DB = -38;

/**
 * Conversation vocale après « Dis Siri, facture INVEQ » : l'app lit la
 * facture préparée, demande « Je la crée ? », puis « Je l'envoie par mail ? »,
 * et agit selon la réponse dite à voix haute. Chaque étape a aussi ses boutons.
 */
export function VoiceInvoiceAssistant({
  visible,
  summary,
  onPreview,
  onCreate,
  onSend,
  onClose,
}: VoiceInvoiceAssistantProps) {
  const styles = useStyles();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const recorder = useAudioRecorder({ ...RecordingPresets.HIGH_QUALITY, isMeteringEnabled: true });

  const [phase, setPhase] = useState<Phase>('intro');
  const [message, setMessage] = useState('');
  const [heard, setHeard] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ id: string; number: string } | null>(null);
  const [recipient, setRecipient] = useState<string | null>(null);
  const aliveRef = useRef(true);
  const startedRef = useRef(false);
  /** Fermeture en cours : plus aucune parole, écoute ni changement d'état. */
  const closingRef = useRef(false);
  const listeningRef = useRef(false);
  const summaryRef = useRef(summary);
  const phaseRef = useRef<Phase>(phase);
  useEffect(() => {
    summaryRef.current = summary;
  }, [summary]);
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
      stopSpeaking();
    };
  }, []);

  const say = useCallback(async (text: string) => {
    if (!aliveRef.current || closingRef.current) return;
    setMessage(text);
    await speakFrench(text);
  }, []);

  /** Écoute une réponse : s'arrête seule après un court silence. */
  const listen = useCallback(async (): Promise<{ audioBase64: string; mimeType: string } | null> => {
    if (listeningRef.current || closingRef.current) return null;
    const permission = await requestMicrophonePermission();
    if (permission !== 'granted') {
      setError('Autorisez le micro pour répondre à voix haute, ou utilisez les boutons.');
      return null;
    }
    listeningRef.current = true;
    setHeard('');
    const previous = phaseRef.current === 'intro' ? 'review' : phaseRef.current;
    setPhase('listening');
    try {
      const session = await startVoiceRecording(recorder);
      const startedAt = Date.now();
      let spokeAt: number | null = null;
      let lastLoudAt = startedAt;
      await new Promise<void>((resolve) => {
        const timer = setInterval(() => {
          // Assistant fermé : on arrête avant de toucher à l'enregistreur.
          if (closingRef.current || !aliveRef.current) {
            clearInterval(timer);
            resolve();
            return;
          }
          const now = Date.now();
          let level = -160;
          try {
            level = recorder.getStatus().metering ?? -160;
          } catch {
            clearInterval(timer);
            resolve();
            return;
          }
          if (level > SPEECH_DB) {
            spokeAt ??= now;
            lastLoudAt = now;
          }
          const finished =
            !aliveRef.current ||
            now - startedAt > MAX_LISTEN_MS ||
            (spokeAt === null && now - startedAt > NO_SPEECH_MS) ||
            (spokeAt !== null && now - lastLoudAt > END_SILENCE_MS);
          if (finished) {
            clearInterval(timer);
            resolve();
          }
        }, 120);
      });
      const payload = await stopVoiceRecording(session);
      if (closingRef.current) return null;
      if (spokeAt === null) {
        setPhase(previous);
        return null;
      }
      return { audioBase64: payload.audioBase64, mimeType: payload.mimeType };
    } catch {
      if (!closingRef.current) setPhase(previous);
      return null;
    } finally {
      listeningRef.current = false;
    }
  }, [recorder]);

  /**
   * Fermeture propre : la voix s'arrête, l'écoute en cours se termine et rend
   * le micro, puis seulement l'écran se ferme. Fermer pendant l'écoute faisait
   * tomber l'app (l'enregistreur était lu après sa destruction).
   */
  const closeAssistant = useCallback(
    async (invoiceId: string | null) => {
      if (closingRef.current) return;
      closingRef.current = true;
      stopSpeaking();
      const deadline = Date.now() + 2000;
      while (listeningRef.current && Date.now() < deadline) {
        await new Promise((resolve) => setTimeout(resolve, 60));
      }
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true }).catch(() => undefined);
      onClose(invoiceId);
    },
    [onClose],
  );

  const askAndListen = useCallback(
    async (stage: VoiceAssistantStage, question: string): Promise<VoiceAssistantReply | null> => {
      await say(question);
      if (!aliveRef.current) return null;
      const audio = await listen();
      if (!audio || !aliveRef.current) return null;
      setPhase('thinking');
      try {
        const reply = await interpretVoiceReply({ stage, ...audio });
        setHeard(reply.transcript);
        return reply;
      } catch (replyError) {
        setError(replyError instanceof Error ? replyError.message : 'Réponse non comprise.');
        return null;
      }
    },
    [listen, say],
  );

  const finish = useCallback(
    async (text: string, invoiceId: string | null) => {
      setPhase('done');
      await say(text);
      if (aliveRef.current) setTimeout(() => void closeAssistant(invoiceId), 900);
    },
    [closeAssistant, say],
  );

  const send = useCallback(
    async (invoice: { id: string; number: string }, email: string | null) => {
      setPhase('sending');
      setError(null);
      try {
        const to = await onSend(invoice.id, email);
        setRecipient(to);
        await finish(`C'est envoyé à ${to}.`, invoice.id);
      } catch (sendError) {
        const text = sendError instanceof Error ? sendError.message : 'Envoi impossible.';
        setError(text);
        setPhase('askSend');
        await say(`L'envoi n'a pas marché. ${text}`);
      }
    },
    [finish, onSend, say],
  );

  const askEmail = useCallback(
    async (invoice: { id: string; number: string }) => {
      setPhase('askEmail');
      const reply = await askAndListen('confirm_send', 'À quelle adresse e-mail dois-je l’envoyer ?');
      if (reply?.email) {
        await send(invoice, reply.email);
      } else if (reply?.action === 'cancel') {
        await finish('D’accord, je ne l’envoie pas.', invoice.id);
      } else {
        setPhase('askEmail');
        await say('Je n’ai pas compris l’adresse. Touchez le micro pour réessayer, ou envoyez-la plus tard.');
      }
    },
    [askAndListen, finish, say, send],
  );

  const offerSend = useCallback(
    async (invoice: { id: string; number: string }, emailFromReply: string | null) => {
      const email = emailFromReply ?? summaryRef.current.clientEmail;
      if (!email) {
        await askEmail(invoice);
        return;
      }
      setPhase('askSend');
      const reply = await askAndListen(
        'confirm_send',
        `Facture ${invoice.number} créée. Je l'envoie par mail à ${email} ?`,
      );
      if (!reply) {
        setPhase('askSend');
        return;
      }
      if (reply.action === 'send') {
        await send(invoice, reply.email ?? emailFromReply);
      } else if (reply.action === 'cancel') {
        await finish('D’accord, la facture est enregistrée sans envoi.', invoice.id);
      } else {
        setPhase('askSend');
        await say('Je n’ai pas compris. Dites oui pour l’envoyer, ou non.');
      }
    },
    [askAndListen, askEmail, finish, say, send],
  );

  const create = useCallback(
    async (thenSend: boolean, email: string | null) => {
      setPhase('creating');
      setError(null);
      try {
        const invoice = await onCreate();
        setCreated(invoice);
        if (thenSend) {
          const to = email ?? summaryRef.current.clientEmail;
          if (to) {
            await send(invoice, email);
          } else {
            await askEmail(invoice);
          }
          return;
        }
        await offerSend(invoice, email);
      } catch (createError) {
        const text = createError instanceof Error ? createError.message : 'Création impossible.';
        setError(text);
        setPhase('review');
        await say(`Je n'ai pas pu créer la facture. ${text}`);
      }
    },
    [askEmail, offerSend, onCreate, say, send],
  );

  const handleReviewReply = useCallback(
    async (reply: VoiceAssistantReply | null) => {
      if (!reply) {
        setPhase('review');
        return;
      }
      if (reply.action === 'confirm' || reply.action === 'confirm_and_send') {
        await create(reply.action === 'confirm_and_send', reply.email);
      } else if (reply.action === 'cancel') {
        await say('D’accord, modifiez-la à l’écran.');
        await closeAssistant(null);
      } else {
        setPhase('review');
        await say('Je n’ai pas compris. Dites oui pour créer la facture, ou non pour la modifier.');
      }
    },
    [closeAssistant, create, say],
  );

  const reviewSentence = useCallback(() => {
    const current = summaryRef.current;
    const count = current.lines.length;
    const first = current.lines[0]?.label;
    const lines = count === 1 && first ? first : `${count} lignes`;
    return `J'ai préparé la facture pour ${current.clientName} : ${lines}, total ${spokenAmount(
      current.totalTtc,
    )} TTC. Je la crée ?`;
  }, []);

  // Première ouverture : lecture de la facture, puis écoute de la réponse.
  // La séquence passe par une ref : un nouveau rendu de l'écran (callbacks
  // recréés) ne doit ni l'annuler ni la relancer.
  const openingRef = useRef<() => Promise<void>>(async () => undefined);
  useEffect(() => {
    openingRef.current = async () => {
      setPhase('review');
      const reply = await askAndListen('confirm_invoice', reviewSentence());
      await handleReviewReply(reply);
    };
  }, [askAndListen, handleReviewReply, reviewSentence]);
  useEffect(() => {
    if (!visible || startedRef.current) return;
    const timer = setTimeout(() => {
      if (startedRef.current) return;
      startedRef.current = true;
      void openingRef.current();
    }, 500);
    return () => clearTimeout(timer);
  }, [visible]);

  async function talkAgain() {
    setError(null);
    if (created) {
      if (phase === 'askEmail') {
        await askEmail(created);
        return;
      }
      await offerSend(created, null);
      return;
    }
    const reply = await askAndListen('confirm_invoice', 'Je vous écoute.');
    await handleReviewReply(reply);
  }

  const busy = phase === 'creating' || phase === 'sending' || phase === 'thinking';
  const stageLabel =
    phase === 'listening'
      ? 'Je vous écoute…'
      : phase === 'thinking'
        ? 'Je réfléchis…'
        : phase === 'creating'
          ? 'Création de la facture…'
          : phase === 'sending'
            ? 'Envoi par e-mail…'
            : phase === 'done'
              ? recipient
                ? `Envoyée à ${recipient}`
                : 'Terminé'
              : null;

  return (
    <Modal
      animationType="slide"
      onRequestClose={() => void closeAssistant(created?.id ?? null)}
      presentationStyle="pageSheet"
      visible={visible}>
      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Assistant vocal</Text>
          <Pressable
            accessibilityLabel="Fermer l’assistant"
            accessibilityRole="button"
            hitSlop={12}
            onPress={() => void closeAssistant(created?.id ?? null)}>
            <SymbolView name="xmark.circle.fill" size={28} tintColor={colors.textTertiary} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              {summary.title}
              {created ? ` ${created.number}` : ''}
            </Text>
            <Text style={styles.client}>{summary.clientName}</Text>
            {summary.lines.map((line, index) => (
              <View key={`${line.label}-${index}`} style={styles.lineRow}>
                <Text numberOfLines={2} style={styles.lineLabel}>
                  {line.label}
                </Text>
                <Text style={styles.lineAmount}>{formatCurrency(line.amountHt)}</Text>
              </View>
            ))}
            <View style={styles.divider} />
            <View style={styles.lineRow}>
              <Text style={styles.totalLabel}>Total HT</Text>
              <Text style={styles.totalValue}>{formatCurrency(summary.totalHt)}</Text>
            </View>
            <View style={styles.lineRow}>
              <Text style={styles.totalLabel}>TVA</Text>
              <Text style={styles.totalValue}>{formatCurrency(summary.totalVat)}</Text>
            </View>
            <View style={styles.lineRow}>
              <Text style={styles.grandLabel}>Total TTC</Text>
              <Text style={styles.grandValue}>{formatCurrency(summary.totalTtc)}</Text>
            </View>
            {!created ? (
              <Pressable
                accessibilityRole="button"
                disabled={busy || phase === 'listening'}
                onPress={() => {
                  stopSpeaking();
                  onPreview();
                }}
                style={styles.previewLink}>
                <SymbolView name="doc.text.magnifyingglass" size={18} tintColor={colors.primary} />
                <Text style={styles.previewText}>Voir l’aperçu PDF</Text>
              </Pressable>
            ) : null}
          </View>

          {message ? <Text style={styles.message}>« {message} »</Text> : null}
          {heard ? <Text style={styles.heard}>Vous : {heard}</Text> : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}

          {stageLabel ? (
            <View style={styles.status}>
              {phase === 'listening' ? (
                <SymbolView name="waveform" size={22} tintColor={colors.primary} />
              ) : phase === 'done' ? (
                <SymbolView name="checkmark.circle.fill" size={22} tintColor={colors.success} />
              ) : (
                <ActivityIndicator color={colors.primary} />
              )}
              <Text style={styles.statusText}>{stageLabel}</Text>
            </View>
          ) : null}
        </ScrollView>

        {phase !== 'done' ? (
          <View style={styles.actions}>
            {!created ? (
              <>
                <Button
                  disabled={busy || phase === 'listening'}
                  loading={phase === 'creating'}
                  onPress={() => {
                    stopSpeaking();
                    void create(false, null);
                  }}
                  title="Oui, créer la facture"
                />
                <Button
                  disabled={busy || phase === 'listening'}
                  onPress={() => {
                    stopSpeaking();
                    void create(true, null);
                  }}
                  title="Créer et envoyer par mail"
                  variant="ghost"
                />
              </>
            ) : (
              <>
                <Button
                  disabled={busy || phase === 'listening' || (!summary.clientEmail && phase !== 'askSend')}
                  loading={phase === 'sending'}
                  onPress={() => {
                    stopSpeaking();
                    void send(created, null);
                  }}
                  title={summary.clientEmail ? `Envoyer à ${summary.clientEmail}` : 'Envoyer par mail'}
                />
                <Button
                  disabled={busy}
                  onPress={() => void closeAssistant(created.id)}
                  title="Pas maintenant"
                  variant="ghost"
                />
              </>
            )}
            <Pressable
              accessibilityLabel="Répondre à voix haute"
              accessibilityRole="button"
              disabled={busy || phase === 'listening'}
              onPress={() => {
                stopSpeaking();
                void talkAgain();
              }}
              style={({ pressed }) => [styles.mic, (busy || phase === 'listening') && styles.micDisabled, pressed && styles.micPressed]}>
              <SymbolView name="mic.fill" size={22} tintColor="#FFFFFF" />
              <Text style={styles.micText}>Parler</Text>
            </Pressable>
            {!created ? (
              <Button
                disabled={busy}
                onPress={() => void closeAssistant(null)}
                title="Modifier à l’écran"
                variant="ghost"
              />
            ) : null}
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
    sheet: {
      flex: 1,
      backgroundColor: colors.background,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
    },
    header: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      marginBottom: spacing.md,
    },
    headerTitle: {
      ...typography.title3,
      color: colors.text,
    },
    content: {
      gap: spacing.md,
      paddingBottom: spacing.lg,
    },
    card: {
      borderRadius: radius.xl,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.lg,
      gap: spacing.sm,
    },
    cardTitle: {
      ...typography.footnoteMedium,
      color: colors.textSecondary,
      textTransform: 'uppercase' as const,
    },
    client: {
      ...typography.title3,
      color: colors.text,
    },
    lineRow: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      gap: spacing.md,
    },
    lineLabel: {
      ...typography.subheadline,
      color: colors.text,
      flex: 1,
    },
    lineAmount: {
      ...typography.subheadlineMedium,
      color: colors.text,
      fontVariant: ['tabular-nums' as const],
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: spacing.xs,
    },
    totalLabel: {
      ...typography.footnote,
      color: colors.textSecondary,
    },
    totalValue: {
      ...typography.footnote,
      color: colors.textSecondary,
      fontVariant: ['tabular-nums' as const],
    },
    grandLabel: {
      ...typography.headline,
      color: colors.text,
    },
    grandValue: {
      ...typography.headline,
      color: colors.text,
      fontVariant: ['tabular-nums' as const],
    },
    previewLink: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.xs,
      marginTop: spacing.sm,
      minHeight: 44,
    },
    previewText: {
      ...typography.subheadlineMedium,
      color: colors.primary,
    },
    message: {
      ...typography.body,
      color: colors.text,
    },
    heard: {
      ...typography.footnote,
      color: colors.textSecondary,
    },
    error: {
      ...typography.footnote,
      color: colors.error,
    },
    status: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.sm,
    },
    statusText: {
      ...typography.subheadlineMedium,
      color: colors.primary,
    },
    actions: {
      gap: spacing.sm,
    },
    mic: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      gap: spacing.sm,
      minHeight: 50,
      borderRadius: radius.full,
      backgroundColor: colors.primary,
    },
    micDisabled: {
      opacity: 0.5,
    },
    micPressed: {
      opacity: 0.85,
    },
    micText: {
      ...typography.bodySemibold,
      color: '#FFFFFF',
    },
  }));
}
