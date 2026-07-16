import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';

import { DESKTOP_MAX_CONTENT_WIDTH } from '@/constants/theme/breakpoints';
import { spacing } from '@/constants/theme/spacing';
import { useThemedStyles } from '@/hooks/use-colors';

type DesktopPageProps = {
  children: ReactNode;
  scrollable?: boolean;
  padded?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
};

export function DesktopPage({
  children,
  scrollable = true,
  padded = true,
  fullWidth = true,
  style,
}: DesktopPageProps) {
  const styles = useStyles();

  const content = (
    <View style={[styles.content, padded && styles.padded, style]}>{children}</View>
  );

  if (!scrollable) {
    return <View style={styles.page}>{content}</View>;
  }

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      style={styles.page}>
      {content}
    </ScrollView>
  );
}

const useStyles = () =>
  useThemedStyles((colors) => ({
    page: {
      flex: 1,
      backgroundColor: colors.backgroundGrouped,
    },
    scrollContent: {
      flexGrow: 1,
    },
    content: {
      width: '100%',
      ...(DESKTOP_MAX_CONTENT_WIDTH
        ? { maxWidth: DESKTOP_MAX_CONTENT_WIDTH, alignSelf: 'center' as const }
        : {}),
    },
    padded: {
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.xl,
      gap: spacing.xl,
    },
  }));
