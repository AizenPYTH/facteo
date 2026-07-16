import type { ReactNode } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { DesktopSidebar } from '@/components/web/desktop/desktop-sidebar';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { useThemedStyles } from '@/hooks/use-colors';
import {
  DESKTOP_SIDEBAR_WIDTH,
  TABLET_SIDEBAR_WIDTH,
} from '@/constants/theme/breakpoints';

type DesktopShellProps = {
  children: ReactNode;
};

export function DesktopShell({ children }: DesktopShellProps) {
  const styles = useStyles();
  const { isTablet } = useBreakpoint();
  const sidebarWidth = isTablet ? TABLET_SIDEBAR_WIDTH : DESKTOP_SIDEBAR_WIDTH;

  return (
    <View style={styles.root}>
      <View style={[styles.sidebarSlot, { width: sidebarWidth }]}>
        <DesktopSidebar />
      </View>
      <View style={[styles.main, Platform.OS === 'web' && { marginLeft: sidebarWidth }]}>
        {children}
      </View>
    </View>
  );
}

const useStyles = () =>
  useThemedStyles((colors) => ({
    root: {
      flex: 1,
      backgroundColor: colors.backgroundGrouped,
      minHeight: '100vh' as unknown as number,
    },
    sidebarSlot: {
      ...(Platform.OS === 'web'
        ? {
            position: 'fixed' as const,
            left: 0,
            top: 0,
            bottom: 0,
            zIndex: 20,
          }
        : {}),
    },
    main: {
      flex: 1,
      minWidth: 0,
      minHeight: '100vh' as unknown as number,
    },
  }));
