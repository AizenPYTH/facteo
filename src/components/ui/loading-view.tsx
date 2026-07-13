import { ActivityIndicator, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';

type LoadingViewProps = {
  message?: string;
  size?: 'small' | 'large';
  style?: ViewStyle;
};

export function LoadingView({
  message = 'Chargement...',
  size = 'large',
  style,
}: LoadingViewProps) {
  const styles = useStyles();
  const colors = useColors();
  return (
    <View
      accessibilityLabel={message}
      accessibilityRole="progressbar"
      style={[styles.container, style]}>
      <ActivityIndicator color={colors.primary} size={size} />
      {message ? <Text style={styles.label}>{message}</Text> : null}
    </View>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xl,
  },
  label: {
    ...typography.subheadline,
    color: colors.textSecondary,
    textAlign: 'center',
  },
}));
}
