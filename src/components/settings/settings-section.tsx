import { type ReactNode } from 'react';
import { Text, View } from 'react-native';

import { useThemedStyles } from '@/hooks/use-colors';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { textHierarchy } from '@/constants/theme/typography';

type SettingsSectionProps = {
  title?: string;
  footer?: string;
  children: ReactNode;
};

export function SettingsSection({ title, footer, children }: SettingsSectionProps) {
  const styles = useStyles();

  return (
    <View style={styles.section}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      <View style={styles.group}>{children}</View>
      {footer ? <Text style={styles.footer}>{footer}</Text> : null}
    </View>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
    section: {
      gap: spacing.xs,
    },
    title: {
      ...textHierarchy.caption,
      color: colors.textSecondary,
      textTransform: 'uppercase',
      paddingHorizontal: spacing.xs,
      fontWeight: '500',
    },
    group: {
      backgroundColor: colors.surface,
      borderRadius: radius.card,
      overflow: 'hidden',
    },
    footer: {
      ...textHierarchy.caption,
      color: colors.textSecondary,
      paddingHorizontal: spacing.xs,
    },
  }));
}
