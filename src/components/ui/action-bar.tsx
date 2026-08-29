import { Children, type ReactNode } from 'react';
import { Platform, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { KeyboardStickyView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { useIsLargeContentSize } from '@/hooks/use-is-large-content-size';
import { spacing } from '@/constants/theme/spacing';
import { shadows } from '@/constants/theme/theme';
import { typography } from '@/constants/theme/typography';

type ActionBarProps = {
  children: ReactNode;
  /** Récapitulatif au-dessus du bouton (total, sélections) — DESIGN §3.2 */
  summary?: ReactNode;
  /** Ligne d'explication 12px sous les actions */
  caption?: string;
  style?: StyleProp<ViewStyle>;
  /** Désactive le fond / bordure (cas toolbar transparente). */
  transparent?: boolean;
};

/**
 * Barre d'action collante — DESIGN §3.2
 * Fond surface, bordure haute, ombre de barre, padding 12 16 10 + safe area.
 * Poussée par le clavier, jamais recouverte.
 */
export function ActionBar({
  children,
  summary,
  caption,
  style,
  transparent = false,
}: ActionBarProps) {
  const styles = useStyles();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isLargeContentSize = useIsLargeContentSize();
  const paddingBottom = Math.max(insets.bottom, spacing.actionBarPaddingBottom);

  return (
    <KeyboardStickyView offset={{ closed: 0, opened: 0 }}>
      <View
        style={[
          styles.bar,
          !transparent && styles.barElevated,
          {
            paddingBottom,
            borderTopColor: transparent ? 'transparent' : colors.border,
            backgroundColor: transparent ? 'transparent' : colors.surface,
          },
          style,
        ]}>
        {summary ? <View style={styles.summary}>{summary}</View> : null}
        <View style={[styles.actions, isLargeContentSize && styles.actionsLarge]}>
          {Children.map(children, (child) =>
            child ? (
              <View style={[styles.action, isLargeContentSize && styles.actionLarge]}>
                {child}
              </View>
            ) : null,
          )}
        </View>
        {caption ? (
          <Text style={styles.caption}>{caption}</Text>
        ) : null}
      </View>
    </KeyboardStickyView>
  );
}

export function useActionBarInset(): number {
  const insets = useSafeAreaInsets();
  const isLargeContentSize = useIsLargeContentSize();
  const paddingBottom = Math.max(insets.bottom, spacing.actionBarPaddingBottom);
  return (
    componentsMinHeight() * (isLargeContentSize ? 2 : 1) +
    spacing.actionBarPaddingTop +
    paddingBottom +
    StyleSheet.hairlineWidth
  );
}

function componentsMinHeight() {
  return 52;
}

function useStyles() {
  return useThemedStyles((colors) => ({
    bar: {
      paddingHorizontal: spacing.actionBarPaddingHorizontal,
      paddingTop: spacing.actionBarPaddingTop,
      gap: spacing.sm,
      borderTopWidth: StyleSheet.hairlineWidth,
    },
    barElevated: {
      ...shadows.actionBar,
      ...(Platform.OS === 'android' ? { elevation: 8 } : null),
    },
    summary: {
      gap: spacing.xs,
    },
    actions: {
      flexDirection: 'row' as const,
      alignItems: 'stretch' as const,
      gap: spacing.sm,
    },
    actionsLarge: {
      flexDirection: 'column' as const,
    },
    action: {
      flex: 1,
      minWidth: 0,
    },
    actionLarge: {
      flex: 0,
      width: '100%' as const,
    },
    caption: {
      ...typography.caption1,
      color: colors.textTertiary,
      textAlign: 'center' as const,
    },
  }));
}
