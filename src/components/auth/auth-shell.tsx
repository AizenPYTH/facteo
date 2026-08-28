import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { AuthBackground } from '@/components/auth/auth-background';
import {
  AUTH_MARK_HEADER_SIZE,
  AUTH_MARK_SPLASH_SIZE,
  AUTH_MARK_TRAVEL_Y,
  AuthOpeningProvider,
  useAuthOpening,
} from '@/components/auth/auth-opening';
import { BrandMark } from '@/components/brand/brand-mark';
import { spacing } from '@/constants/theme/spacing';

type AuthShellProps = {
  children: ReactNode;
};

function AuthShellScene({ children }: AuthShellProps) {
  const { progress, logoOpacity, glowProgress, contentOpacity, contentReady } = useAuthOpening();

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [
      { translateY: interpolate(progress.value, [0, 1], [0, AUTH_MARK_TRAVEL_Y]) },
      {
        scale: interpolate(
          progress.value,
          [0, 1],
          [1, AUTH_MARK_HEADER_SIZE / AUTH_MARK_SPLASH_SIZE],
        ),
      },
    ],
    width: AUTH_MARK_SPLASH_SIZE,
    height: AUTH_MARK_SPLASH_SIZE,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glowProgress.value, [0, 0.45, 1], [0, 0.55, 0.22]) *
      interpolate(progress.value, [0, 1], [1, 0.35]),
    transform: [
      { scale: interpolate(glowProgress.value, [0, 1], [0.7, 1.12]) },
      {
        scale: interpolate(progress.value, [0, 1], [1, 0.55]),
      },
    ],
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: interpolate(contentOpacity.value, [0, 1], [18, 0]) }],
  }));

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <AuthBackground />
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <View style={styles.stage} pointerEvents="box-none">
          <Animated.View pointerEvents="none" style={[styles.logoAnchor, logoStyle]}>
            <Animated.View style={[styles.glow, glowStyle]} />
            <BrandMark size={AUTH_MARK_SPLASH_SIZE} />
          </Animated.View>
        </View>

        <Animated.View
          pointerEvents={contentReady ? 'auto' : 'none'}
          style={[styles.content, contentStyle]}>
          {children}
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

/**
 * Persistent auth scene: living background + BrandMark that never unmounts.
 * Splash is Act 1 of this same tree — no overlay cut.
 */
export function AuthShell({ children }: AuthShellProps) {
  return (
    <AuthOpeningProvider>
      <AuthShellScene>{children}</AuthShellScene>
    </AuthOpeningProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#070A14',
  },
  safeArea: {
    flex: 1,
  },
  stage: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  logoAnchor: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#6366F1',
    shadowColor: '#6366F1',
    shadowOpacity: 0.65,
    shadowRadius: 48,
    shadowOffset: { width: 0, height: 0 },
  },
  content: {
    flex: 1,
    zIndex: 1,
    paddingTop: spacing['3xl'] + AUTH_MARK_HEADER_SIZE + spacing.md,
  },
});
