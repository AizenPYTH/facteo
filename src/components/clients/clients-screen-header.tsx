import { View, type ViewStyle } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { spacing } from '@/constants/theme/spacing';
import { useThemedStyles } from '@/hooks/use-colors';

export type ClientsScreenHeaderProps = {
  title?: string;
  style?: ViewStyle;
};

export function ClientsScreenHeader({ title = 'Clients', style }: ClientsScreenHeaderProps) {
  const styles = useStyles();

  return (
    <View style={[styles.container, style]}>
      <AppText accessibilityRole="header" variant="display">
        {title}
      </AppText>
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
