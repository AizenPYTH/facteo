import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { PlanComparison } from '@/components/subscription/plan-comparison';
import { SettingsScreenFrame } from '@/components/web/desktop/settings-screen-frame';
import { Button } from '@/components/ui/button';
import { LoadingView } from '@/components/ui/loading-view';
import {
  PREMIUM_PRICE_LABEL,
  PREMIUM_PRICE_PERIOD_LABEL,
} from '@/constants/subscription-pricing';
import { iconSize } from '@/constants/theme/design-system';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { useColors, useGradients, useThemedStyles } from '@/hooks/use-colors';
import { fadeInUp } from '@/lib/motion/presets';
import { usePremiumCheckout } from '@/hooks/use-premium-checkout';
import { usePremiumCheckoutReturn } from '@/hooks/use-premium-checkout-return';
import { useSubscription, useSubscriptionPlans } from '@/hooks/use-subscription';
import { useToast } from '@/providers/toast-provider';

export default function PremiumScreen() {
  const styles = useStyles();
  const colors = useColors();
  const gradients = useGradients();
  const { showError, showSuccess } = useToast();
  const { subscription, isPremium, usage, isLoading } = useSubscription();
  const plansQuery = useSubscriptionPlans();
  const { isConfigured, startCheckout, subscribe } = usePremiumCheckout();

  usePremiumCheckoutReturn();

  const standardPlan = plansQuery.data?.find((plan) => plan.id === 'free');
  const premiumPlan = plansQuery.data?.find((plan) => plan.id === 'premium');

  async function handleSubscribe() {
    if (isPremium) {
      showSuccess('Vous êtes déjà abonné à INVEQ Premium.');
      return;
    }

    if (!isConfigured) {
      showError('Stripe n’est pas encore configuré. Contactez le support.');
      return;
    }

    try {
      const completed = await startCheckout();

      if (completed) {
        showSuccess('INVEQ Premium est activé.');
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
        <Animated.View entering={fadeInUp({ index: 0 })}>
          <LinearGradient
            colors={gradients.primary}
            end={{ x: 1, y: 1 }}
            start={{ x: 0, y: 0 }}
            style={styles.hero}>
            <View style={styles.heroIconWrap}>
              <SymbolView
                name={{ ios: 'sparkles', android: 'auto_awesome', web: 'auto_awesome' }}
                size={iconSize.lg}
                tintColor={colors.onPrimary}
              />
            </View>
            <Text style={styles.heroTitle}>INVEQ Premium</Text>
            <Text style={styles.heroPrice}>
              {PREMIUM_PRICE_LABEL}
              <Text style={styles.heroPeriod}>{PREMIUM_PRICE_PERIOD_LABEL}</Text>
            </Text>
            <Text style={styles.heroSubtitle}>
              Débloquez toutes les fonctionnalités et supprimez les limites de votre activité.
            </Text>
          </LinearGradient>
        </Animated.View>

        {usage ? (
          <Animated.View entering={fadeInUp({ index: 1 })} style={styles.usageRow}>
            <UsageChip label="Clients" value={usage.clients} />
            <UsageChip label="Devis" value={usage.quotes} />
            <UsageChip label="Factures" value={usage.invoices} />
          </Animated.View>
        ) : null}

        <Animated.View entering={fadeInUp({ index: 2 })}>
          <PlanComparison
            currentPlanId={isPremium ? 'premium' : 'free'}
            premiumPlan={premiumPlan}
            standardPlan={standardPlan}
          />
        </Animated.View>

        <Animated.View entering={fadeInUp({ index: 3 })} style={styles.actions}>
          {isPremium ? (
            <View style={styles.premiumConfirmed}>
              <SymbolView
                name={{ ios: 'checkmark.seal.fill', android: 'verified', web: 'verified' }}
                size={iconSize.md}
                tintColor={colors.success}
              />
              <Text style={styles.premiumConfirmedText}>Vous êtes abonné à INVEQ Premium</Text>
            </View>
          ) : (
            <Button
              elevated
              loading={subscribe.isPending}
              onPress={() => {
                void handleSubscribe();
              }}
              title={`Passer à Premium — ${PREMIUM_PRICE_LABEL}/mois`}
            />
          )}
          <Text style={styles.footnote}>
            Paiement sécurisé par Stripe. Un code promo peut être saisi lors du paiement.
          </Text>
        </Animated.View>
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
      padding: spacing.lg,
      borderRadius: radius.modal,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.32,
      shadowRadius: 24,
      elevation: 10,
    },
    heroIconWrap: {
      width: 44,
      height: 44,
      borderRadius: radius.full,
      backgroundColor: 'rgba(255,255,255,0.2)',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.xs,
    },
    heroTitle: {
      ...typography.title1,
      color: colors.onPrimary,
    },
    heroPrice: {
      ...typography.title2,
      color: colors.onPrimary,
      marginTop: spacing.xs,
    },
    heroPeriod: {
      ...typography.body,
      color: 'rgba(255,255,255,0.8)',
      fontWeight: '400',
    },
    heroSubtitle: {
      ...typography.body,
      color: 'rgba(255,255,255,0.88)',
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
    premiumConfirmed: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
      paddingVertical: spacing.md,
      borderRadius: radius.buttonLarge,
      backgroundColor: colors.successSubtle,
    },
    premiumConfirmedText: {
      ...typography.headline,
      color: colors.success,
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
