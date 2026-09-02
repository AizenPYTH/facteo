import { View, type ViewStyle } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { spacing } from '@/constants/theme/spacing';
import { useThemedStyles } from '@/hooks/use-colors';

export type QuotesScreenHeaderProps = {
  title?: string;
  count?: number;
  style?: ViewStyle;
};

export function QuotesScreenHeader({ title = 'Devis', count, style }: QuotesScreenHeaderProps) {
  const styles = useStyles();

  return (
    <View style={[styles.container, style]}>
      <AppText accessibilityRole="header" variant="display">
        {title}
      </AppText>
      {typeof count === 'number' ? (
        <AppText color="secondary" variant="subtitle">
          {count} devis
        </AppText>
      ) : null}
    </View>
  );
}

function useStyles() {
  return useThemedStyles(() => ({
    container: {
      gap: spacing.xs,
    },
  }));
}
