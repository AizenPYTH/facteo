import { router, type Href } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Platform, Pressable, StyleSheet, Text, type ViewStyle } from 'react-native';

import { colors } from '@/constants/theme/colors';
import { radius } from '@/constants/theme/radius';
import { shadows } from '@/constants/theme/theme';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';

export type AddProductFabProps = {
  onPress?: () => void;
  label?: string;
  style?: ViewStyle;
  testID?: string;
};

export function AddProductFab({
  onPress,
  label = 'Ajouter',
  style,
  testID,
}: AddProductFabProps) {
  function handlePress() {
    if (onPress) {
      onPress();
      return;
    }

    router.push('/products/new' as Href);
  }

  return (
    <Pressable
      accessibilityRole="button"
      onPress={handlePress}
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

const styles = StyleSheet.create({
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
});
