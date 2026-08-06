import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { PlanCatalog } from '@/components/subscription/plan-catalog';
import { SettingsScreenFrame } from '@/components/web/desktop/settings-screen-frame';
import { LoadingView } from '@/components/ui/loading-view';
import {
  getCatalogPlanById,
  type PaidCatalogPlanId,
} from '@/constants/subscription-plans';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { useThemedStyles } from '@/hooks/use-colors';
import { usePremiumCheckout } from '@/hooks/use-premium-checkout';
import { usePremiumCheckoutReturn } from '@/hooks/use-premium-checkout-return';
import { useSubscription } from '@/hooks/use-subscription';
import { getEffectivePlanDisplayName } from '@/lib/subscription/plans';
import { useToast } from '@/providers/toast-provider';

export default function PremiumScreen() {
  const styles = useStyles();
  const { showError, showSuccess } = useToast();
  const { subscription, plan, usage, isPremium, isLoading } = useSubscription();
  const {
    isConfigured,
    isPortalConfigured,
    startCheckout,
    manageSubscription,
    subscribe,
    portal,
  } = usePremiumCheckout();
  const [loadingPlanId, setLoadingPlanId] = useState<PaidCatalogPlanId | null>(null);

  usePremiumCheckoutReturn();

  async function handleSelectPlan(planId: PaidCatalogPlanId) {
    if (isPremium) {
      showError('Vous avez déjà un abonnement actif. Utilisez « Gérer l’abonnement ».');
      return;
    }

    if (!isConfigured) {
      showError('Stripe n’est pas encore configuré. Contactez le support.');
      return;
    }

    setLoadingPlanId(planId);

    try {
      const completed = await startCheckout(planId);
      const catalog = getCatalogPlanById(planId);

      if (completed) {
        showSuccess(`Offre ${catalog?.name ?? planId} activée.`);
      }
    } catch (error) {
      showError(readErrorMessage(error));
    } finally {
      setLoadingPlanId(null);
    }
  }

  async function handleManage() {
    if (!isPortalConfigured) {
      showError('Portail de facturation non configuré. Contactez le support.');
      return;
    }

    try {
      await manageSubscription();
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

  const currentName = plan?.displayName ?? getEffectivePlanDisplayName(subscription?.effectivePlanId ?? 'micro');

  return (
    <SettingsScreenFrame title="Abonnement">
      <View style={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Votre offre</Text>
          <Text style={styles.heroPlan}>{currentName}</Text>
          <Text style={styles.heroSubtitle}>
            Choisissez l’offre adaptée à votre activité. Paiement sécurisé par Stripe.
          </Text>
        </View>

        {usage ? (
          <View style={styles.usageRow}>
            <UsageChip label="Clients" value={usage.clients} />
            <UsageChip label="Devis" value={usage.quotes} />
            <UsageChip label="Factures" value={usage.invoices} />
          </View>
        ) : null}

        <PlanCatalog
          checkoutEnabled={isConfigured}
          checkoutLoadingPlanId={subscribe.isPending ? loadingPlanId : null}
          currentPlanId={subscription?.effectivePlanId}
          manageLoading={portal.isPending}
          onManageSubscription={
            isPremium
              ? () => {
                  void handleManage();
                }
              : undefined
          }
          onSelectPaidPlan={(planId) => {
            void handleSelectPlan(planId);
          }}
        />

        <Text style={styles.footnote}>
          Un code promo peut être saisi lors du paiement Stripe. Facturation mensuelle.
        </Text>
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
    heroPlan: {
      ...typography.title2,
      color: colors.primary,
      marginTop: spacing.xs,
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
    footnote: {
      ...typography.caption1,
      color: colors.textTertiary,
      textAlign: 'center',
      paddingBottom: spacing.lg,
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
