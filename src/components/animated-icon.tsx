import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

const DURATION_MS = 2200;
const BRAND_BLUE = '#0274DF';
const BRAND_DEEP = '#012F6B';
const BRAND_GLOW = '#4DA3FF';

type PremiumSplashOverlayProps = {
  onComplete?: () => void;
};

export function PremiumSplashOverlay({ onComplete }: PremiumSplashOverlayProps) {
  const opacity = useSharedValue(1);
  const logoScale = useSharedValue(0.76);
  const logoOpacity = useSharedValue(0);
  const glowOpacity = useSharedValue(0);
  const gradientShift = useSharedValue(0);

  useEffect(() => {
    logoOpacity.value = withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) });
    logoScale.value = withSequence(
      withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) }),
      withDelay(250, withTiming(1.06, { duration: 500, easing: Easing.inOut(Easing.sin) })),
      withTiming(1, { duration: 350, easing: Easing.out(Easing.quad) }),
    );
    glowOpacity.value = withDelay(
      180,
      withRepeat(
        withSequence(
          withTiming(0.5, { duration: 1100, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.16, { duration: 1100, easing: Easing.inOut(Easing.sin) }),
        ),
        2,
        false,
      ),
    );
    gradientShift.value = withRepeat(
      withTiming(1, { duration: 3200, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );

    opacity.value = withDelay(
      DURATION_MS - 500,
      withTiming(0, { duration: 520, easing: Easing.in(Easing.cubic) }, (finished) => {
        'worklet';
        if (finished && onComplete) {
          scheduleOnRN(onComplete);
        }
      }),
    );
  }, [glowOpacity, gradientShift, logoOpacity, logoScale, onComplete, opacity]);

  const overlayStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));
  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: 1 + interpolate(gradientShift.value, [0, 1], [0.92, 1.12]) }],
  }));
  const gradientStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(gradientShift.value, [0, 1], [-18, 18]) }],
  }));

  return (
    <Animated.View pointerEvents="none" style={[styles.overlay, overlayStyle]}>
      <Animated.View style={[StyleSheet.absoluteFill, gradientStyle]}>
        <LinearGradient
          colors={[BRAND_DEEP, '#014FA8', BRAND_BLUE, '#051E45']}
          end={{ x: 1, y: 1 }}
          locations={[0, 0.3, 0.68, 1]}
          start={{ x: 0, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      <Animated.View style={[styles.glow, glowStyle]} />
      <Animated.View style={logoStyle}>
        <Image
          accessibilityIgnoresInvertColors
          source={require('@/assets/images/facteo-logo.png')}
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
        source={require('@/assets/images/facteo-logo.png')}
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
  glow: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: BRAND_GLOW,
    shadowColor: BRAND_GLOW,
    shadowOpacity: 0.75,
    shadowRadius: 48,
    shadowOffset: { width: 0, height: 0 },
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 168,
    height: 46,
    resizeMode: 'contain',
  },
});
