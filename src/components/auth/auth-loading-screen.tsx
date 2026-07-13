import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { AuthBackground } from '@/components/auth/auth-background';
import { BrandLogo } from '@/components/brand-logo';
import { LoadingView } from '@/components/ui/loading-view';
import { spacing } from '@/constants/theme/spacing';

export function AuthLoadingScreen() {
  return (
    <View style={styles.container}>
      <AuthBackground />
      <Animated.View entering={FadeIn.duration(600)} style={styles.content}>
        <BrandLogo size={112} />
        <Animated.View entering={FadeInDown.delay(200).duration(500)}>
          <LoadingView message="Chargement..." size="small" />
        </Animated.View>
      </Animated.View>
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.25)']}
        style={StyleSheet.absoluteFill}
      />
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
