import { SymbolView } from 'expo-symbols';
import type { ComponentProps, ReactNode } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomTabInset } from '@/constants/theme';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { elevation } from '@/constants/theme/surfaces';
import { type } from '@/constants/theme/type-roles';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { triggerHaptic } from '@/lib/haptics';

type SymbolName = ComponentProps<typeof SymbolView>['name'];

export type SelectionAction = {
  key: string;
  label: string;
  icon: SymbolName;
  onPress: () => void;
  disabled?: boolean;
  destructive?: boolean;
};

type SelectionActionBarProps = {
  selectedCount: number;
  actions: SelectionAction[];
  loading?: boolean;
  onSelectAll?: () => void;
  onClear?: () => void;
  allSelected?: boolean;
  trailing?: ReactNode;
};

/**
 * Floating batch toolbar — appears when one or more items are selected.
 */
export function SelectionActionBar({
  selectedCount,
  actions,
  loading = false,
  onSelectAll,
  onClear,
  allSelected = false,
  trailing,
}: SelectionActionBarProps) {
  const styles = useStyles();
  const colors = useColors();
  const insets = useSafeAreaInsets();

  if (selectedCount < 0) {
    return null;
  }

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.wrap,
        { paddingBottom: Math.max(insets.bottom, spacing.sm) + BottomTabInset },
      ]}>
      <View style={styles.bar}>
        <View style={styles.topRow}>
          <Text style={styles.count}>
            {selectedCount === 0
              ? 'Sélectionnez des factures'
              : `${selectedCount} sélectionné${selectedCount > 1 ? 's' : ''}`}
          </Text>
          <View style={styles.topActions}>
            {onSelectAll ? (
              <Pressable
                accessibilityRole="button"
                hitSlop={8}
                onPress={() => {
                  void triggerHaptic('selection');
                  onSelectAll();
                }}>
                <Text style={styles.link}>{allSelected ? 'Tout désélectionner' : 'Tout'}</Text>
              </Pressable>
            ) : null}
            {onClear ? (
              <Pressable
                accessibilityRole="button"
                hitSlop={8}
                onPress={() => {
                  void triggerHaptic('selection');
                  onClear();
                }}>
                <Text style={styles.linkMuted}>Fermer</Text>
              </Pressable>
            ) : null}
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={colors.primary} size="small" />
            <Text style={styles.loadingText}>Traitement en cours…</Text>
          </View>
        ) : (
          <View style={styles.actions}>
            {actions.map((action) => {
              const tint = action.destructive
                ? colors.error
                : action.disabled
                  ? colors.textTertiary
                  : colors.primary;

              return (
                <Pressable
                  key={action.key}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: action.disabled }}
                  disabled={action.disabled}
                  onPress={() => {
                    if (action.disabled) return;
                    void triggerHaptic(action.destructive ? 'notificationError' : 'selection');
                    action.onPress();
                  }}
                  style={({ pressed }) => [
                    styles.action,
                    pressed && !action.disabled && styles.actionPressed,
                    action.disabled && styles.actionDisabled,
                  ]}>
                  <SymbolView name={action.icon} size={20} tintColor={tint} type="hierarchical" />
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.actionLabel,
                      { color: tint },
                    ]}>
                    {action.label}
                  </Text>
                </Pressable>
              );
            })}
            {trailing}
          </View>
        )}
      </View>
    </View>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
    wrap: {
      position: 'absolute',
      left: spacing.screenPaddingHorizontal,
      right: spacing.screenPaddingHorizontal,
      bottom: 0,
    },
    bar: {
      backgroundColor: colors.surface,
      borderRadius: radius.card,
      borderWidth: 0.5,
      borderColor: colors.border,
      paddingHorizontal: spacing.md,
      paddingTop: spacing.md,
      paddingBottom: spacing.md,
      gap: spacing.md,
      ...elevation[3],
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    count: {
      ...type.cardTitle,
      color: colors.text,
    },
    topActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    link: {
      ...type.badge,
      color: colors.primary,
    },
    linkMuted: {
      ...type.badge,
      color: colors.textSecondary,
    },
    actions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    action: {
      flexGrow: 1,
      flexBasis: '30%',
      minWidth: 96,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing[1],
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.sm,
      borderRadius: radius.md,
      backgroundColor: colors.backgroundSecondary,
    },
    actionPressed: {
      backgroundColor: colors.backgroundSelected,
    },
    actionDisabled: {
      opacity: 0.45,
    },
    actionLabel: {
      ...type.micro,
      textAlign: 'center',
    },
    loadingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.sm,
    },
    loadingText: {
      ...type.secondary,
      color: colors.textSecondary,
    },
  }));
}
