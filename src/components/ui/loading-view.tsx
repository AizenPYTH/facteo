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
  message = 'Chargement…',
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
      <View style={styles.indicatorWrap}>
        <ActivityIndicator color={colors.primary} size={size} />
      </View>
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
  indicatorWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySubtle,
  },
  label: {
    ...typography.subheadline,
    color: colors.textSecondary,
    textAlign: 'center',
  },
}));
}
