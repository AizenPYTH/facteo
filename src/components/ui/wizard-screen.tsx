import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StickyFooter } from '@/components/ui/sticky-footer';
import { useThemedStyles } from '@/hooks/use-colors';
import { spacing } from '@/constants/theme/spacing';

type WizardScreenProps = {
  header: ReactNode;
  toolbar?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  testID?: string;
};

export function WizardScreen({ header, toolbar, children, footer, testID }: WizardScreenProps) {
  const styles = useStyles();

  return (
    <View style={styles.root} testID={testID}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.header}>{header}</View>
        {toolbar ? <View style={styles.toolbar}>{toolbar}</View> : null}
        <View style={styles.body}>{children}</View>
      </SafeAreaView>
      {footer ? <StickyFooter variant="toolbar">{footer}</StickyFooter> : null}
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
  }));
