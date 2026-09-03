import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export async function triggerSelectionHaptic(): Promise<void> {
  if (Platform.OS === 'web') {
    return;
  }

  try {
    await Haptics.selectionAsync();
  } catch {
    // Haptics unavailable on simulator or unsupported device.
  }
}

export async function triggerImpactHaptic(
  style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light,
): Promise<void> {
  if (Platform.OS === 'web') {
    return;
  }

  try {
    await Haptics.impactAsync(style);
  } catch {
    // Haptics unavailable on simulator or unsupported device.
  }
}

/**
 * Confirmation d'une action réussie — enregistrement, envoi, conversion.
 * Réservé aux issues d'action : un retour à chaque changement d'état devient
 * du bruit et l'utilisateur finit par couper les vibrations du système.
 */
export async function triggerSuccessHaptic(): Promise<void> {
  if (Platform.OS === 'web') {
    return;
  }

  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {
    // Haptics unavailable on simulator or unsupported device.
  }
}

/** Échec d'une action. Même règle : uniquement sur une issue, jamais en cours. */
export async function triggerErrorHaptic(): Promise<void> {
  if (Platform.OS === 'web') {
    return;
  }

  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  } catch {
    // Haptics unavailable on simulator or unsupported device.
  }
}
