import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import { Dimensions } from 'react-native';
import {
  Easing,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { authOpening, duration, spring } from '@/constants/theme/motion';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

/** Act 1 (centered brand) → Act 2 (header). */
const ACT1_FADE_MS = authOpening.act1Fade;
const ACT1_HOLD_MS = authOpening.act1Hold;
const ACT2_MORPH_MS = authOpening.act2Morph;

export const AUTH_MARK_SPLASH_SIZE = authOpening.markSplashSize;
export const AUTH_MARK_HEADER_SIZE = authOpening.markHeaderSize;

/** Approximate travel from vertical center to header slot. */
export const AUTH_MARK_TRAVEL_Y = -(SCREEN_HEIGHT * 0.28);

type AuthOpeningContextValue = {
  /** 0 = splash centered, 1 = header settled. */
  progress: SharedValue<number>;
  logoOpacity: SharedValue<number>;
  glowProgress: SharedValue<number>;
  contentOpacity: SharedValue<number>;
  contentReady: boolean;
};

const AuthOpeningContext = createContext<AuthOpeningContextValue | null>(null);

export function useAuthOpening() {
  const value = useContext(AuthOpeningContext);
  if (!value) {
    throw new Error('useAuthOpening must be used within AuthOpeningProvider');
  }
  return value;
}

export function AuthOpeningProvider({ children }: PropsWithChildren) {
  const progress = useSharedValue(0);
  const logoOpacity = useSharedValue(0);
  const glowProgress = useSharedValue(0);
  const contentOpacity = useSharedValue(0);
  const [contentReady, setContentReady] = useState(false);

  useEffect(() => {
    logoOpacity.value = withTiming(1, {
      duration: ACT1_FADE_MS,
      easing: Easing.out(Easing.cubic),
    });
    glowProgress.value = withTiming(1, {
      duration: ACT1_FADE_MS + ACT1_HOLD_MS,
      easing: Easing.out(Easing.quad),
    });

    progress.value = withDelay(
      ACT1_FADE_MS + ACT1_HOLD_MS,
      withSpring(1, spring.gentle, (finished) => {
        'worklet';
        if (finished) {
          scheduleOnRN(setContentReady, true);
        }
      }),
    );

    contentOpacity.value = withDelay(
      ACT1_FADE_MS + ACT1_HOLD_MS + 80,
      withTiming(1, { duration: ACT2_MORPH_MS, easing: Easing.out(Easing.cubic) }),
    );
  }, [contentOpacity, glowProgress, logoOpacity, progress]);

  const value = useMemo(
    () => ({
      progress,
      logoOpacity,
      glowProgress,
      contentOpacity,
      contentReady,
    }),
    [contentOpacity, contentReady, glowProgress, logoOpacity, progress],
  );

  return <AuthOpeningContext.Provider value={value}>{children}</AuthOpeningContext.Provider>;
}
