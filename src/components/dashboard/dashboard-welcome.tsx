import { SymbolView } from 'expo-symbols';
import { router, type Href } from 'expo-router';
import { Text, View, type ViewStyle } from 'react-native';

import { Button } from '@/components/ui/button';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';

export type DashboardWelcomeProps = {
  style?: ViewStyle;
};

export function DashboardWelcome({ style }: DashboardWelcomeProps) {
  const styles = useStyles();
  const colors = useColors();
  return (
    <View style={[styles.container, style]}>
      <View style={styles.iconWrap}>
        <SymbolView
          name={{ ios: 'sparkles', android: 'auto_awesome', web: 'auto_awesome' }}
          size={28}
          tintColor={colors.primary}
          type="hierarchical"
        />
      </View>
      <View>
        <Text accessibilityRole="header" style={styles.title}>
          Bienvenue sur INVEQ.
        </Text>
        <Text style={styles.description}>Commencez par créer un client.</Text>
      </View>
      <View style={styles.buttonWrap}>
        <Button
          accessibilityLabel="Créer un client"
          onPress={() => router.push('/clients/new' as Href)}
          title="Créer un client"
        />
      </View>
    </View>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
    container: {
      alignItems: 'center',
      paddingVertical: spacing.xl,
      paddingHorizontal: spacing.lg,
      gap: spacing.md,
      backgroundColor: colors.surface,
      borderRadius: radius.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    iconWrap: {
      width: 56,
      height: 56,
      borderRadius: radius.full,
      backgroundColor: colors.primarySubtle,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      ...typography.title3,
      color: colors.text,
      textAlign: 'center',
    },
    description: {
      ...typography.subheadline,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    buttonWrap: {
      alignSelf: 'stretch',
    },
  }));
}
