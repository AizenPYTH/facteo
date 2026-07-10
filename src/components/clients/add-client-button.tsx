import { router, type Href } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, Text, type ViewStyle } from 'react-native';

import { colors } from '@/constants/theme/colors';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';

export type AddClientButtonProps = {
  onPress?: () => void;
  label?: string;
  style?: ViewStyle;
  testID?: string;
};

export function AddClientButton({
  onPress,
  label = 'Add Client',
  style,
  testID,
}: AddClientButtonProps) {
  function handlePress() {
    if (onPress) {
      onPress();
      return;
    }

    router.push('/clients/new' as Href);
  }

  return (
    <Pressable
      accessibilityRole="button"
      onPress={handlePress}
      style={({ pressed }) => [styles.button, pressed && styles.pressed, style]}
      testID={testID}>
      <SymbolView
        name={{ ios: 'plus', android: 'add', web: 'add' }}
        size={18}
        tintColor={colors.onPrimary}
        type="hierarchical"
      />
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    borderRadius: radius.button,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  pressed: {
    backgroundColor: colors.primaryPressed,
  },
  label: {
    ...typography.subheadlineMedium,
    color: colors.onPrimary,
  },
});
