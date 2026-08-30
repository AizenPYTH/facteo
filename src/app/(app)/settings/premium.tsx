import { Platform, StyleSheet, Text, View } from 'react-native';

import { PlanComparison } from '@/components/subscription/plan-comparison';
import { SettingsScreenFrame } from '@/components/web/desktop/settings-screen-frame';
import { Button } from '@/components/ui/button';
import { LoadingView } from '@/components/ui/loading-view';
import type { ApplePaidPlanId } from '@/constants/iap';
import { PAID_CATALOG_PLAN_IDS, type CatalogPlanId } from '@/constants/subscription-catalog';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { useAppleStoreProducts } from '@/hooks/use-apple-store-products';
import { useThemedStyles } from '@/hooks/use-colors';
import { usePlanCheckout } from '@/hooks/use-plan-checkout';
import { usePremiumCheckoutReturn } from '@/hooks/use-premium-checkout-return';
import { useSubscription } from '@/hooks/use-subscription';
import { getEffectivePlanDisplayName, isPaidPlan, PLAN_RANK } from '@/lib/subscription/plans';
import { openManageSubscription } from '@/lib/subscription/open-manage-subscription';
import { useToast } from '@/providers/toast-provider';

export default function PremiumScreen() {
  const styles = useStyles();
  const { showError, showSuccess } = useToast();
  const { subscription, usage, isLoading } = useSubscription();
  const { usesAppleIap, isConfigured, startCheckout, restorePurchases, subscribe, restore } =
    usePlanCheckout();
  const { byPlanId, isLoading: appleProductsLoading, refetch: refetchAppleProducts } =
    useAppleStoreProducts();

  usePremiumCheckoutReturn();

  const currentPlanId = subscription?.effectivePlanId ?? 'micro';
  const currentRank = PLAN_RANK[currentPlanId];
  const hasPaid = isPaidPlan(currentPlanId);
  const billingIsApple = Boolean(subscription?.stripeSubscriptionId?.startsWith('apple:'));

  const storeKitPrices = usesAppleIap
    ? (Object.fromEntries(
        PAID_CATALOG_PLAN_IDS.map((planId) => [
          planId,
          byPlanId[planId as ApplePaidPlanId]?.displayPrice,
        ]),
      ) as Partial<Record<ApplePaidPlanId, string>>)
    : null;

  async function handleSubscribe(planId: CatalogPlanId) {
    if (planId === 'micro') return;

    if (PLAN_RANK[planId] <= currentRank && hasPaid) {
      showSuccess(`Vous êtes déjà sur ${getEffectivePlanDisplayName(currentPlanId)} ou supérieur.`);
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

    if (usesAppleIap && !byPlanId[planId as ApplePaidPlanId]) {
      showError(
        `Offre ${planId} introuvable sur l’App Store. Vérifiez les produits In-App Purchase.`,
      );
      return;
    }

    try {
      const completed = await startCheckout(planId);
      if (completed) {
        showSuccess(`INVEQ ${getEffectivePlanDisplayName(planId)} est activé.`);
      }
    } catch (error) {
      showError(readErrorMessage(error));
    }
  }

  async function handleRestore() {
    try {
      const restored = await restorePurchases();
      if (restored) {
        showSuccess('Achats restaurés. Votre offre Apple est active.');
        return;
      }
      showError('Aucun abonnement Apple à restaurer pour ce compte.');
    } catch (error) {
      showError(readErrorMessage(error));
    }
  }

  async function handleManageApple() {
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

  const appleCatalogMissing =
    usesAppleIap && !appleProductsLoading && Object.keys(byPlanId).length === 0 && !hasPaid;

  return (
    <SettingsScreenFrame title="Abonnement">
      <View style={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>INVEQ {getEffectivePlanDisplayName(currentPlanId)}</Text>
          <Text style={styles.heroSubtitle}>
            {hasPaid
              ? usesAppleIap && billingIsApple
                ? 'Abonnement actif via l’App Store.'
                : usesAppleIap
                  ? 'Abonnement actif (souscrit hors App Store). Accès synchronisé sur ce compte.'
                  : 'Abonnement actif sur votre compte INVEQ.'
              : 'Passez à une offre supérieure pour débloquer plus de fonctionnalités.'}
          </Text>
        </View>

        {appleCatalogMissing ? (
          <View style={styles.hero}>
            <Text style={styles.heroSubtitle}>
              Catalogue App Store indisponible pour le moment (produits non renvoyés par StoreKit).
            </Text>
            <Button
              onPress={() => {
                void refetchAppleProducts();
              }}
              title="Réessayer"
              variant="secondary"
            />
          </View>
        ) : null}

        {usage ? (
          <View style={styles.usageRow}>
            <UsageChip label="Clients" value={usage.clients} />
            <UsageChip label="Devis" value={usage.quotes} />
            <UsageChip label="Factures" value={usage.invoices} />
          </View>
        ) : null}

        <PlanComparison currentPlanId={currentPlanId} storeKitPrices={storeKitPrices} />

        <View style={styles.actions}>
          {PAID_CATALOG_PLAN_IDS.map((planId) => {
            const rank = PLAN_RANK[planId];
            if (rank <= currentRank) return null;

            const storePrice = byPlanId[planId as ApplePaidPlanId]?.displayPrice;
            const title = usesAppleIap
              ? storePrice
                ? `Passer à ${getEffectivePlanDisplayName(planId)} — ${storePrice}`
                : `Passer à ${getEffectivePlanDisplayName(planId)}`
              : `Passer à ${getEffectivePlanDisplayName(planId)}`;

            return (
              <Button
                key={planId}
                loading={subscribe.isPending}
                onPress={() => {
                  void handleSubscribe(planId);
                }}
                title={title}
              />
            );
          })}

          {usesAppleIap && billingIsApple ? (
            <Button
              onPress={() => {
                void handleManageApple();
              }}
              title="Gérer l’abonnement Apple"
              variant="ghost"
            />
          ) : null}

          {usesAppleIap ? (
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
              ? 'Paiement via In-App Purchase Apple. Les prix affichés viennent de l’App Store. Résiliation dans Réglages > Abonnements.'
              : Platform.OS === 'web'
                ? 'Paiement sécurisé Stripe. Un code promo peut être saisi lors du paiement.'
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
  if (error instanceof Error) return error.message;
  return 'Une erreur est survenue.';
}

function useStyles() {
  return useThemedStyles((colors) => ({
    content: { gap: spacing.lg },
    hero: { gap: spacing.xs },
    heroTitle: { ...typography.title1, color: colors.text },
    heroSubtitle: {
      ...typography.body,
      color: colors.textSecondary,
      lineHeight: 22,
    },
    usageRow: { flexDirection: 'row', gap: spacing.sm },
    actions: { gap: spacing.sm, paddingTop: spacing.xs },
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
    chipValue: { ...typography.headline, color: colors.text },
    chipLabel: { ...typography.caption1, color: colors.textSecondary },
  }));
}
