import { type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useThemedStyles } from '@/hooks/use-colors';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { elevation } from '@/constants/theme/surfaces';
import { type } from '@/constants/theme/type-roles';

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
      ...type.caption,
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
      paddingHorizontal: spacing.xs,
      fontWeight: '600',
    },
    group: {
      backgroundColor: colors.surface,
      borderRadius: radius.card,
      overflow: 'hidden',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      ...elevation[1],
    },
    footer: {
      ...type.caption,
      color: colors.textSecondary,
      paddingHorizontal: spacing.xs,
    },
  }));
}
