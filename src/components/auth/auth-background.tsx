import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo } from 'react';
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

const BRAND_BLUE = '#0274DF';
const BRAND_DEEP = '#012F6B';
const BRAND_MID = '#014FA8';
const BRAND_GLOW = '#4DA3FF';
const BRAND_ACCENT = '#7EC8FF';

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

type ParticleConfig = {
  left: number;
  top: number;
  size: number;
  duration: number;
  delay: number;
  driftX: number;
  driftY: number;
};

const HALOS: HaloConfig[] = [
  {
    top: SCREEN_HEIGHT * 0.08,
    left: SCREEN_WIDTH * 0.12,
    size: 280,
    color: BRAND_GLOW,
    driftX: 18,
    driftY: 12,
    duration: 14000,
    delay: 0,
  },
  {
    top: SCREEN_HEIGHT * 0.52,
    left: SCREEN_WIDTH * 0.58,
    size: 220,
    color: BRAND_ACCENT,
    driftX: -14,
    driftY: 10,
    duration: 16000,
    delay: 1200,
  },
  {
    top: SCREEN_HEIGHT * 0.28,
    left: SCREEN_WIDTH * -0.08,
    size: 180,
    color: '#1E5FD4',
    driftX: 10,
    driftY: -8,
    duration: 18000,
    delay: 2400,
  },
];

function buildParticles(): ParticleConfig[] {
  const seeds = [
    [0.12, 0.18, 3, 11000, 0, 8, -14],
    [0.28, 0.32, 2, 13000, 400, -6, 10],
    [0.45, 0.14, 2.5, 15000, 800, 10, 12],
    [0.62, 0.26, 3, 12000, 200, -8, -10],
    [0.78, 0.38, 2, 14000, 600, 6, 8],
    [0.88, 0.16, 2.5, 16000, 1000, -10, 6],
    [0.18, 0.55, 2, 12500, 300, 7, -9],
    [0.35, 0.68, 3, 13500, 700, -5, 11],
    [0.52, 0.72, 2, 14500, 500, 9, -7],
    [0.7, 0.58, 2.5, 15500, 900, -7, 9],
    [0.82, 0.78, 2, 11800, 1100, 5, -12],
    [0.08, 0.82, 3, 12800, 1300, -6, 8],
    [0.42, 0.44, 1.5, 17000, 1500, 4, -5],
    [0.58, 0.48, 1.5, 16500, 1700, -4, 6],
    [0.92, 0.52, 2, 13200, 1900, 8, -8],
  ] as const;

  return seeds.map(([left, top, size, duration, delay, driftX, driftY]) => ({
    left: left * SCREEN_WIDTH,
    top: top * SCREEN_HEIGHT,
    size,
    duration,
    delay,
    driftX,
    driftY,
  }));
}

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
    opacity: interpolate(progress.value, [0, 1], [0.18, 0.38]),
    transform: [
      { translateX: interpolate(progress.value, [0, 1], [0, config.driftX]) },
      { translateY: interpolate(progress.value, [0, 1], [0, config.driftY]) },
      { scale: interpolate(progress.value, [0, 1], [0.92, 1.08]) },
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

function FloatingParticle({ config }: { config: ParticleConfig }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      config.delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: config.duration / 2, easing: Easing.inOut(Easing.quad) }),
          withTiming(0, { duration: config.duration / 2, easing: Easing.inOut(Easing.quad) }),
        ),
        -1,
        false,
      ),
    );
  }, [config.delay, config.duration, progress]);

  const style = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.5, 1], [0.12, 0.55, 0.12]),
    transform: [
      { translateX: interpolate(progress.value, [0, 1], [0, config.driftX]) },
      { translateY: interpolate(progress.value, [0, 1], [0, config.driftY]) },
      { scale: interpolate(progress.value, [0, 1], [0.85, 1.15]) },
    ],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.particle,
        {
          left: config.left,
          top: config.top,
          width: config.size,
          height: config.size,
          borderRadius: config.size,
        },
        style,
      ]}
    />
  );
}

export function AuthBackground() {
  const particles = useMemo(() => buildParticles(), []);
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 9000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 9000, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
  }, [shimmer]);

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmer.value, [0, 1], [0.04, 0.12]),
    transform: [
      { translateX: interpolate(shimmer.value, [0, 1], [-SCREEN_WIDTH * 0.15, SCREEN_WIDTH * 0.15]) },
      { rotate: '18deg' },
    ],
  }));

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <LinearGradient
        colors={[BRAND_DEEP, BRAND_MID, BRAND_BLUE, '#051E45']}
        end={{ x: 1, y: 1 }}
        locations={[0, 0.35, 0.7, 1]}
        start={{ x: 0, y: 0 }}
        style={StyleSheet.absoluteFill}
      />

      {HALOS.map((halo, index) => (
        <HaloOrb key={`halo-${index}`} config={halo} />
      ))}

      {particles.map((particle, index) => (
        <FloatingParticle key={`particle-${index}`} config={particle} />
      ))}

      <Animated.View pointerEvents="none" style={[styles.shimmerBand, shimmerStyle]}>
        <LinearGradient
          colors={['transparent', 'rgba(255,255,255,0.35)', 'transparent']}
          end={{ x: 1, y: 0.5 }}
          start={{ x: 0, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      <LinearGradient
        colors={['rgba(255,255,255,0.06)', 'transparent', 'rgba(0,0,0,0.42)']}
        end={{ x: 0.5, y: 1 }}
        locations={[0, 0.45, 1]}
        start={{ x: 0.5, y: 0 }}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  halo: {
    position: 'absolute',
    shadowColor: BRAND_GLOW,
    shadowOpacity: 0.45,
    shadowRadius: 48,
    shadowOffset: { width: 0, height: 0 },
  },
  particle: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  shimmerBand: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.22,
    left: -SCREEN_WIDTH * 0.2,
    width: SCREEN_WIDTH * 1.4,
    height: SCREEN_HEIGHT * 0.35,
  },
});
