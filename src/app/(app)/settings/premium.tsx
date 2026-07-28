import { useState } from 'react';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { SettingsScreenFrame } from '@/components/web/desktop/settings-screen-frame';
import { Button } from '@/components/ui/button';
import { LoadingView } from '@/components/ui/loading-view';
import { TextField } from '@/components/ui/text-field';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { useThemedStyles } from '@/hooks/use-colors';
import { usePremiumCheckout } from '@/hooks/use-premium-checkout';
import { usePremiumCheckoutReturn } from '@/hooks/use-premium-checkout-return';
import { useSubscription } from '@/hooks/use-subscription';
import { getPlanDisplayName } from '@/lib/subscription/plans';
import { useToast } from '@/providers/toast-provider';
import {
  openBillingPortal,
  type BillingInterval,
  type PaidPlanId,
} from '@/lib/stripe/subscription-checkout';
import type { SubscriptionStatus } from '@/types/subscription';
import * as WebBrowser from 'expo-web-browser';

const PAID_PLANS: Array<{
  id: PaidPlanId;
  name: string;
  blurb: string;
  monthlyHint: string;
  yearlyHint: string;
}> = [
  {
    id: 'basique',
    name: 'Basique',
    blurb: 'Documents illimités, modèles PDF, SIREN 50/mois.',
    monthlyHint: 'Mensuel',
    yearlyHint: 'Annuel',
  },
  {
    id: 'standard',
    name: 'Standard',
    blurb: 'Signature client + jusqu’à 3 entreprises.',
    monthlyHint: 'Mensuel',
    yearlyHint: 'Annuel',
  },
  {
    id: 'pro',
    name: 'Pro',
    blurb: 'Entreprises et SIREN illimités.',
    monthlyHint: 'Mensuel',
    yearlyHint: 'Annuel',
  },
  {
    id: 'max',
    name: 'Max',
    blurb: 'Paiements Stripe, IA et statistiques avancées.',
    monthlyHint: 'Mensuel',
    yearlyHint: 'Annuel',
  },
];

export default function PremiumScreen() {
  const styles = useStyles();
  const { showError, showSuccess } = useToast();
  const { subscription, plan, isPremium, isLoading } = useSubscription();
  const { isConfigured, startCheckout, subscribe } = usePremiumCheckout();
  const [promotionCode, setPromotionCode] = useState('');
  const [interval, setInterval] = useState<BillingInterval>('monthly');
  const [pendingPlanId, setPendingPlanId] = useState<PaidPlanId | null>(null);

  usePremiumCheckoutReturn();

  async function handleSubscribe(planId: PaidPlanId) {
    if (!isConfigured) {
      showError('Le paiement n’est pas encore disponible. Réessayez plus tard.');
      return;
    }

    setPendingPlanId(planId);
    try {
      const completed = await startCheckout(planId, {
        interval,
        promotionCode: promotionCode.trim() || undefined,
      });
      if (completed) {
        showSuccess(`Offre ${getPlanDisplayName(planId)} activée.`);
      }
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Une erreur est survenue.');
    } finally {
      setPendingPlanId(null);
    }
  }

  if (isLoading) {
    return (
      <SettingsScreenFrame title="Abonnement">
        <LoadingView message="Chargement des offres…" />
      </SettingsScreenFrame>
    );
  }

  return (
    <SettingsScreenFrame title="Abonnement">
      <View style={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>Offres INVEQ</Text>
          <Text style={styles.heroTitle}>Micro, Basique, Standard, Pro, Max</Text>
          <Text style={styles.heroSubtitle}>
            Choisissez l’offre adaptée. Paiement sécurisé Stripe — codes promo acceptés.
          </Text>
        </View>

        {subscription ? (
          <View style={styles.statusCard}>
            <Text style={styles.statusLabel}>Votre abonnement</Text>
            <Text style={styles.statusValue}>
              {plan?.displayName ?? getPlanDisplayName(subscription.effectivePlanId)} ·{' '}
              {formatStatusLabel(subscription.status)}
            </Text>
            {subscription.currentPeriodEnd ? (
              <Text style={styles.statusMeta}>
                {subscription.cancelAtPeriodEnd
                  ? `Se termine le ${formatDate(subscription.currentPeriodEnd)}`
                  : `Renouvellement le ${formatDate(subscription.currentPeriodEnd)}`}
              </Text>
            ) : null}
          </View>
        ) : null}

        <View style={styles.intervalRow}>
          {(['monthly', 'yearly'] as const).map((value) => {
            const active = interval === value;
            return (
              <Pressable
                key={value}
                onPress={() => setInterval(value)}
                style={[styles.intervalChip, active && styles.intervalChipActive]}>
                <Text style={[styles.intervalLabel, active && styles.intervalLabelActive]}>
                  {value === 'monthly' ? 'Mensuel' : 'Annuel'}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <TextField
          autoCapitalize="characters"
          autoCorrect={false}
          label="Code promotionnel Stripe"
          onChangeText={setPromotionCode}
          placeholder="Optionnel — ou sur la page Checkout"
          value={promotionCode}
        />

        <View style={styles.section}>
          {PAID_PLANS.map((entry) => (
            <View key={entry.id} style={styles.planCard}>
              <Text style={styles.planName}>{entry.name}</Text>
              <Text style={styles.planBlurb}>{entry.blurb}</Text>
              <Button
                elevated={entry.id === 'pro'}
                loading={subscribe.isPending && pendingPlanId === entry.id}
                onPress={() => {
                  void handleSubscribe(entry.id);
                }}
                title={
                  isPremium && subscription?.effectivePlanId === entry.id
                    ? 'Offre actuelle'
                    : `Choisir ${entry.name} (${interval === 'monthly' ? entry.monthlyHint : entry.yearlyHint})`
                }
                variant={entry.id === 'pro' ? 'primary' : 'ghost'}
              />
            </View>
          ))}
        </View>

        {isPremium ? (
          <Button
            onPress={() => {
              void (async () => {
                try {
                  const url = await openBillingPortal();
                  await WebBrowser.openBrowserAsync(url);
                } catch (error) {
                  showError(error instanceof Error ? error.message : 'Portail indisponible.');
                }
              })();
            }}
            title="Gérer mon abonnement (Stripe)"
            variant="ghost"
          />
        ) : null}

        <Button onPress={() => router.back()} title="Retour" variant="ghost" />
        <Text style={styles.footnote}>
          Les montants sont lus depuis Stripe (HT). Ordre des offres : Micro → Basique → Standard →
          Pro → Max.
        </Text>
      </View>
    </SettingsScreenFrame>
  );
}

function formatStatusLabel(status: SubscriptionStatus): string {
  switch (status) {
    case 'active':
      return 'Actif';
    case 'trialing':
      return 'Essai';
    case 'past_due':
      return 'Paiement en retard';
    case 'canceled':
      return 'Résilié';
    case 'unpaid':
      return 'Impayé';
    case 'incomplete':
      return 'Incomplet';
    default:
      return status;
  }
}

function formatDate(value: string): string {
  try {
    return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(value));
  } catch {
    return value;
  }
}

function useStyles() {
  return useThemedStyles((colors) => ({
    content: {
      gap: spacing.lg,
      paddingBottom: spacing['3xl'],
    },
    hero: {
      gap: spacing.sm,
    },
    eyebrow: {
      ...typography.footnoteMedium,
      color: colors.primary,
      textTransform: 'uppercase' as const,
      letterSpacing: 0.6,
    },
    heroTitle: {
      ...typography.title2,
      color: colors.text,
    },
    heroSubtitle: {
      ...typography.subheadline,
      color: colors.textSecondary,
    },
    statusCard: {
      gap: spacing.xs,
      padding: spacing.md,
      borderRadius: radius.card,
      backgroundColor: colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    statusLabel: {
      ...typography.footnote,
      color: colors.textSecondary,
    },
    statusValue: {
      ...typography.bodyMedium,
      color: colors.text,
    },
    statusMeta: {
      ...typography.footnote,
      color: colors.textSecondary,
    },
    intervalRow: {
      flexDirection: 'row' as const,
      gap: spacing.sm,
    },
    intervalChip: {
      flex: 1,
      alignItems: 'center' as const,
      paddingVertical: spacing.sm,
      borderRadius: radius.button,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    intervalChipActive: {
      borderColor: colors.primary,
      backgroundColor: colors.primarySubtle,
    },
    intervalLabel: {
      ...typography.footnoteMedium,
      color: colors.textSecondary,
    },
    intervalLabelActive: {
      color: colors.primary,
    },
    section: {
      gap: spacing.md,
    },
    planCard: {
      gap: spacing.sm,
      padding: spacing.md,
      borderRadius: radius.card,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    planName: {
      ...typography.headline,
      color: colors.text,
    },
    planBlurb: {
      ...typography.footnote,
      color: colors.textSecondary,
    },
    footnote: {
      ...typography.caption1,
      color: colors.textSecondary,
      textAlign: 'center' as const,
    },
  }));
}
