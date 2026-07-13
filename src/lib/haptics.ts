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
