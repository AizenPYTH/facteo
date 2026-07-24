import { Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { DesktopSettingsNav } from '@/components/web/desktop/desktop-settings-nav';
import { DesktopTopHeader } from '@/components/web/desktop/desktop-top-header';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { useThemedStyles } from '@/hooks/use-colors';

export default function SettingsLayout() {
  const styles = useStyles();
  const { isWeb, isDesktop, isTablet } = useBreakpoint();
  const useDesktop = isWeb && (isDesktop || isTablet);

  if (!useDesktop) {
    return <Stack screenOptions={{ headerShown: false }} />;
  }

  return (
    <View style={styles.root}>
      <DesktopTopHeader
        subtitle="Configurez votre espace INVEQ"
        title="Paramètres"
      />

      <View style={styles.body}>
        <DesktopSettingsNav />
        <View style={styles.content}>
          <Stack screenOptions={{ headerShown: false }} />
        </View>
      </View>
    </View>
  );
}

const useStyles = () =>
  useThemedStyles((colors) => ({
    root: {
      flex: 1,
      backgroundColor: colors.backgroundGrouped,
    },
    body: {
      flex: 1,
      flexDirection: 'row',
      minHeight: 0,
    },
    content: {
      flex: 1,
      minWidth: 0,
    },
  }));
