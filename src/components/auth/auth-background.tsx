import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
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

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/** INVEQ dark auth atmosphere — violet / indigo / deep navy. */
const DEEP = '#070A14';
const MID = '#12163A';
const ACCENT = '#312E81';
const GLOW_VIOLET = '#6366F1';
const GLOW_INDIGO = '#818CF8';
const GLOW_SOFT = '#A5B4FC';

type HaloConfig = {
  top: number;
  left: number;
  size: number;
  color: string;
  driftX: number;
  driftY: number;
  duration: number;
  delay: number;
};

const HALOS: HaloConfig[] = [
  {
    top: SCREEN_HEIGHT * 0.06,
    left: SCREEN_WIDTH * 0.08,
    size: 300,
    color: GLOW_VIOLET,
    driftX: 16,
    driftY: 10,
    duration: 16000,
    delay: 0,
  },
  {
    top: SCREEN_HEIGHT * 0.48,
    left: SCREEN_WIDTH * 0.52,
    size: 240,
    color: GLOW_INDIGO,
    driftX: -12,
    driftY: 14,
    duration: 18000,
    delay: 1400,
  },
  {
    top: SCREEN_HEIGHT * 0.22,
    left: SCREEN_WIDTH * -0.12,
    size: 200,
    color: GLOW_SOFT,
    driftX: 10,
    driftY: -8,
    duration: 20000,
    delay: 2600,
  },
];

function HaloOrb({ config }: { config: HaloConfig }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      config.delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: config.duration / 2, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: config.duration / 2, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        false,
      ),
    );
  }, [config.delay, config.duration, progress]);

  const style = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0.14, 0.32]),
    transform: [
      { translateX: interpolate(progress.value, [0, 1], [0, config.driftX]) },
      { translateY: interpolate(progress.value, [0, 1], [0, config.driftY]) },
      { scale: interpolate(progress.value, [0, 1], [0.94, 1.06]) },
    ],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.halo,
        {
          top: config.top,
          left: config.left,
          width: config.size,
          height: config.size,
          borderRadius: config.size / 2,
          backgroundColor: config.color,
        },
        style,
      ]}
    />
  );
}

/**
 * Living auth atmosphere — slow light, depth, no gadget particles.
 */
export function AuthBackground() {
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 11000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 11000, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
  }, [shimmer]);

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmer.value, [0, 1], [0.03, 0.1]),
    transform: [
      { translateX: interpolate(shimmer.value, [0, 1], [-SCREEN_WIDTH * 0.12, SCREEN_WIDTH * 0.12]) },
      { rotate: '16deg' },
    ],
  }));

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <LinearGradient
        colors={[DEEP, MID, ACCENT, DEEP]}
        end={{ x: 1, y: 1 }}
        locations={[0, 0.32, 0.68, 1]}
        start={{ x: 0, y: 0 }}
        style={StyleSheet.absoluteFill}
      />

      {HALOS.map((halo, index) => (
        <HaloOrb key={`halo-${index}`} config={halo} />
      ))}

      <Animated.View pointerEvents="none" style={[styles.shimmerBand, shimmerStyle]}>
        <LinearGradient
          colors={['transparent', 'rgba(165,180,252,0.28)', 'transparent']}
          end={{ x: 1, y: 0.5 }}
          start={{ x: 0, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      <LinearGradient
        colors={['rgba(99,102,241,0.12)', 'transparent', 'rgba(0,0,0,0.55)']}
        end={{ x: 0.5, y: 1 }}
        locations={[0, 0.42, 1]}
        start={{ x: 0.5, y: 0 }}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  halo: {
    position: 'absolute',
    shadowColor: GLOW_VIOLET,
    shadowOpacity: 0.4,
    shadowRadius: 56,
    shadowOffset: { width: 0, height: 0 },
  },
  shimmerBand: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.2,
    left: -SCREEN_WIDTH * 0.2,
    width: SCREEN_WIDTH * 1.4,
    height: SCREEN_HEIGHT * 0.32,
  },
});
