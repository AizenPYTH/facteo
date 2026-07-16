import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SettingsScreenHeader } from '@/components/settings';
import { DesktopPage } from '@/components/web/desktop/desktop-page';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { useThemedStyles } from '@/hooks/use-colors';
import { spacing } from '@/constants/theme/spacing';

type SettingsScreenFrameProps = {
  title: string;
  children: ReactNode;
  scrollable?: boolean;
};

export function SettingsScreenFrame({
  title,
  children,
  scrollable = true,
}: SettingsScreenFrameProps) {
  const styles = useStyles();
  const { isWeb, isDesktop, isTablet } = useBreakpoint();
  const useDesktop = isWeb && (isDesktop || isTablet);

  if (useDesktop) {
    if (scrollable) {
      return (
        <DesktopPage padded style={styles.desktopContent}>
          {children}
        </DesktopPage>
      );
    }

    return <View style={styles.desktopContent}>{children}</View>;
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <SettingsScreenHeader title={title} />
      {scrollable ? (
        <ScrollView
          contentContainerStyle={styles.mobileContent}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      ) : (
        <View style={styles.mobileContent}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const useStyles = () =>
  useThemedStyles((colors) => ({
    safeArea: {
      flex: 1,
      backgroundColor: colors.backgroundGrouped,
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
