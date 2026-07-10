import { StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { colors } from '@/constants/theme/colors';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';

export type ProductsScreenHeaderProps = {
  title?: string;
  style?: ViewStyle;
};

export function ProductsScreenHeader({ title = 'Produits', style }: ProductsScreenHeaderProps) {
  return (
    <View style={[styles.container, style]}>
      <Text accessibilityRole="header" style={styles.title}>
        {title}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  title: {
    ...typography.largeTitle,
    color: colors.text,
  },
});
