import { SymbolView } from 'expo-symbols';
import { Text, View } from 'react-native';

import { PressableScale } from '@/components/ui/pressable-scale';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { useColors, useThemedStyles } from '@/hooks/use-colors';

type SectionHeaderProps = {
  title: string;
  /** Libellé de l'action à droite. Sans `onAction`, il reste purement indicatif. */
  actionLabel?: string;
  onAction?: () => void;
  premiumLocked?: boolean;
};

/**
 * Titre de section du tableau de bord. L'action de droite est une vraie zone
 * tactile de 44 pt quand `onAction` est fourni — auparavant c'était un texte
 * inerte qui ressemblait à un lien.
 */
export function SectionHeader({
  title,
  actionLabel,
  onAction,
  premiumLocked = false,
}: SectionHeaderProps) {
  const styles = useStyles();
  const colors = useColors();

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <Text accessibilityRole="header" maxFontSizeMultiplier={1.5} style={styles.title}>
          {title}
        </Text>
        {premiumLocked ? (
          <SymbolView name="lock.fill" size={13} tintColor={colors.textTertiary} />
        ) : null}
      </View>

      {actionLabel && onAction ? (
        <PressableScale
          accessibilityLabel={actionLabel}
          accessibilityRole="button"
          hitSlop={8}
          intensity="subtle"
          onPress={onAction}
          style={styles.actionButton}>
          <Text maxFontSizeMultiplier={1.4} style={styles.action}>
            {actionLabel}
          </Text>
        </PressableScale>
      ) : actionLabel ? (
        <Text maxFontSizeMultiplier={1.4} style={styles.action}>
          {actionLabel}
        </Text>
      ) : null}
    </View>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing[3],
      minHeight: 28,
    },
    titleRow: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing[1.5],
    },
    title: {
      ...typography.title3,
      color: colors.text,
      flexShrink: 1,
    },
    actionButton: {
      justifyContent: 'center',
      paddingVertical: spacing[2],
      paddingLeft: spacing[2],
    },
    action: {
      ...typography.subheadlineMedium,
      color: colors.textLink,
    },
  }));
}
