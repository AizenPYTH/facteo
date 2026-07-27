import { useEffect, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { useColors } from '@/hooks/use-colors';

/** Premium splash: fade + zoom 0.8→1 + soft violet glow (~1.7s). */
const FADE_IN_MS = 700;
const HOLD_MS = 550;
const FADE_OUT_MS = 450;
const TOTAL_MS = FADE_IN_MS + HOLD_MS + FADE_OUT_MS;

type PremiumSplashOverlayProps = {
  onComplete?: () => void;
};

export function PremiumSplashOverlay({ onComplete }: PremiumSplashOverlayProps) {
  const colors = useColors();
  const overlayOpacity = useSharedValue(1);
  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.8);
  const glowProgress = useSharedValue(0);

  useEffect(() => {
    logoOpacity.value = withTiming(1, {
      duration: FADE_IN_MS,
      easing: Easing.out(Easing.cubic),
    });
    logoScale.value = withTiming(1, {
      duration: FADE_IN_MS + 120,
      easing: Easing.out(Easing.cubic),
    });
    glowProgress.value = withTiming(1, {
      duration: FADE_IN_MS + HOLD_MS,
      easing: Easing.out(Easing.quad),
    });

    overlayOpacity.value = withDelay(
      FADE_IN_MS + HOLD_MS,
      withTiming(0, { duration: FADE_OUT_MS, easing: Easing.in(Easing.cubic) }, (finished) => {
        'worklet';
        if (finished && onComplete) {
          scheduleOnRN(onComplete);
        }
      }),
    );
  }, [glowProgress, logoOpacity, logoScale, onComplete, overlayOpacity]);

  const overlayStyle = useAnimatedStyle(() => ({ opacity: overlayOpacity.value }));
  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));
  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glowProgress.value, [0, 0.45, 1], [0, 0.55, 0.28]),
    transform: [{ scale: interpolate(glowProgress.value, [0, 1], [0.7, 1.15]) }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.overlay, { backgroundColor: colors.background }, overlayStyle]}>
      <View style={styles.logoStage}>
        <Animated.View
          style={[
            styles.glow,
            { backgroundColor: colors.primary, shadowColor: colors.primary },
            glowStyle,
          ]}
        />
        <Animated.View style={logoStyle}>
          <Image
            accessibilityIgnoresInvertColors
            accessibilityLabel="INVEQ"
            source={require('@/assets/images/inveq-logo.png')}
            style={styles.logo}
          />
        </Animated.View>
      </View>
    </Animated.View>
  );
}

export function AnimatedSplashOverlay() {
  const [visible, setVisible] = useState(true);

  if (!visible) {
    return null;
  }

  return <PremiumSplashOverlay onComplete={() => setVisible(false)} />;
}

export function AnimatedIcon() {
  return (
    <View style={styles.iconWrap}>
      <Image
        accessibilityIgnoresInvertColors
        source={require('@/assets/images/inveq-logo.png')}
        style={styles.logo}
      />
    </View>
  );
}

void TOTAL_MS;

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  logoStage: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    opacity: 0.35,
    shadowOpacity: 0.65,
    shadowRadius: 48,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 180,
    height: 50,
    resizeMode: 'contain',
  },
});
