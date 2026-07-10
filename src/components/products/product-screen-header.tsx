import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { colors } from '@/constants/theme/colors';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';

type ProductScreenHeaderProps = {
  title: string;
  style?: ViewStyle;
};

export function ProductScreenHeader({ title, style }: ProductScreenHeaderProps) {
  return (
    <View style={[styles.container, style]}>
      <Pressable
        accessibilityRole="button"
        onPress={() => router.back()}
        style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
        <SymbolView
          name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }}
          size={18}
          tintColor={colors.primary}
          type="hierarchical"
        />
        <Text style={styles.backLabel}>Retour</Text>
      </Pressable>
      <Text accessibilityRole="header" style={styles.title}>
        {title}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
  },
  backLabel: {
    ...typography.subheadlineMedium,
    color: colors.primary,
  },
  pressed: {
    opacity: 0.7,
  },
  title: {
    ...typography.largeTitle,
    color: colors.text,
  },
});
