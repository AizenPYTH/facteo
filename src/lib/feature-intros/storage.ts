import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  FEATURE_INTRO_IDS,
  featureIntroStorageKey,
  type FeatureIntroId,
} from '@/lib/feature-intros/types';

export async function hasSeenFeatureIntro(id: FeatureIntroId): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(featureIntroStorageKey(id));
    return value === '1' || value === 'true';
  } catch {
    return false;
  }
}

export async function markFeatureIntroSeen(id: FeatureIntroId): Promise<void> {
  try {
    await AsyncStorage.setItem(featureIntroStorageKey(id), '1');
  } catch {
    // Persistence failures must never block the feature.
  }
}

export async function resetFeatureIntro(id: FeatureIntroId): Promise<void> {
  try {
    await AsyncStorage.removeItem(featureIntroStorageKey(id));
  } catch {
    // ignore
  }
}

export async function resetAllFeatureIntros(): Promise<void> {
  await Promise.all(FEATURE_INTRO_IDS.map((id) => resetFeatureIntro(id)));
}

export async function getFeatureIntroSeenMap(): Promise<Record<FeatureIntroId, boolean>> {
  const entries = await Promise.all(
    FEATURE_INTRO_IDS.map(async (id) => [id, await hasSeenFeatureIntro(id)] as const),
  );
  return Object.fromEntries(entries) as Record<FeatureIntroId, boolean>;
}
