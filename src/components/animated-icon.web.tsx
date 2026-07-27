import { StyleSheet, View } from 'react-native';
import Animated, { Easing, FadeIn, Keyframe } from 'react-native-reanimated';

import { BrandMark } from '@/components/brand/brand-mark';

const DURATION = 900;

export function AnimatedSplashOverlay() {
  return null;
}

const logoKeyframe = new Keyframe({
  0: {
    opacity: 0,
    transform: [{ scale: 0.96 }],
  },
  100: {
    transform: [{ scale: 1 }],
    opacity: 1,
    easing: Easing.out(Easing.cubic),
  },
});

export function AnimatedIcon() {
  return (
    <View style={styles.iconContainer}>
      <Animated.View entering={logoKeyframe.duration(DURATION)} style={styles.imageContainer}>
        <BrandMark size={128} />
      </Animated.View>
    </View>
  );
}

export function PremiumSplashOverlay() {
  return (
    <Animated.View entering={FadeIn.duration(400)} style={styles.iconContainer}>
      <BrandMark size={128} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 128,
    height: 128,
  },
  imageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
