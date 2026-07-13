import { SymbolView } from 'expo-symbols';
import { StyleSheet, Text, View } from 'react-native';

import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { typography } from '@/constants/theme/typography';

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
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    title: {
      ...typography.title3,
      color: colors.text,
    },
    action: {
      ...typography.subheadlineMedium,
      color: colors.textLink,
    },
  }));
}
