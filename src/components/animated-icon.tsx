import { useEffect, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { useColors } from '@/hooks/use-colors';

/** Short, premium entrance: fade + subtle zoom (~1s total). */
const FADE_IN_MS = 420;
const HOLD_MS = 380;
const FADE_OUT_MS = 320;
const TOTAL_MS = FADE_IN_MS + HOLD_MS + FADE_OUT_MS;

type PremiumSplashOverlayProps = {
  onComplete?: () => void;
};

export function PremiumSplashOverlay({ onComplete }: PremiumSplashOverlayProps) {
  const colors = useColors();
  const overlayOpacity = useSharedValue(1);
  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.96);

  useEffect(() => {
    logoOpacity.value = withTiming(1, {
      duration: FADE_IN_MS,
      easing: Easing.out(Easing.cubic),
    });
    logoScale.value = withTiming(1, {
      duration: FADE_IN_MS + 180,
      easing: Easing.out(Easing.cubic),
    });

    // Keep completion on the JS thread — avoid scheduleOnRN/worklet callbacks
    // which can SIGSEGV when given unstable closures on iOS.
    const fadeTimer = setTimeout(() => {
      overlayOpacity.value = withTiming(0, {
        duration: FADE_OUT_MS,
        easing: Easing.in(Easing.cubic),
      });
    }, FADE_IN_MS + HOLD_MS);

    const doneTimer = setTimeout(() => {
      onComplete?.();
    }, TOTAL_MS);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
  }, [logoOpacity, logoScale, onComplete, overlayOpacity]);

  const overlayStyle = useAnimatedStyle(() => ({ opacity: overlayOpacity.value }));
  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.overlay, { backgroundColor: colors.background }, overlayStyle]}>
      <Animated.View style={logoStyle}>
        <Image
          accessibilityIgnoresInvertColors
          accessibilityLabel="INVEQ"
          source={require('@/assets/images/inveq-logo.png')}
          style={styles.logo}
        />
      </Animated.View>
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

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
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
