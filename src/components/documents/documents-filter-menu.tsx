import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { triggerSelectionHaptic } from '@/lib/haptics';

export type DocumentsFilterOption<T extends string> = {
  value: T;
  label: string;
  count?: number;
};

type DocumentsFilterMenuProps<T extends string> = {
  value: T;
  options: readonly DocumentsFilterOption<T>[];
  onChange: (value: T) => void;
  accessibilityLabel?: string;
};

/**
 * Filtre compact Documents — déclencheur + feuille de sélection (plus de grandes cases).
 */
export function DocumentsFilterMenu<T extends string>({
  value,
  options,
  onChange,
  accessibilityLabel = 'Filtrer les documents',
}: DocumentsFilterMenuProps<T>) {
  const styles = useStyles();
  const colors = useColors();
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value) ?? options[0];

  function select(next: T) {
    void triggerSelectionHaptic();
    onChange(next);
    setOpen(false);
  }

  return (
    <>
      <Pressable
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
        onPress={() => setOpen(true)}
        style={({ pressed }) => [styles.trigger, pressed && styles.triggerPressed]}>
        <SymbolView
          name={{ ios: 'line.3.horizontal.decrease', android: 'filter_list', web: 'filter_list' }}
          size={15}
          tintColor={colors.textSecondary}
          type="hierarchical"
        />
        <Text numberOfLines={1} style={styles.triggerLabel}>
          {selected?.label ?? 'Filtre'}
          {typeof selected?.count === 'number' ? ` · ${selected.count}` : ''}
        </Text>
        <SymbolView
          name={{ ios: 'chevron.down', android: 'expand_more', web: 'expand_more' }}
          size={12}
          tintColor={colors.textTertiary}
          type="hierarchical"
        />
      </Pressable>

      <Modal
        animationType="fade"
        onRequestClose={() => setOpen(false)}
        transparent
        visible={open}>
        <Pressable onPress={() => setOpen(false)} style={styles.backdrop}>
          <Pressable onPress={(event) => event.stopPropagation()} style={styles.sheet}>
            <Text style={styles.sheetTitle}>Statut</Text>
            {options.map((option) => {
              const isActive = option.value === value;
              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: isActive }}
                  key={option.value}
                  onPress={() => select(option.value)}
                  style={[styles.option, isActive && styles.optionActive]}>
                  <Text style={[styles.optionLabel, isActive && styles.optionLabelActive]}>
                    {option.label}
                  </Text>
                  {typeof option.count === 'number' ? (
                    <Text style={[styles.optionCount, isActive && styles.optionCountActive]}>
                      {option.count}
                    </Text>
                  ) : null}
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
    trigger: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.xs,
      minHeight: 44,
      paddingHorizontal: spacing.sm + 2,
      borderRadius: radius.input,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      maxWidth: 160,
    },
    triggerPressed: {
      backgroundColor: colors.surfaceSecondary,
    },
    triggerLabel: {
      ...typography.footnoteMedium,
      color: colors.text,
      flexShrink: 1,
    },
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(27,29,36,0.35)',
      justifyContent: 'flex-end' as const,
      padding: spacing.md,
    },
    sheet: {
      backgroundColor: colors.surface,
      borderRadius: radius.sheet,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      padding: spacing.md,
      gap: spacing.xs,
    },
    sheetTitle: {
      ...typography.caption1,
      fontWeight: '600',
      letterSpacing: 0.9,
      textTransform: 'uppercase' as const,
      color: colors.textTertiary,
      marginBottom: spacing.xs,
      paddingHorizontal: spacing.xs,
    },
    option: {
      minHeight: 48,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      paddingHorizontal: spacing.md,
      borderRadius: radius.sm,
    },
    optionActive: {
      backgroundColor: colors.primarySubtle,
    },
    optionLabel: {
      ...typography.body,
      color: colors.text,
    },
    optionLabelActive: {
      color: colors.primary,
      fontWeight: '600',
    },
    optionCount: {
      ...typography.footnoteMedium,
      fontVariant: ['tabular-nums'],
      color: colors.textTertiary,
    },
    optionCountActive: {
      color: colors.primary,
    },
  }));
}
