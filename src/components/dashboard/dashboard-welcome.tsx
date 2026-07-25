import { SymbolView } from 'expo-symbols';
import { router, type Href } from 'expo-router';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Button } from '@/components/ui/button';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { entrance } from '@/constants/theme/motion';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { elevation } from '@/constants/theme/surfaces';
import { type } from '@/constants/theme/type-roles';

export type DashboardWelcomeProps = {
  style?: ViewStyle;
};

/**
 * First-run path — one decision: create a client, then invoice immediately.
 * Query `next=invoice` keeps the first-invoice journey under 5 minutes.
 */
export function DashboardWelcome({ style }: DashboardWelcomeProps) {
  const styles = useStyles();
  const colors = useColors();
  return (
    <Animated.View
      entering={FadeInDown.duration(entrance.cardDuration).springify()}
      style={[styles.container, style]}>
      <View style={styles.iconWrap}>
        <SymbolView
          name={{ ios: 'sparkles', android: 'auto_awesome', web: 'auto_awesome' }}
          size={26}
          tintColor={colors.primary}
          type="hierarchical"
        />
      </View>
      <Text accessibilityRole="header" style={styles.title}>
        Votre première facture en quelques minutes
      </Text>
      <Text style={styles.description}>
        Ajoutez un client — on enchaîne directement sur la facture. Ensuite, « Comme la
        dernière fois » fera le reste.
      </Text>
      <Button
        accessibilityLabel="Créer un client et facturer"
        elevated
        onPress={() => router.push('/clients/new?next=invoice' as Href)}
        title="Créer mon premier client"
      />
    </Animated.View>
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
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      ...elevation[2],
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
      ...type.section,
      color: colors.text,
      textAlign: 'center',
    },
    description: {
      ...type.secondary,
      color: colors.textSecondary,
      textAlign: 'center',
      maxWidth: 300,
    },
  }));
}
