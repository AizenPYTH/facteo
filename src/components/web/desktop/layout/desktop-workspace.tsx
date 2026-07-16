import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';

import { DESKTOP_LAYOUT } from '@/constants/theme/desktop-tokens';
import { useThemedStyles } from '@/hooks/use-colors';

type DesktopWorkspaceProps = {
  children: ReactNode;
  scrollable?: boolean;
  style?: ViewStyle;
};

export function DesktopWorkspace({
  children,
  scrollable = true,
  style,
}: DesktopWorkspaceProps) {
  const styles = useStyles();

  if (!scrollable) {
    return <View style={[styles.workspace, style]}>{children}</View>;
  }

  return (
    <ScrollView
      contentContainerStyle={[styles.scrollContent, style]}
      showsVerticalScrollIndicator={false}
      style={styles.workspace}>
      {children}
    </ScrollView>
  );
}

const useStyles = () =>
  useThemedStyles((colors) => ({
    workspace: {
      flex: 1,
      backgroundColor: colors.backgroundGrouped,
    },
    scrollContent: {
      flexGrow: 1,
      padding: DESKTOP_LAYOUT.workspacePadding,
      gap: DESKTOP_LAYOUT.panelGap,
    },
  }));
