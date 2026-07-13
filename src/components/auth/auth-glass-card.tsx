import type { ReactNode } from 'react';
import { BlurView } from 'expo-blur';
import { Platform, StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useColors } from '@/hooks/use-colors';
import { spacing } from '@/constants/theme/spacing';
import { radius } from '@/constants/theme/radius';

type AuthGlassCardProps = {
  children: ReactNode;
  delay?: number;
  style?: ViewStyle;
};

export function AuthGlassCard({ children, delay = 0, style }: AuthGlassCardProps) {
  const colors = useColors();

  const content = (
    <View
      style={[
        styles.card,
        {
          borderColor: colors.border,
          backgroundColor: Platform.OS === 'web' ? colors.surface : 'rgba(255,255,255,0.12)',
        },
        style,
      ]}>
      {children}
    </View>
  );

  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(500).springify()}>
      {Platform.OS === 'ios' ? (
        <BlurView intensity={40} style={styles.blur} tint="dark">
          {content}
        </BlurView>
      ) : (
        content
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  blur: {
    borderRadius: radius.card,
    overflow: 'hidden',
  },
  card: {
    borderRadius: radius.card,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.sm,
    overflow: 'hidden',
  },
});
