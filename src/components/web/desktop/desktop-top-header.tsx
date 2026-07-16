import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { useThemedStyles } from '@/hooks/use-colors';
import { spacing } from '@/constants/theme/spacing';

type DesktopTopHeaderProps = {
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
};

export function DesktopTopHeader({ title, subtitle, actions }: DesktopTopHeaderProps) {
  const styles = useStyles();

  return (
    <View style={styles.header}>
      <View style={styles.titles}>
        {title ? (
          <AppText accessibilityRole="header" variant="title">
            {title}
          </AppText>
        ) : null}
        {subtitle ? (
          <AppText color="secondary" variant="subtitle">
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {actions ? <View style={styles.actions}>{actions}</View> : null}
    </View>
  );
}

const useStyles = () =>
  useThemedStyles((colors) => ({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.lg,
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.lg,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
      backgroundColor: colors.surface,
    },
    titles: {
      flex: 1,
      gap: 2,
      minWidth: 0,
    },
    actions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
  }));
