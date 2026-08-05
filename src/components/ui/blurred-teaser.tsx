import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { radius } from '@/constants/theme/radius';

type BlurredTeaserProps = {
  /** When false, renders `children` untouched — no wrapper overhead. */
  active: boolean;
  intensity?: number;
  /** Corner radius of the mask — match the surface being teased. */
  cornerRadius?: number;
  children: ReactNode;
  /** Interactive content (e.g. an upgrade CTA) centered over the lock. */
  overlay?: ReactNode;
};

/**
 * Lot 03a isolation: no expo-blur / BlurView on the Dashboard mount path.
 * Locked content stays dimmed with a plain opacity overlay instead.
 */
export function BlurredTeaser({
  active,
  cornerRadius = radius.card,
  children,
  overlay,
}: BlurredTeaserProps) {
  if (!active) {
    return <>{children}</>;
  }

  return (
    <View style={[styles.wrap, { borderRadius: cornerRadius }]}>
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        pointerEvents="none"
        style={styles.dimmed}>
        {children}
      </View>
      {overlay ? <View style={styles.overlay}>{overlay}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
  },
  dimmed: {
    opacity: 0.35,
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
