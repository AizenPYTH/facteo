import { File } from 'expo-file-system';
import {
  AudioModule,
  RecordingPresets,
  getRecordingPermissionsAsync,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
} from 'expo-audio';
import { Linking } from 'react-native';

export type VoicePermissionState = 'granted' | 'denied' | 'blocked';

export type VoiceRecordingSession = {
  recorder: VoiceRecorder;
  startedAt: number;
};

export type VoiceRecordingPayload = {
  uri: string;
  mimeType: string;
  durationMs: number;
  audioBase64: string;
};

export async function requestMicrophonePermission(): Promise<VoicePermissionState> {
  const permission = await requestRecordingPermissionsAsync();

  if (permission.granted) {
    return 'granted';
  }

  return permission.canAskAgain ? 'denied' : 'blocked';
}

export async function getMicrophonePermissionState(): Promise<VoicePermissionState> {
  const permission = await getRecordingPermissionsAsync();

  if (permission.granted) {
    return 'granted';
  }

  return permission.canAskAgain ? 'denied' : 'blocked';
}

export async function openSystemSettings(): Promise<void> {
  await Linking.openSettings();
}

export async function startVoiceRecording(): Promise<VoiceRecordingSession> {
  await setAudioModeAsync({
    allowsRecording: true,
    playsInSilentMode: true,
    shouldPlayInBackground: false,
  });

  const recorder = new AudioModule.AudioRecorder(
    RecordingPresets.HIGH_QUALITY,
  ) as unknown as VoiceRecorder;
  await recorder.prepareToRecordAsync();
  recorder.record();

  return {
    recorder,
    startedAt: Date.now(),
  };
}

export async function stopVoiceRecording(
  session: VoiceRecordingSession,
): Promise<VoiceRecordingPayload> {
  await session.recorder.stop();

  const uri = session.recorder.uri;

  if (!uri) {
    throw new Error('Impossible de récupérer l’audio enregistré.');
  }

  const audioBase64 = await new File(uri).base64();

  if (!audioBase64 || audioBase64.length < 32) {
    throw new Error('Audio invalide. Réessayez.');
  }

  return {
    uri,
    mimeType: resolveAudioMimeType(uri),
    durationMs: Math.max(0, Date.now() - session.startedAt),
    audioBase64,
  };
}

type VoiceRecorder = {
  prepareToRecordAsync: () => Promise<void>;
  record: () => void;
  stop: () => Promise<void>;
  uri: string | null;
};

function resolveAudioMimeType(uri: string): string {
  const lowerUri = uri.toLowerCase();

  if (lowerUri.endsWith('.m4a')) {
    return 'audio/mp4';
  }

  if (lowerUri.endsWith('.aac')) {
    return 'audio/aac';
  }

  if (lowerUri.endsWith('.wav')) {
    return 'audio/wav';
  }

  return 'audio/mp4';
}
