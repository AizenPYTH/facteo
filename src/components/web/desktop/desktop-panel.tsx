import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { useThemedStyles } from '@/hooks/use-colors';

type DesktopPanelProps = {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  headerRight?: ReactNode;
  style?: ViewStyle;
  flex?: number;
  flush?: boolean;
};

export function DesktopPanel({
  children,
  title,
  subtitle,
  headerRight,
  style,
  flex,
  flush = false,
}: DesktopPanelProps) {
  const styles = useStyles();

  return (
    <View style={[styles.panel, flex != null && { flex }, style]}>
      {title ? (
        <View style={styles.header}>
          <View style={styles.headerText}>
            <AppText variant="title">{title}</AppText>
            {subtitle ? (
              <AppText color="secondary" variant="caption">
                {subtitle}
              </AppText>
            ) : null}
          </View>
          {headerRight ? <View style={styles.headerRight}>{headerRight}</View> : null}
        </View>
      ) : null}
      <View style={flush ? styles.bodyFlush : styles.body}>{children}</View>
    </View>
  );
}

const useStyles = () =>
  useThemedStyles((colors) => ({
    panel: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      overflow: 'hidden',
      minHeight: 0,
      ...(StyleSheet.flatten({
        boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04), 0 4px 16px rgba(15, 23, 42, 0.06)',
      }) as object),
    },
    body: {
      flex: 1,
      minHeight: 0,
    },
    bodyFlush: {
      flex: 1,
      minHeight: 0,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.md,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
      paddingBottom: spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
      backgroundColor: colors.backgroundSecondary,
    },
    headerText: {
      flex: 1,
      gap: 2,
      minWidth: 0,
    },
    headerRight: {
      flexShrink: 0,
    },
  }));
