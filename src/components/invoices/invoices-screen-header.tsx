import { Pressable, Text, View, type ViewStyle } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { spacing } from '@/constants/theme/spacing';
import { type } from '@/constants/theme/type-roles';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { triggerHaptic } from '@/lib/haptics';

export type InvoicesScreenHeaderProps = {
  title?: string;
  selectionMode?: boolean;
  onToggleSelectionMode?: () => void;
  style?: ViewStyle;
};

export function InvoicesScreenHeader({
  title = 'Factures',
  selectionMode = false,
  onToggleSelectionMode,
  style,
}: InvoicesScreenHeaderProps) {
  const styles = useStyles();
  const colors = useColors();

  return (
    <View style={[styles.container, style]}>
      <View style={styles.row}>
        <AppText accessibilityRole="header" style={styles.title} variant="display">
          {title}
        </AppText>
        {onToggleSelectionMode ? (
          <Pressable
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => {
              void triggerHaptic('selection');
              onToggleSelectionMode();
            }}>
            <Text style={[styles.action, { color: colors.primary }]}>
              {selectionMode ? 'Annuler' : 'Sélectionner'}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function useStyles() {
  return useThemedStyles(() => ({
    container: {
      gap: spacing.xs,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.md,
    },
    title: {
      flexShrink: 1,
    },
    action: {
      ...type.badge,
    },
  }));
}
