import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SettingsScreenHeader } from '@/components/settings';
import { KEYBOARD_TOOLBAR_HEIGHT } from '@/components/ui/keyboard/constants';
import { StickyFooter, useStickyFooterInset } from '@/components/ui/sticky-footer';
import { DesktopPage } from '@/components/web/desktop/desktop-page';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { useThemedStyles } from '@/hooks/use-colors';
import { spacing } from '@/constants/theme/spacing';

type SettingsScreenFrameProps = {
  title: string;
  children: ReactNode;
  scrollable?: boolean;
  footer?: ReactNode;
};

export function SettingsScreenFrame({
  title,
  children,
  scrollable = true,
  footer,
}: SettingsScreenFrameProps) {
  const styles = useStyles();
  const { isWeb, isDesktop, isTablet } = useBreakpoint();
  const useDesktop = isWeb && (isDesktop || isTablet);
  const footerInset = useStickyFooterInset();

  if (useDesktop) {
    if (scrollable) {
      return (
        <DesktopPage padded style={styles.desktopContent}>
          {children}
          {footer}
        </DesktopPage>
      );
    }

    return (
      <View style={styles.desktopContent}>
        {children}
        {footer}
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <SettingsScreenHeader title={title} />
        {scrollable ? (
          <KeyboardAwareScrollView
            bottomOffset={footer ? footerInset : spacing.md + KEYBOARD_TOOLBAR_HEIGHT}
            contentContainerStyle={[
              styles.mobileContent,
              footer ? { paddingBottom: footerInset + spacing.md } : null,
            ]}
            keyboardDismissMode="on-drag"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            style={styles.flex}>
            {children}
          </KeyboardAwareScrollView>
        ) : (
          <View style={[styles.mobileContent, styles.flex]}>{children}</View>
        )}
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
      backgroundColor: colors.backgroundGrouped,
    },
    flex: {
      flex: 1,
    },
    mobileContent: {
      paddingHorizontal: spacing.screenPaddingHorizontal,
      paddingBottom: spacing.xl,
      gap: spacing.lg,
    },
    desktopContent: {
      flex: 1,
      gap: spacing.lg,
    },
  }));
