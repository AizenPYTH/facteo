import * as Linking from 'expo-linking';
import { StyleSheet, Text, View } from 'react-native';

import { PlanComparison } from '@/components/subscription/plan-comparison';
import { SettingsScreenFrame } from '@/components/web/desktop/settings-screen-frame';
import { Button } from '@/components/ui/button';
import { LoadingView } from '@/components/ui/loading-view';
import { getCatalogPlan } from '@/constants/subscription-catalog';
import { MARKETING_SITE_URL } from '@/constants/marketing/site';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { useThemedStyles } from '@/hooks/use-colors';
import { useSubscription } from '@/hooks/use-subscription';
import { getEffectivePlanDisplayName } from '@/lib/subscription/plans';
import { useToast } from '@/providers/toast-provider';

const MANAGE_SUBSCRIPTION_URL = `${MARKETING_SITE_URL}/tarifs`;

export default function PremiumScreen() {
  const styles = useStyles();
  const { showError, showSuccess } = useToast();
  const { subscription, isPremium, usage, isLoading } = useSubscription();

  const planId = subscription?.effectivePlanId ?? 'micro';
  const catalogPlan = getCatalogPlan(planId);
  const planName = getEffectivePlanDisplayName(planId);

  async function handleManageOnWeb() {
    try {
      const supported = await Linking.canOpenURL(MANAGE_SUBSCRIPTION_URL);
      if (!supported) {
        showError('Impossible d’ouvrir le site INVEQ.');
        return;
      }
      await Linking.openURL(MANAGE_SUBSCRIPTION_URL);
      showSuccess('Gérez votre abonnement sur inveq.fr');
    } catch {
      showError('Impossible d’ouvrir le site INVEQ.');
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
          <Text style={styles.heroEyebrow}>Votre offre</Text>
          <Text style={styles.heroTitle}>INVEQ {planName}</Text>
          <Text style={styles.heroSubtitle}>
            {catalogPlan?.description ??
              'Les offres Micro, Basique, Standard et Pro sont les mêmes que sur le site.'}
          </Text>
          {isPremium ? (
            <Text style={styles.heroStatus}>Abonnement actif — géré via votre compte INVEQ.</Text>
          ) : (
            <Text style={styles.heroStatus}>
              Offre gratuite Micro. Passez à une offre supérieure sur le web.
            </Text>
          )}
        </View>

        {usage ? (
          <View style={styles.usageRow}>
            <UsageChip label="Clients" value={usage.clients} />
            <UsageChip label="Devis" value={usage.quotes} />
            <UsageChip label="Factures" value={usage.invoices} />
          </View>
        ) : null}

        <PlanComparison currentPlanId={planId} />

        <View style={styles.actions}>
          <Button onPress={() => void handleManageOnWeb()} title="Voir les offres sur inveq.fr" />
          <Text style={styles.footnote}>
            L’achat et la gestion d’abonnement se font sur le site web INVEQ (pas d’achat in-app).
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

function useStyles() {
  return useThemedStyles((colors) => ({
    content: {
      gap: spacing.lg,
    },
    hero: {
      gap: spacing.xs,
    },
    heroEyebrow: {
      ...typography.footnoteMedium,
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
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
    heroStatus: {
      ...typography.footnote,
      color: colors.primary,
      marginTop: spacing.xs,
      fontWeight: '600',
    },
    usageRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    actions: {
      gap: spacing.sm,
      paddingTop: spacing.xs,
      paddingBottom: spacing.xl,
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
