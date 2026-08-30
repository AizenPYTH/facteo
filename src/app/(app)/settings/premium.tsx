/**
 * Écran Abonnement — DESIGN §5.10
 *
 * iOS : Apple IAP uniquement (pas de Stripe Checkout / /tarifs).
 * Web : Stripe Checkout.
 * Un abonnement web ou Apple est reconnu via la même table `subscriptions`.
 */
import { SymbolView } from 'expo-symbols';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { PlanComparison } from '@/components/subscription/plan-comparison';
import { SettingsScreenFrame } from '@/components/web/desktop/settings-screen-frame';
import { Button } from '@/components/ui/button';
import { LoadingView } from '@/components/ui/loading-view';
import { SegmentedControl } from '@/components/ui/segmented-control';
import {
  PREMIUM_PRICE_LABEL,
  PREMIUM_PRICE_PERIOD_LABEL,
} from '@/constants/subscription-pricing';
import { APPLE_PREMIUM_PRODUCT_ID } from '@/constants/iap';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { formatDate } from '@/lib/format/date';
import { isAppleIapNotConfiguredError } from '@/lib/iap/apple-iap';
import {
  resolvePremiumPlan,
  resolveStandardPlan,
} from '@/lib/subscription/resolve-display-plans';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { useApplePremiumPurchase } from '@/hooks/use-apple-iap';
import { usePremiumCheckout } from '@/hooks/use-premium-checkout';
import { usePremiumCheckoutReturn } from '@/hooks/use-premium-checkout-return';
import { useSubscription, useSubscriptionPlans } from '@/hooks/use-subscription';
import { useToast } from '@/providers/toast-provider';
import type { SubscriptionPlan, UserSubscription } from '@/types/subscription';

const IS_APPLE_IAP_PLATFORM = Platform.OS === 'ios';

type DurationOption = {
  id: 'monthly' | 'yearly';
  label: string;
  priceLabel: string;
  periodLabel: string;
  appStoreProductId: string | null;
};

/**
 * DESIGN §5.10 : « deux durées » si la donnée existe. Le catalogue actuel
 * n'expose qu'une offre mensuelle — pas de ligne annuelle.
 */
function buildDurationOptions(
  premiumPlan: SubscriptionPlan,
  priceLabel: string,
): DurationOption[] {
  return [
    {
      id: 'monthly',
      label: 'Mensuel',
      priceLabel,
      periodLabel: PREMIUM_PRICE_PERIOD_LABEL,
      appStoreProductId: premiumPlan.appStoreProductId ?? APPLE_PREMIUM_PRODUCT_ID,
    },
  ];
}

export default function PremiumScreen() {
  const styles = useStyles();
  const { showError, showSuccess } = useToast();
  const { subscription, isPremium, usage, isLoading, refresh } = useSubscription();
  const plansQuery = useSubscriptionPlans();
  const stripeCheckout = usePremiumCheckout();
  const appleIap = useApplePremiumPurchase();

  usePremiumCheckoutReturn();

  const plans = plansQuery.data ?? [];
  const standardPlan = resolveStandardPlan(plans);
  const premiumPlan = resolvePremiumPlan(plans);
  const appStoreProductId =
    premiumPlan?.appStoreProductId ?? APPLE_PREMIUM_PRODUCT_ID;
  const appleStoreProduct = appleIap.products.data?.find(
    (product) => product.productId === appStoreProductId,
  );
  const appleProductsError = appleIap.products.isError;
  const appleProductsEmpty =
    IS_APPLE_IAP_PLATFORM &&
    appleIap.products.isFetched &&
    !appleIap.products.isFetching &&
    (appleIap.products.data?.length ?? 0) === 0;
  const premiumPriceLabel =
    IS_APPLE_IAP_PLATFORM && appleStoreProduct?.displayPrice
      ? appleStoreProduct.displayPrice
      : PREMIUM_PRICE_LABEL;

  const durationOptions = useMemo(
    () =>
      premiumPlan
        ? buildDurationOptions(premiumPlan, premiumPriceLabel)
        : [],
    [premiumPlan, premiumPriceLabel],
  );

  async function handleStripeSubscribe() {
    if (isPremium) {
      showSuccess('Vous êtes déjà abonné à INVEQ Premium.');
      return;
    }

    if (!stripeCheckout.isConfigured) {
      showError('Stripe n’est pas encore configuré. Contactez le support.');
      return;
    }

    try {
      const completed = await stripeCheckout.startCheckout();

      if (completed) {
        showSuccess('INVEQ Premium est activé.');
      }
    } catch (error) {
      showError(readErrorMessage(error));
    }
  }

  async function handleApplePurchase(appStoreProductId: string | null) {
    try {
      await appleIap.purchase.mutateAsync(appStoreProductId);
      showSuccess('INVEQ Premium est activé.');
    } catch (error) {
      showError(readAppleErrorMessage(error));
    }
  }

  async function handleRestorePurchases() {
    try {
      const restored = await appleIap.restore.mutateAsync();

      if (restored.length > 0) {
        showSuccess('Achats restaurés.');
      } else {
        showError('Aucun achat Apple à restaurer sur ce compte.');
      }
    } catch (error) {
      showError(readAppleErrorMessage(error));
    }
  }

  async function handleRetry() {
    await Promise.all([
      refresh(),
      plansQuery.refetch(),
      IS_APPLE_IAP_PLATFORM ? appleIap.products.refetch() : Promise.resolve(),
    ]);
  }

  if (isLoading || plansQuery.isLoading) {
    return (
      <SettingsScreenFrame title="Abonnement">
        <LoadingView message="Chargement de votre offre…" />
      </SettingsScreenFrame>
    );
  }

  if (plansQuery.isError || !standardPlan || !premiumPlan) {
    return (
      <SettingsScreenFrame title="Abonnement">
        <View style={styles.errorState}>
          <Text style={styles.errorTitle}>Impossible de charger les abonnements.</Text>
          <Text style={styles.errorBody}>
            Vérifiez votre connexion, puis réessayez. Si le problème continue, contactez le
            support.
          </Text>
          <Button onPress={() => void handleRetry()} title="Réessayer" />
        </View>
      </SettingsScreenFrame>
    );
  }

  return (
    <SettingsScreenFrame title="Abonnement">
      <View style={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>INVEQ Premium</Text>
          {isPremium ? (
            <Text style={styles.heroSubtitle}>
              Votre abonnement est actif sur ce compte — web et iOS partagent le même état.
            </Text>
          ) : (
            <>
              <Text style={styles.heroPrice}>
                {premiumPriceLabel}
                <Text style={styles.heroPeriod}>{PREMIUM_PRICE_PERIOD_LABEL}</Text>
              </Text>
              <Text style={styles.heroSubtitle}>
                Débloquez toutes les fonctionnalités. Si vous êtes déjà abonné sur le web,
                reconnectez-vous avec le même compte : l’abonnement est reconnu automatiquement.
              </Text>
            </>
          )}
        </View>

        {usage ? (
          <View style={styles.usageRow}>
            <UsageChip label="Clients" value={usage.clients} />
            <UsageChip label="Devis" value={usage.quotes} />
            <UsageChip label="Factures" value={usage.invoices} />
          </View>
        ) : null}

        {isPremium && subscription ? <CurrentPlanState subscription={subscription} /> : null}

        {!isPremium && IS_APPLE_IAP_PLATFORM ? (
          appleProductsError || appleProductsEmpty ? (
            <View style={styles.errorState}>
              <Text style={styles.errorTitle}>Impossible de charger les abonnements.</Text>
              <Text style={styles.errorBody}>
                L’App Store n’a renvoyé aucune offre. Vérifiez votre connexion, que les produits
                sont actifs dans App Store Connect, puis réessayez.
              </Text>
              <Button
                loading={appleIap.products.isFetching}
                onPress={() => void appleIap.products.refetch()}
                title="Réessayer"
              />
            </View>
          ) : (
            <AppleOffer
              appStoreProductId={appStoreProductId}
              durationOptions={durationOptions}
              isConfigured={appleIap.isConfigured}
              isLoadingProducts={appleIap.products.isLoading}
              onPurchase={handleApplePurchase}
              purchasing={appleIap.purchase.isPending}
            />
          )
        ) : null}

        <PlanComparison isPremium={isPremium} premiumPlan={premiumPlan} standardPlan={standardPlan} />

        {!isPremium && !IS_APPLE_IAP_PLATFORM ? (
          <View style={styles.actions}>
            <Button
              loading={stripeCheckout.subscribe.isPending}
              onPress={() => {
                void handleStripeSubscribe();
              }}
              title={`Passer à Premium — ${PREMIUM_PRICE_LABEL}/mois`}
            />
            <Text style={styles.footnote}>
              Paiement sécurisé par Stripe. Un code promo peut être saisi lors du paiement.
            </Text>
          </View>
        ) : null}

        {isPremium && !IS_APPLE_IAP_PLATFORM ? (
          <Button onPress={() => router.back()} title="Vous êtes Premium" variant="tertiary" />
        ) : null}

        {IS_APPLE_IAP_PLATFORM ? (
          <Button
            loading={appleIap.restore.isPending}
            onPress={() => {
              void handleRestorePurchases();
            }}
            title="Restaurer mes achats"
            variant="tertiary"
          />
        ) : null}
      </View>
    </SettingsScreenFrame>
  );
}

function CurrentPlanState({ subscription }: { subscription: UserSubscription }) {
  const styles = useCurrentPlanStyles();
  const colors = useColors();

  const renewalLabel = subscription.cancelAtPeriodEnd
    ? 'Se termine le'
    : 'Prochain renouvellement le';
  const renewalDate = formatDate(subscription.currentPeriodEnd);

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <SymbolView name="checkmark.seal.fill" size={18} tintColor={colors.success} />
        <Text style={styles.title}>Abonnement actif</Text>
      </View>
      {subscription.currentPeriodEnd ? (
        <Text style={styles.meta}>
          {renewalLabel} {renewalDate}.
        </Text>
      ) : null}
      {subscription.cancelAtPeriodEnd ? (
        <Text style={styles.meta}>
          Aucun renouvellement après cette date. Vous pouvez vous réabonner à tout moment.
        </Text>
      ) : null}
    </View>
  );
}

type AppleOfferProps = {
  appStoreProductId: string | null;
  durationOptions: DurationOption[];
  isConfigured: boolean;
  isLoadingProducts: boolean;
  onPurchase: (appStoreProductId: string | null) => void;
  purchasing: boolean;
};

function AppleOffer({
  appStoreProductId,
  durationOptions,
  isConfigured,
  isLoadingProducts,
  onPurchase,
  purchasing,
}: AppleOfferProps) {
  const styles = useAppleOfferStyles();
  const [selectedId, setSelectedId] = useState<DurationOption['id']>(
    durationOptions[0]?.id ?? 'monthly',
  );
  const active = durationOptions.find((option) => option.id === selectedId) ?? durationOptions[0];
  const resolvedProductId = active?.appStoreProductId ?? appStoreProductId;
  const isUnavailable = !resolvedProductId || !isConfigured;

  if (isLoadingProducts) {
    return <LoadingView message="Chargement des offres App Store…" />;
  }

  return (
    <View style={styles.container}>
      {durationOptions.length > 1 ? (
        <SegmentedControl
          accessibilityLabel="Durée de l’abonnement"
          onChange={setSelectedId}
          options={durationOptions.map((option) => ({ value: option.id, label: option.label }))}
          value={selectedId}
        />
      ) : null}

      <View style={styles.actions}>
        <Button
          disabled={isUnavailable}
          loading={purchasing}
          onPress={() => onPurchase(resolvedProductId)}
          title={`Continuer avec l’App Store — ${active?.priceLabel ?? PREMIUM_PRICE_LABEL}${active?.periodLabel ?? PREMIUM_PRICE_PERIOD_LABEL}`}
        />
        {isUnavailable ? (
          <Text style={styles.disabledReason}>
            Offre App Store non configurée pour le moment. Contactez le support.
          </Text>
        ) : null}
        <Text style={styles.footnote}>
          Paiement via votre compte Apple. Renouvellement automatique jusqu’à annulation.
          Résiliation depuis Réglages iOS › votre nom › Abonnements.
        </Text>
      </View>
    </View>
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

function readAppleErrorMessage(error: unknown): string {
  if (isAppleIapNotConfiguredError(error)) {
    return error.message;
  }

  return readErrorMessage(error);
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
    errorState: {
      gap: spacing.md,
      paddingVertical: spacing.xl,
      alignItems: 'stretch',
    },
    errorTitle: {
      ...typography.title3,
      color: colors.text,
      textAlign: 'center',
    },
    errorBody: {
      ...typography.subheadline,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
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

function useCurrentPlanStyles() {
  return useThemedStyles((colors) => ({
    card: {
      gap: spacing.xs,
      backgroundColor: colors.successSubtle,
      borderRadius: radius.card,
      borderWidth: 1,
      borderColor: colors.success,
      padding: spacing.md,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    title: {
      ...typography.headline,
      color: colors.text,
    },
    meta: {
      ...typography.footnote,
      color: colors.textSecondary,
    },
  }));
}

function useAppleOfferStyles() {
  return useThemedStyles((colors) => ({
    container: {
      gap: spacing.md,
    },
    actions: {
      gap: spacing.sm,
    },
    disabledReason: {
      ...typography.caption1,
      color: colors.textTertiary,
      textAlign: 'center',
    },
    footnote: {
      ...typography.caption1,
      color: colors.textTertiary,
      textAlign: 'center',
      lineHeight: 16,
    },
  }));
}
