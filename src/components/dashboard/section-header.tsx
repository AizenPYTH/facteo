import { SymbolView } from 'expo-symbols';
import { Text, View } from 'react-native';

import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { spacing } from '@/constants/theme/spacing';
import { type } from '@/constants/theme/type-roles';

type SectionHeaderProps = {
  title: string;
  actionLabel?: string;
  premiumLocked?: boolean;
};

export function SectionHeader({ title, actionLabel, premiumLocked = false }: SectionHeaderProps) {
  const styles = useStyles();
  const colors = useColors();

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>{title}</Text>
        {premiumLocked ? (
          <SymbolView name="lock.fill" size={13} tintColor={colors.textTertiary} />
        ) : null}
      </View>
      {actionLabel ? <Text style={styles.action}>{actionLabel}</Text> : null}
    </View>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingBottom: spacing[0.5],
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing[1.5],
    },
    title: {
      ...type.section,
      fontSize: 20,
      lineHeight: 25,
      color: colors.text,
    },
    action: {
      ...type.secondary,
      fontWeight: '600',
      color: colors.textLink,
    },
  }));
}
