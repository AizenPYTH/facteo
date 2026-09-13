import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import { BrandLogo } from '@/components/brand-logo';
import { LoadingView } from '@/components/ui/loading-view';
import { StaggerIn } from '@/components/ui/stagger-in';
import { spacing } from '@/constants/theme/spacing';
import { useColors } from '@/hooks/use-colors';

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
      <StaggerIn index={0} style={styles.content}>
        <BrandLogo size={96} />
        <StaggerIn index={1}>
          <LoadingView message="Chargement…" size="small" />
        </StaggerIn>
      </StaggerIn>
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
