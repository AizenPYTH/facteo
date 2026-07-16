import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { PlanComparison } from '@/components/subscription/plan-comparison';
import { SettingsScreenFrame } from '@/components/web/desktop/settings-screen-frame';
import { Button } from '@/components/ui/button';
import { LoadingView } from '@/components/ui/loading-view';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { useThemedStyles } from '@/hooks/use-colors';
import { usePremiumCheckout } from '@/hooks/use-premium-checkout';
import { usePremiumCheckoutReturn } from '@/hooks/use-premium-checkout-return';
import { useSubscription, useSubscriptionPlans } from '@/hooks/use-subscription';
import { useToast } from '@/providers/toast-provider';

export default function PremiumScreen() {
  const styles = useStyles();
  const { showError, showSuccess } = useToast();
  const { subscription, isPremium, usage, isLoading } = useSubscription();
  const plansQuery = useSubscriptionPlans();
  const { isConfigured, startCheckout, subscribe } = usePremiumCheckout();

  usePremiumCheckoutReturn();

  const standardPlan = plansQuery.data?.find((plan) => plan.id === 'free');
  const premiumPlan = plansQuery.data?.find((plan) => plan.id === 'premium');

  async function handleSubscribe() {
    if (isPremium) {
      showSuccess('Vous êtes déjà abonné à FACTEO Premium.');
      return;
    }

    if (!isConfigured) {
      showError('Stripe n’est pas encore configuré. Contactez le support.');
      return;
    }

    try {
      const completed = await startCheckout();

      if (completed) {
        showSuccess('FACTEO Premium est activé.');
      }
    } catch (error) {
      showError(readErrorMessage(error));
    }
  }

  if (isLoading || plansQuery.isLoading || !standardPlan || !premiumPlan) {
    return (
      <SettingsScreenFrame title="Abonnement">
        <LoadingView message="Chargement de votre offre..." />
      </SettingsScreenFrame>
    );
  }

  return (
    <SettingsScreenFrame title="Abonnement">
      <View style={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>FACTEO Premium</Text>
          <Text style={styles.heroSubtitle}>
            Débloquez toutes les fonctionnalités et supprimez les limites de votre activité.
          </Text>
        </View>

        {usage ? (
          <View style={styles.usageRow}>
            <UsageChip label="Clients" value={usage.clients} />
            <UsageChip label="Devis" value={usage.quotes} />
            <UsageChip label="Factures" value={usage.invoices} />
          </View>
        ) : null}

        <PlanComparison
          currentPlanId={subscription?.effectivePlanId}
          premiumPlan={premiumPlan}
          standardPlan={standardPlan}
        />

        <View style={styles.actions}>
          {isPremium ? (
            <Button onPress={() => router.back()} title="Vous êtes Premium" variant="ghost" />
          ) : (
            <Button
              loading={subscribe.isPending}
              onPress={() => {
                void handleSubscribe();
              }}
              title="Passer à Premium"
            />
          )}
          <Text style={styles.footnote}>Paiement sécurisé par Stripe Checkout.</Text>
        </View>
      </View>
    </SettingsScreenFrame>
  );
}

function UsageChip({ label, value }: { label: string; value: number }) {
  const styles = useUsageStyles();

  return (
    <View style={styles.chip}>
      <Text style={styles.chipValue}>{value}</Text>
      <Text style={styles.chipLabel}>{label}</Text>
    </View>
  );
}

function readErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Une erreur est survenue.';
}

function useStyles() {
  return useThemedStyles((colors) => ({
    content: {
      gap: spacing.lg,
    },
    hero: {
      gap: spacing.xs,
    },
    heroTitle: {
      ...typography.title1,
      color: colors.text,
    },
    heroSubtitle: {
      ...typography.body,
      color: colors.textSecondary,
      lineHeight: 22,
    },
    usageRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    actions: {
      gap: spacing.sm,
      paddingTop: spacing.xs,
    },
    footnote: {
      ...typography.caption1,
      color: colors.textTertiary,
      textAlign: 'center',
    },
  }));
}

function useUsageStyles() {
  return useThemedStyles((colors) => ({
    chip: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.xs,
      borderRadius: 12,
      backgroundColor: colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      gap: 2,
    },
    chipValue: {
      ...typography.headline,
      color: colors.text,
    },
    chipLabel: {
      ...typography.caption1,
      color: colors.textSecondary,
    },
  }));
}
