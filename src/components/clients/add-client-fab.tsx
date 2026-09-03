import { router, type Href } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { StyleSheet, Text, type ViewStyle } from 'react-native';

import { PressableScale } from '@/components/ui/pressable-scale';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { radius } from '@/constants/theme/radius';
import { shadows } from '@/constants/theme/theme';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';

export type AddClientFabProps = {
  onPress?: () => void;
  label?: string;
  style?: ViewStyle;
  testID?: string;
};

export function AddClientFab({
  onPress,
  label = 'Ajouter un client',
  style,
  testID,
}: AddClientFabProps) {
  const styles = useStyles();
  const colors = useColors();

  function handlePress() {
    if (onPress) {
      onPress();
      return;
    }

    router.push('/clients/new' as Href);
  }

  return (
    <PressableScale
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={handlePress}
      style={[styles.fab, style]}
      testID={testID}>
      <SymbolView
        name={{ ios: 'plus', android: 'add', web: 'add' }}
        size={20}
        tintColor={colors.onPrimary}
        type="hierarchical"
      />
      <Text style={styles.label}>{label}</Text>
    </PressableScale>
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
  label: {
    ...typography.subheadlineMedium,
    color: colors.onPrimary,
  },
}));
}
