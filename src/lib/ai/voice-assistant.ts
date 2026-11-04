import { setAudioModeAsync } from 'expo-audio';
import * as Speech from 'expo-speech';
import { Platform } from 'react-native';

import { callAiEdgeFunction } from '@/lib/ai/edge-ai';

/**
 * Conversation vocale qui suit « Dis Siri, facture INVEQ » : l'app lit la
 * facture préparée, pose une question, écoute la réponse et la fait
 * comprendre par l'IA (`voice-assistant-reply`).
 */

export type VoiceAssistantStage = 'confirm_invoice' | 'confirm_send';

export type VoiceAssistantAction = 'confirm' | 'confirm_and_send' | 'send' | 'cancel' | 'unclear';

export type VoiceAssistantReply = {
  transcript: string;
  action: VoiceAssistantAction;
  /** Adresse e-mail dictée, s'il y en a une. */
  email: string | null;
};

const ACTIONS: VoiceAssistantAction[] = ['confirm', 'confirm_and_send', 'send', 'cancel', 'unclear'];

export async function interpretVoiceReply(input: {
  stage: VoiceAssistantStage;
  audioBase64: string;
  mimeType: string;
}): Promise<VoiceAssistantReply> {
  const payload = await callAiEdgeFunction<Partial<VoiceAssistantReply>>(
    'voice-assistant-reply',
    { ...input, platform: Platform.OS },
    'Réponse non comprise. Réessayez.',
  );
  const action = ACTIONS.find((entry) => entry === payload.action) ?? 'unclear';
  return {
    transcript: typeof payload.transcript === 'string' ? payload.transcript.trim() : '',
    action,
    email: typeof payload.email === 'string' && payload.email.includes('@') ? payload.email : null,
  };
}

/**
 * Lit un texte à voix haute, en français, sur le haut-parleur (même en mode
 * silencieux), et rend la main quand la phrase est finie.
 */
export async function speakFrench(text: string): Promise<void> {
  await setAudioModeAsync({
    allowsRecording: true,
    playsInSilentMode: true,
    shouldPlayInBackground: false,
  }).catch(() => undefined);
  await Speech.stop().catch(() => undefined);

  await new Promise<void>((resolve) => {
    // Garde-fou : une phrase ne dure jamais 20 secondes.
    const timer = setTimeout(resolve, 20_000);
    const done = () => {
      clearTimeout(timer);
      resolve();
    };
    Speech.speak(text, {
      language: 'fr-FR',
      rate: 1.02,
      onDone: done,
      onStopped: done,
      onError: done,
    });
  });
}

export function stopSpeaking(): void {
  void Speech.stop().catch(() => undefined);
}

/** Montant lisible à voix haute : « 960 euros », « 1 234,50 euros ». */
export function spokenAmount(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  const text = new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: Number.isInteger(rounded) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(rounded);
  return `${text} euros`;
}
