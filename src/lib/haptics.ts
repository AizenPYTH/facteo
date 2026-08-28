import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

import { hapticIntent, type FeedbackRecipe } from '@/constants/theme/interaction';

export async function triggerSelectionHaptic(): Promise<void> {
  return triggerHaptic('selection');
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

/** Interaction-language entry point — prefer this in new UI. */
export async function triggerHaptic(
  intent: keyof typeof hapticIntent,
): Promise<void> {
  if (Platform.OS === 'web') {
    return;
  }

  try {
    const spec = hapticIntent[intent];
    if (spec.type === 'selection') {
      await Haptics.selectionAsync();
      return;
    }
    if (spec.type === 'impact') {
      await Haptics.impactAsync(spec.style);
      return;
    }
    await Haptics.notificationAsync(spec.style);
  } catch {
    // Haptics unavailable on simulator or unsupported device.
  }
}

export async function triggerFeedbackHaptic(
  recipe: FeedbackRecipe,
): Promise<void> {
  if (recipe === 'success') {
    return triggerHaptic('notificationSuccess');
  }
  if (recipe === 'error') {
    return triggerHaptic('notificationError');
  }
  return triggerHaptic('selection');
}
