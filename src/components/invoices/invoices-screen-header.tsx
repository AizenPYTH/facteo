import { View, type ViewStyle } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { spacing } from '@/constants/theme/spacing';
import { useThemedStyles } from '@/hooks/use-colors';

export type InvoicesScreenHeaderProps = {
  title?: string;
  count?: number;
  style?: ViewStyle;
};

export function InvoicesScreenHeader({ title = 'Factures', count, style }: InvoicesScreenHeaderProps) {
  const styles = useStyles();

  return (
    <View style={[styles.container, style]}>
      <AppText accessibilityRole="header" variant="display">
        {title}
      </AppText>
      {typeof count === 'number' ? (
        <AppText color="secondary" variant="subtitle">
          {count} {count > 1 ? 'factures' : 'facture'}
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
