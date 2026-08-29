import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StickyFooter } from '@/components/ui/sticky-footer';
import { useThemedStyles } from '@/hooks/use-colors';
import { spacing } from '@/constants/theme/spacing';

type WizardScreenProps = {
  header?: ReactNode;
  toolbar?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  testID?: string;
  variant?: 'mobile' | 'desktop';
};

export function WizardScreen({
  header,
  toolbar,
  children,
  footer,
  testID,
  variant = 'mobile',
}: WizardScreenProps) {
  const styles = useStyles();
  const isDesktop = variant === 'desktop';

  if (isDesktop) {
    return (
      <View style={styles.desktopRoot} testID={testID}>
        <View style={styles.desktopBody}>{children}</View>
        {footer ? <View style={styles.desktopFooter}>{footer}</View> : null}
      </View>
    );
  }

  return (
    <View style={styles.root} testID={testID}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        {header ? <View style={styles.header}>{header}</View> : null}
        {toolbar ? <View style={styles.toolbar}>{toolbar}</View> : null}
        <View style={styles.body}>{children}</View>
      </SafeAreaView>
      {footer ? <StickyFooter>{footer}</StickyFooter> : null}
    </View>
  );
}

const useStyles = () =>
  useThemedStyles((colors) => ({
    root: {
      flex: 1,
      backgroundColor: colors.backgroundGrouped,
    },
    safeArea: {
      flex: 1,
    },
    header: {
      gap: spacing.md,
    },
    toolbar: {
      paddingHorizontal: spacing.screenPaddingHorizontal,
      paddingBottom: spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    body: {
      flex: 1,
      paddingHorizontal: spacing.screenPaddingHorizontal,
    },
    desktopRoot: {
      flex: 1,
      backgroundColor: colors.backgroundGrouped,
      minHeight: 0,
    },
    desktopBody: {
      flex: 1,
      minHeight: 0,
    },
    desktopFooter: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
      backgroundColor: colors.surface,
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.md,
    },
  }));
