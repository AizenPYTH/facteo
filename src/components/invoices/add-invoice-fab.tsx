import { router, type Href } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Platform, Pressable, StyleSheet, Text, type ViewStyle } from 'react-native';

import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { radius } from '@/constants/theme/radius';
import { shadows } from '@/constants/theme/theme';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';

import { usePlanLimitGuard } from '@/hooks/use-plan-limit';

export type AddInvoiceFabProps = {
  onPress?: () => void;
  label?: string;
  style?: ViewStyle;
  testID?: string;
};

export function AddInvoiceFab({
  onPress,
  label = 'Nouvelle facture',
  style,
  testID,
}: AddInvoiceFabProps) {
  const styles = useStyles();
  const colors = useColors();
  const { guardResource } = usePlanLimitGuard();

  async function handlePress() {
    if (onPress) {
      onPress();
      return;
    }

    const allowed = await guardResource('documents');

    if (!allowed) {
      return;
    }

    router.push('/invoices/new' as Href);
  }

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        void handlePress();
      }}
      style={({ pressed }) => [styles.fab, pressed && styles.pressed, style]}
      testID={testID}>
      <SymbolView
        name={{ ios: 'plus', android: 'add', web: 'add' }}
        size={20}
        tintColor={colors.onPrimary}
        type="hierarchical"
      />
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
  fab: {
    position: 'absolute',
    right: spacing.screenPaddingHorizontal,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 56,
    ...shadows.floating,
  },
  pressed: {
    backgroundColor: colors.primaryPressed,
    opacity: Platform.OS === 'ios' ? 0.92 : 1,
  },
  label: {
    ...typography.subheadlineMedium,
    color: colors.onPrimary,
  },
}));
}
