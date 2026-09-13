import { router, type Href } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Text, View, type ViewStyle } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { useColors, useThemedStyles } from '@/hooks/use-colors';

export type DashboardWelcomeProps = {
  /** Prénom, quand on le connaît : la première phrase s'adresse à l'utilisateur. */
  firstName?: string;
  style?: ViewStyle;
};

/**
 * Écran d'accueil d'un compte encore vide.
 *
 * Annonce les trois étapes plutôt qu'une seule action isolée : un nouvel
 * utilisateur qui crée un client sans savoir ce qui suit reste bloqué là.
 */
const STEPS = [
  { icon: { ios: 'person.badge.plus', android: 'person_add', web: 'person_add' }, label: 'Ajoutez un client' },
  { icon: { ios: 'doc.text', android: 'description', web: 'description' }, label: 'Créez un devis ou une facture' },
  { icon: { ios: 'paperplane', android: 'send', web: 'send' }, label: 'Envoyez-la et suivez le paiement' },
] as const;

export function DashboardWelcome({ firstName, style }: DashboardWelcomeProps) {
  const styles = useStyles();
  const colors = useColors();

  return (
    <Card style={[styles.container, style]} variant="elevated">
      <View style={styles.iconWrap}>
        <SymbolView
          name={{ ios: 'sparkles', android: 'auto_awesome', web: 'auto_awesome' }}
          size={26}
          tintColor={colors.primary}
          type="hierarchical"
        />
      </View>

      <Text accessibilityRole="header" maxFontSizeMultiplier={1.5} style={styles.title}>
        {firstName ? `Bienvenue, ${firstName}.` : 'Bienvenue sur INVEQ.'}
      </Text>
      <Text maxFontSizeMultiplier={1.5} style={styles.description}>
        Trois étapes pour votre première facture.
      </Text>

      <View style={styles.steps}>
        {STEPS.map((step, index) => (
          <View key={step.label} style={styles.step}>
            <View style={styles.stepIndex}>
              <Text maxFontSizeMultiplier={1.2} style={styles.stepIndexLabel}>
                {index + 1}
              </Text>
            </View>
            <Text maxFontSizeMultiplier={1.4} style={styles.stepLabel}>
              {step.label}
            </Text>
          </View>
        ))}
      </View>

      <Button
        accessibilityLabel="Ajouter un client"
        onPress={() => router.push('/clients/new' as Href)}
        title="Ajouter un client"
      />
    </Card>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
    container: {
      alignItems: 'center',
      paddingVertical: spacing.xl,
      paddingHorizontal: spacing.lg,
      gap: spacing.md,
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
    steps: {
      alignSelf: 'stretch',
      gap: spacing[2.5],
      paddingVertical: spacing[2],
    },
    step: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing[3],
    },
    stepIndex: {
      width: 24,
      height: 24,
      borderRadius: radius.full,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primarySubtle,
    },
    stepIndexLabel: {
      ...typography.caption1,
      fontWeight: '600' as const,
      color: colors.primary,
    },
    stepLabel: {
      ...typography.subheadline,
      color: colors.text,
      flex: 1,
    },
  }));
}
