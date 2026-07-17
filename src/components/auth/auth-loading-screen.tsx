import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

import { BrandLogo } from '@/components/brand-logo';
import { LoadingView } from '@/components/ui/loading-view';
import { useColors } from '@/hooks/use-colors';
import { motion } from '@/constants/theme/design-system';
import { spacing } from '@/constants/theme/spacing';

export function AuthLoadingScreen() {
  const colors = useColors();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.primarySubtle, colors.background, colors.background]}
        end={{ x: 0.5, y: 1 }}
        locations={[0, 0.45, 1]}
        start={{ x: 0.5, y: 0 }}
        style={StyleSheet.absoluteFill}
      />
      <Animated.View entering={FadeIn.duration(motion.slow)} style={styles.content}>
        <BrandLogo size={96} />
        <Animated.View entering={FadeInDown.delay(160).duration(motion.normal)}>
          <LoadingView message="Chargement…" size="small" />
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
});
