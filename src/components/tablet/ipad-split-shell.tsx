import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useBreakpoint } from '@/hooks/use-breakpoint';
import { useThemedStyles } from '@/hooks/use-colors';

export const IPAD_NAVIGATION_RAIL_WIDTH = 78;
export const IPAD_LIST_WIDTH = 376;
export const IPAD_PDF_PREVIEW_WIDTH = 340;

type IpadSplitShellProps = {
  list: ReactNode;
  document: ReactNode;
  listVisible?: boolean;
  onDismissList?: () => void;
};

/**
 * iPad master/detail shell — DESIGN §7.
 *
 * Landscape keeps the 376px list beside the document. In portrait the list is
 * an escapable overlay, so the document keeps the full available width.
 */
export function IpadSplitShell({
  list,
  document,
  listVisible = false,
  onDismissList,
}: IpadSplitShellProps) {
  const styles = useStyles();
  const { width, height } = useBreakpoint();
  const isLandscape = width > height;

  if (isLandscape) {
    return (
      <View style={[styles.root, styles.landscapeRoot]}>
        <View style={styles.landscapeList}>{list}</View>
        <View style={styles.document}>{document}</View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.document}>{document}</View>

      {listVisible ? (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          <Pressable
            accessibilityLabel="Fermer la liste des documents"
            accessibilityRole="button"
            onPress={onDismissList}
            style={styles.scrim}
          />
          <View
            accessibilityViewIsModal
            onAccessibilityEscape={onDismissList}
            style={styles.portraitList}>
            {list}
          </View>
        </View>
      ) : null}
    </View>
  );
}

const useStyles = () =>
  useThemedStyles((colors) => ({
    root: {
      flex: 1,
      minWidth: 0,
      minHeight: 0,
      backgroundColor: colors.backgroundGrouped,
    },
    landscapeRoot: {
      flexDirection: 'row' as const,
    },
    landscapeList: {
      width: IPAD_LIST_WIDTH,
      flexShrink: 0,
      minHeight: 0,
      borderRightWidth: StyleSheet.hairlineWidth,
      borderRightColor: colors.border,
      backgroundColor: colors.surface,
    },
    document: {
      flex: 1,
      minWidth: 0,
      minHeight: 0,
      marginLeft: 0,
    },
    scrim: {
      position: 'absolute' as const,
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      backgroundColor: 'rgba(27,29,36,.42)',
    },
    portraitList: {
      position: 'absolute' as const,
      top: 0,
      bottom: 0,
      left: 0,
      width: IPAD_LIST_WIDTH,
      maxWidth: '100%' as const,
      borderRightWidth: StyleSheet.hairlineWidth,
      borderRightColor: colors.border,
      backgroundColor: colors.surface,
    },
  }));
