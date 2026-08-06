import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandLogo } from '@/components/brand-logo';
import { useColors, useGradients } from '@/hooks/use-colors';
import { motion } from '@/constants/theme/design-system';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';

/**
 * Post-native splash while auth restores. Visual aligned with Claude recovery
 * splash brief: brand first, subtle gradient, light spinner — tokens from the
 * design system (no hardcoded marketing blues).
 */
export function AuthLoadingScreen() {
  const colors = useColors();
  const gradients = useGradients();
  const spin = useSharedValue(0);

  useEffect(() => {
    spin.value = withRepeat(
      withTiming(1, { duration: 1400, easing: Easing.linear }),
      -1,
      false,
    );
  }, [spin]);

  const spinnerStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spin.value * 360}deg` }],
  }));

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[gradients.primary[0], colors.primarySubtle, colors.background]}
        end={{ x: 0.5, y: 1 }}
        locations={[0, 0.38, 1]}
        start={{ x: 0.5, y: 0 }}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={styles.safe}>
        <Animated.View entering={FadeIn.duration(motion.slow)} style={styles.content}>
          <View style={[styles.logoPlate, { backgroundColor: colors.surface }]}>
            <BrandLogo size={72} />
          </View>

          <Animated.View entering={FadeInDown.delay(80).duration(motion.normal)}>
            <Text accessibilityRole="header" style={[styles.brand, { color: colors.text }]}>
              INVEQ
            </Text>
            <Text style={[styles.tagline, { color: colors.textSecondary }]}>
              Facturation professionnelle
            </Text>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.delay(160).duration(motion.normal)}
            style={styles.spinnerBlock}>
            <Animated.View style={[styles.spinnerRing, spinnerStyle]}>
              <View
                style={[
                  styles.spinnerArc,
                  {
                    borderColor: `${colors.primary}33`,
                    borderTopColor: colors.primary,
                  },
                ]}
              />
            </Animated.View>
            <Text style={[styles.loadingLabel, { color: colors.textTertiary }]}>Chargement…</Text>
          </Animated.View>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
  },
  logoPlate: {
    width: 96,
    height: 96,
    borderRadius: radius.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: {
    ...typography.title1,
    textAlign: 'center',
    letterSpacing: 1.2,
  },
  tagline: {
    ...typography.subheadline,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  spinnerBlock: {
    marginTop: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
  },
  spinnerRing: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinnerArc: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 3,
  },
  loadingLabel: {
    ...typography.caption1,
  },
});
