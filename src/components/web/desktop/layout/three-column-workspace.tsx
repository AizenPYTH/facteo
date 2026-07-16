import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { DESKTOP_LAYOUT } from '@/constants/theme/desktop-tokens';
import { useThemedStyles } from '@/hooks/use-colors';

type ThreeColumnWorkspaceProps = {
  left: ReactNode;
  center: ReactNode;
  right: ReactNode;
  leftWidth?: number;
  rightWidth?: number;
};

export function ThreeColumnWorkspace({
  left,
  center,
  right,
  leftWidth = 320,
  rightWidth = 280,
}: ThreeColumnWorkspaceProps) {
  const styles = useStyles();

  return (
    <View style={styles.root}>
      <View style={[styles.left, { width: leftWidth }]}>{left}</View>
      <View style={styles.center}>{center}</View>
      <View style={[styles.right, { width: rightWidth }]}>{right}</View>
    </View>
  );
}

const useStyles = () =>
  useThemedStyles((colors) => ({
    root: {
      flex: 1,
      flexDirection: 'row',
      gap: DESKTOP_LAYOUT.panelGap,
      padding: DESKTOP_LAYOUT.workspacePadding,
      minHeight: 0,
      backgroundColor: colors.backgroundGrouped,
    },
    left: {
      flexShrink: 0,
      minHeight: 0,
    },
    center: {
      flex: 1,
      minWidth: 0,
      minHeight: 0,
    },
    right: {
      flexShrink: 0,
      minHeight: 0,
    },
  }));
