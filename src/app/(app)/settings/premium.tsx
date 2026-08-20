import { router } from 'expo-router';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { PlanComparison } from '@/components/subscription/plan-comparison';
import { SettingsScreenFrame } from '@/components/web/desktop/settings-screen-frame';
import { Button } from '@/components/ui/button';
import { LoadingView } from '@/components/ui/loading-view';
import {
  PREMIUM_PRICE_LABEL,
  PREMIUM_PRICE_PERIOD_LABEL,
} from '@/constants/subscription-pricing';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { useThemedStyles } from '@/hooks/use-colors';
import { usePremiumCheckout } from '@/hooks/use-premium-checkout';
import { usePremiumCheckoutReturn } from '@/hooks/use-premium-checkout-return';
import { useSubscription } from '@/hooks/use-subscription';
import { openManageSubscription } from '@/lib/subscription/open-manage-subscription';
import { useToast } from '@/providers/toast-provider';

export default function PremiumScreen() {
  const styles = useStyles();
  const { showError, showSuccess } = useToast();
  const { subscription, isPremium, usage, isLoading } = useSubscription();
  const { usesAppleIap, isConfigured, startCheckout, restorePurchases, subscribe, restore } =
    usePremiumCheckout();

  usePremiumCheckoutReturn();

  async function handleSubscribe() {
    if (isPremium) {
      showSuccess('Vous êtes déjà abonné à INVEQ Premium.');
      return;
    }

    if (!isConfigured) {
      showError(
        usesAppleIap
          ? 'In-App Purchase indisponible pour le moment.'
          : 'Le paiement n’est pas encore configuré. Contactez le support.',
      );
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

  async function handleRestore() {
    try {
      const restored = await restorePurchases();
      if (restored) {
        showSuccess('Achats restaurés. INVEQ Premium est actif.');
        return;
      }
      showError('Aucun abonnement Apple à restaurer pour ce compte.');
    } catch (error) {
      showError(readErrorMessage(error));
    }
  }

  async function handleManageSubscription() {
    try {
      await openManageSubscription();
    } catch (error) {
      showError(readErrorMessage(error));
    }
  }

  if (isLoading) {
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
          <Text style={styles.heroTitle}>INVEQ Premium</Text>
          <Text style={styles.heroPrice}>
            {PREMIUM_PRICE_LABEL}
            <Text style={styles.heroPeriod}>{PREMIUM_PRICE_PERIOD_LABEL}</Text>
          </Text>
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

        <PlanComparison currentPlanId={subscription?.effectivePlanId} />

        <View style={styles.actions}>
          {isPremium ? (
            <>
              <Button onPress={() => router.back()} title="Vous êtes Premium" variant="ghost" />
              {usesAppleIap ? (
                <Button
                  onPress={() => {
                    void handleManageSubscription();
                  }}
                  title="Gérer l’abonnement Apple"
                  variant="ghost"
                />
              ) : null}
            </>
          ) : (
            <Button
              loading={subscribe.isPending}
              onPress={() => {
                void handleSubscribe();
              }}
              title={
                usesAppleIap
                  ? `S’abonner — ${PREMIUM_PRICE_LABEL}/mois`
                  : `Passer à Premium — ${PREMIUM_PRICE_LABEL}/mois`
              }
            />
          )}

          {usesAppleIap && !isPremium ? (
            <Button
              loading={restore.isPending}
              onPress={() => {
                void handleRestore();
              }}
              title="Restaurer les achats"
              variant="ghost"
            />
          ) : null}

          <Text style={styles.footnote}>
            {usesAppleIap
              ? 'Paiement sécurisé via In-App Purchase Apple. Abonnement à renouvellement automatique, résiliable à tout moment dans Réglages > Abonnements.'
              : Platform.OS === 'web'
                ? 'Paiement sécurisé. Un code promo peut être saisi lors du paiement.'
                : 'Paiement sécurisé.'}
          </Text>
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
    heroPrice: {
      ...typography.title2,
      color: colors.primary,
      marginTop: spacing.xs,
    },
    heroPeriod: {
      ...typography.body,
      color: colors.textSecondary,
      fontWeight: '400',
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
