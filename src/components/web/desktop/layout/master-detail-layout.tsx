import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { DESKTOP_LAYOUT } from '@/constants/theme/desktop-tokens';
import { spacing } from '@/constants/theme/spacing';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { useThemedStyles } from '@/hooks/use-colors';

type MasterDetailLayoutProps = {
  list: ReactNode;
  detail: ReactNode;
  listWidth?: number;
  style?: ViewStyle;
};

export function MasterDetailLayout({
  list,
  detail,
  listWidth,
  style,
}: MasterDetailLayoutProps) {
  const styles = useStyles();
  const { isTablet } = useBreakpoint();
  const width =
    listWidth ??
    (isTablet ? DESKTOP_LAYOUT.listPanelWidthCompact : DESKTOP_LAYOUT.listPanelWidth);

  return (
    <View style={[styles.root, style]}>
      <View style={[styles.list, { width }]}>{list}</View>
      <View style={styles.detail}>{detail}</View>
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
    list: {
      minHeight: 0,
      flexShrink: 0,
    },
    detail: {
      flex: 1,
      minWidth: DESKTOP_LAYOUT.detailMinWidth,
      minHeight: 0,
    },
  }));
