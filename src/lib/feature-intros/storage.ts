import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  FEATURE_INTRO_IDS,
  featureIntroStorageKey,
  type FeatureIntroId,
} from '@/lib/feature-intros/types';

const FEATURE_INTRO_LAST_PRESENTED_KEY = 'feature_intro_last_presented_at';
export const FEATURE_INTRO_MIN_GAP_MS = 2 * 24 * 60 * 60 * 1000;

let featureIntroClaimedThisSession = false;

export async function hasSeenFeatureIntro(id: FeatureIntroId): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(featureIntroStorageKey(id));
    return value === '1' || value === 'true';
  } catch {
    return false;
  }
}

/**
 * Reserves the single automatic intro allowed in this app session.
 * Replays started from "Découvrir INVEQ" bypass this guard in the hook.
 */
export async function claimFeatureIntroPresentation(id: FeatureIntroId): Promise<boolean> {
  if (featureIntroClaimedThisSession) {
    return false;
  }

  featureIntroClaimedThisSession = true;

  if (await hasSeenFeatureIntro(id)) {
    featureIntroClaimedThisSession = false;
    return false;
  }

  try {
    const storedValue = await AsyncStorage.getItem(FEATURE_INTRO_LAST_PRESENTED_KEY);
    const lastPresentedAt = storedValue ? Number(storedValue) : 0;
    const isCoolingDown =
      Number.isFinite(lastPresentedAt) &&
      lastPresentedAt > 0 &&
      Date.now() - lastPresentedAt < FEATURE_INTRO_MIN_GAP_MS;

    if (isCoolingDown) {
      featureIntroClaimedThisSession = false;
      return false;
    }

    await AsyncStorage.setItem(FEATURE_INTRO_LAST_PRESENTED_KEY, String(Date.now()));
  } catch {
    // Storage failures must not block the intro for the current session.
  }

  return true;
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
  featureIntroClaimedThisSession = false;
  await Promise.all([
    ...FEATURE_INTRO_IDS.map((id) => resetFeatureIntro(id)),
    AsyncStorage.removeItem(FEATURE_INTRO_LAST_PRESENTED_KEY).catch(() => undefined),
  ]);
}

export async function getFeatureIntroSeenMap(): Promise<Record<FeatureIntroId, boolean>> {
  const entries = await Promise.all(
    FEATURE_INTRO_IDS.map(async (id) => [id, await hasSeenFeatureIntro(id)] as const),
  );
  return Object.fromEntries(entries) as Record<FeatureIntroId, boolean>;
}
