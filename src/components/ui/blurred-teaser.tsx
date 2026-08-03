import { BlurView } from 'expo-blur';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { radius } from '@/constants/theme/radius';
import { useThemePreference } from '@/providers/theme-preference-provider';

type BlurredTeaserProps = {
  /** When false, renders `children` untouched — no wrapper overhead. */
  active: boolean;
  intensity?: number;
  /** Corner radius of the blur mask — match the surface being teased. */
  cornerRadius?: number;
  children: ReactNode;
  /** Interactive content (e.g. an upgrade CTA) centered over the blur. */
  overlay?: ReactNode;
};

/**
 * Shows real content softly blurred instead of a flat `opacity` dim. The
 * viewer can tell there's substance behind the lock (real numbers, a real
 * chart) — that's what makes unlocking feel worth it, without resorting to
 * a dark pattern that hides or fakes the data.
 */
export function BlurredTeaser({
  active,
  intensity = 22,
  cornerRadius = radius.card,
  children,
  overlay,
}: BlurredTeaserProps) {
  const { colorScheme } = useThemePreference();

  if (!active) {
    return <>{children}</>;
  }

  return (
    <View style={[styles.wrap, { borderRadius: cornerRadius }]}>
      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" pointerEvents="none">
        {children}
      </View>
      <BlurView
        intensity={intensity}
        pointerEvents="none"
        style={StyleSheet.absoluteFill}
        tint={colorScheme === 'dark' ? 'dark' : 'light'}
      />
      {overlay ? <View style={styles.overlay}>{overlay}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
