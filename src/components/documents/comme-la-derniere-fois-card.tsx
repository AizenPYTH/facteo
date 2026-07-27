import { SymbolView } from 'expo-symbols';
import { Pressable, Text, View, type ViewStyle } from 'react-native';

import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { type } from '@/constants/theme/type-roles';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { triggerHaptic } from '@/lib/haptics';

export type CommeLaDerniereFoisCardProps = {
  /** e.g. "Facture FAC-2024-012" or client name */
  subtitle?: string | null;
  onPress: () => void;
  /** Compact row for lists / footers */
  compact?: boolean;
  style?: ViewStyle;
  testID?: string;
};

/**
 * Signature CTA — "Comme la dernière fois".
 * Must stay visible and tappable; never bury in a menu.
 */
export function CommeLaDerniereFoisCard({
  subtitle,
  onPress,
  compact = false,
  style,
  testID,
}: CommeLaDerniereFoisCardProps) {
  const styles = useStyles();
  const colors = useColors();

  return (
    <Pressable
      accessibilityHint="Recrée un document avec les mêmes prestations"
      accessibilityLabel="Comme la dernière fois"
      accessibilityRole="button"
      onPress={() => {
        void triggerHaptic('selection');
        onPress();
      }}
      style={({ pressed }) => [
        compact ? styles.compact : styles.card,
        pressed && styles.pressed,
        style,
      ]}
      testID={testID}>
      <View style={styles.iconWrap}>
        <SymbolView
          name={{ ios: 'arrow.clockwise', android: 'replay', web: 'replay' }}
          size={compact ? 18 : 22}
          tintColor={colors.primary}
          type="hierarchical"
        />
      </View>
      <View style={styles.copy}>
        <Text style={styles.title}>Comme la dernière fois</Text>
        {subtitle ? (
          <Text numberOfLines={1} style={styles.subtitle}>
            {subtitle}
          </Text>
        ) : (
          <Text numberOfLines={1} style={styles.subtitle}>
            Reprendre les mêmes prestations
          </Text>
        )}
      </View>
      {!compact ? (
        <Text style={styles.chevron} accessibilityElementsHidden>
          ›
        </Text>
      ) : null}
    </Pressable>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      borderRadius: radius.card,
      backgroundColor: colors.primarySubtle,
    },
    compact: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.sm,
      borderRadius: radius.card,
      backgroundColor: colors.primarySubtle,
    },
    pressed: {
      opacity: 0.88,
    },
    iconWrap: {
      width: 36,
      height: 36,
      borderRadius: radius.full,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
    },
    copy: {
      flex: 1,
      gap: 2,
      minWidth: 0,
    },
    title: {
      ...type.badge,
      color: colors.primary,
    },
    subtitle: {
      ...type.micro,
      color: colors.textSecondary,
    },
    chevron: {
      ...type.section,
      color: colors.primary,
      opacity: 0.7,
    },
  }));
}
