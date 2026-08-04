import type { ReactNode } from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { useThemedStyles } from '@/hooks/use-colors';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { textHierarchy } from '@/constants/theme/typography';

type FormSectionProps = {
  title?: string;
  footer?: string;
  children: ReactNode;
  style?: ViewStyle;
};

export function FormSection({ title, footer, children, style }: FormSectionProps) {
  const styles = useStyles();

  return (
    <View style={[styles.section, style]}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      <View style={styles.group}>{children}</View>
      {footer ? <Text style={styles.footer}>{footer}</Text> : null}
    </View>
  );
}

export function FormDivider() {
  const styles = useStyles();
  return <View style={styles.divider} />;
}

export function FormField({ children }: { children: ReactNode }) {
  const styles = useStyles();
  return <View style={styles.field}>{children}</View>;
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
    field: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.inputPadding,
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.separator,
      marginLeft: spacing.md,
    },
  }));
}
