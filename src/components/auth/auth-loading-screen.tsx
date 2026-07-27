import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { AuthBackground } from '@/components/auth/auth-background';
import { BrandMark } from '@/components/brand/brand-mark';
import { LoadingView } from '@/components/ui/loading-view';
import { duration } from '@/constants/theme/motion';
import { spacing } from '@/constants/theme/spacing';

export function AuthLoadingScreen() {
  return (
    <View style={styles.container}>
      <AuthBackground />
      <Animated.View entering={FadeIn.duration(duration.slow)} style={styles.content}>
        <BrandMark size={96} />
        <Animated.View entering={FadeInDown.delay(160).duration(duration.normal)}>
          <LoadingView message="Chargement…" size="small" />
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070A14',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
});
