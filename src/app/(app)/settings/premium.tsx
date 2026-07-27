import { useState } from 'react';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { SettingsScreenFrame } from '@/components/web/desktop/settings-screen-frame';
import { Button } from '@/components/ui/button';
import { LoadingView } from '@/components/ui/loading-view';
import { TextField } from '@/components/ui/text-field';
import { PREMIUM_MARKETING } from '@/constants/premium-marketing';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { useThemedStyles } from '@/hooks/use-colors';
import { usePremiumCheckout } from '@/hooks/use-premium-checkout';
import { usePremiumCheckoutReturn } from '@/hooks/use-premium-checkout-return';
import { useSubscription } from '@/hooks/use-subscription';
import { useToast } from '@/providers/toast-provider';
import type { SubscriptionStatus } from '@/types/subscription';

export default function PremiumScreen() {
  const styles = useStyles();
  const { showError, showSuccess } = useToast();
  const { subscription, isPremium, isLoading } = useSubscription();
  const { isConfigured, startCheckout, subscribe } = usePremiumCheckout();
  const [promotionCode, setPromotionCode] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  usePremiumCheckoutReturn();

  async function handleSubscribe() {
    if (isPremium) {
      showSuccess('Vous êtes déjà abonné à INVEQ Premium.');
      return;
    }

    if (!isConfigured) {
      showError('Le paiement n’est pas encore disponible. Réessayez plus tard.');
      return;
    }

    try {
      const completed = await startCheckout(promotionCode.trim() || undefined);
      if (completed) {
        showSuccess('INVEQ Premium est activé.');
      }
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Une erreur est survenue.');
    }
  }

  if (isLoading) {
    return (
      <SettingsScreenFrame title="Premium">
        <LoadingView message="Chargement de l’offre…" />
      </SettingsScreenFrame>
    );
  }

  return (
    <SettingsScreenFrame title="Premium">
      <View style={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>Offre Premium</Text>
          <Text style={styles.heroTitle}>{PREMIUM_MARKETING.title}</Text>
          <Text style={styles.heroSubtitle}>{PREMIUM_MARKETING.subtitle}</Text>
          <Text style={styles.heroPrice}>
            {PREMIUM_MARKETING.priceLabel}
            <Text style={styles.heroPeriod}>{PREMIUM_MARKETING.pricePeriod}</Text>
          </Text>
        </View>

        {subscription ? (
          <View style={styles.statusCard}>
            <Text style={styles.statusLabel}>Votre abonnement</Text>
            <Text style={styles.statusValue}>
              {isPremium ? 'INVEQ Premium' : 'INVEQ Gratuit'} · {formatStatusLabel(subscription.status)}
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

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Comparaison</Text>
          <View style={styles.compareCard}>
            <View style={styles.compareHeader}>
              <Text style={[styles.compareHeadCell, styles.compareFeatureCol]}>Fonctionnalité</Text>
              <Text style={styles.compareHeadCell}>Gratuit</Text>
              <Text style={[styles.compareHeadCell, styles.comparePremium]}>Premium</Text>
            </View>
            {PREMIUM_MARKETING.comparison.map((row) => (
              <View key={row.label} style={styles.compareRow}>
                <Text style={[styles.compareCell, styles.compareFeatureCol]}>{row.label}</Text>
                <Text style={styles.compareCell}>{row.free}</Text>
                <Text style={[styles.compareCell, styles.comparePremium]}>{row.premium}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Avantages Premium</Text>
          {PREMIUM_MARKETING.benefits.map((benefit) => (
            <View key={benefit} style={styles.benefitRow}>
              <Text style={styles.benefitBullet}>✓</Text>
              <Text style={styles.benefitText}>{benefit}</Text>
            </View>
          ))}
        </View>

        <View style={styles.guaranteeCard}>
          <Text style={styles.guaranteeTitle}>Garantie</Text>
          <Text style={styles.guaranteeText}>{PREMIUM_MARKETING.guarantee}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>FAQ</Text>
          {PREMIUM_MARKETING.faq.map((item, index) => {
            const open = openFaq === index;
            return (
              <View key={item.question} style={styles.faqItem}>
                <Text
                  onPress={() => setOpenFaq(open ? null : index)}
                  style={styles.faqQuestion}>
                  {open ? '−' : '+'} {item.question}
                </Text>
                {open ? <Text style={styles.faqAnswer}>{item.answer}</Text> : null}
              </View>
            );
          })}
        </View>

        <View style={styles.actions}>
          {isPremium ? (
            <Button onPress={() => router.back()} title="Vous êtes Premium" variant="ghost" />
          ) : (
            <>
              <TextField
                autoCapitalize="characters"
                autoCorrect={false}
                label="Code promotionnel"
                onChangeText={setPromotionCode}
                placeholder="Optionnel"
                value={promotionCode}
              />
              <Button
                elevated
                loading={subscribe.isPending}
                onPress={() => {
                  void handleSubscribe();
                }}
                title={`${PREMIUM_MARKETING.cta} — ${PREMIUM_MARKETING.priceLabel}/mois`}
              />
            </>
          )}
          <Text style={styles.footnote}>Paiement sécurisé par Stripe. Sans engagement.</Text>
        </View>
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

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function useStyles() {
  return useThemedStyles((colors) => ({
    content: { gap: spacing.xl },
    hero: { gap: spacing.sm },
    eyebrow: {
      ...typography.caption1,
      color: colors.primary,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      fontWeight: '700',
    },
    heroTitle: { ...typography.title1, color: colors.text },
    heroSubtitle: { ...typography.body, color: colors.textSecondary, lineHeight: 22 },
    heroPrice: { ...typography.title2, color: colors.primary, marginTop: spacing.xs },
    heroPeriod: { ...typography.body, color: colors.textSecondary, fontWeight: '400' },
    statusCard: {
      gap: spacing.xs,
      padding: spacing.md,
      borderRadius: radius.lg,
      backgroundColor: colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    statusLabel: {
      ...typography.caption1,
      color: colors.textSecondary,
      textTransform: 'uppercase',
    },
    statusValue: { ...typography.headline, color: colors.text },
    statusMeta: { ...typography.footnote, color: colors.textSecondary },
    section: { gap: spacing.md },
    sectionTitle: { ...typography.title3, color: colors.text },
    compareCard: {
      borderRadius: radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      overflow: 'hidden',
      backgroundColor: colors.surface,
    },
    compareHeader: {
      flexDirection: 'row',
      backgroundColor: colors.backgroundGrouped,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.sm,
    },
    compareRow: {
      flexDirection: 'row',
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.sm,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.separator,
    },
    compareHeadCell: {
      ...typography.caption1,
      color: colors.textSecondary,
      fontWeight: '700',
      flex: 1,
      textAlign: 'center',
    },
    compareCell: {
      ...typography.footnote,
      color: colors.text,
      flex: 1,
      textAlign: 'center',
    },
    compareFeatureCol: { flex: 1.4, textAlign: 'left' },
    comparePremium: { color: colors.primary, fontWeight: '700' },
    benefitRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
    benefitBullet: { ...typography.body, color: colors.primary, fontWeight: '700' },
    benefitText: { ...typography.body, color: colors.text, flex: 1, lineHeight: 22 },
    guaranteeCard: {
      gap: spacing.xs,
      padding: spacing.md,
      borderRadius: radius.lg,
      backgroundColor: colors.primarySubtle,
    },
    guaranteeTitle: { ...typography.headline, color: colors.primary },
    guaranteeText: { ...typography.subheadline, color: colors.text, lineHeight: 21 },
    faqItem: {
      gap: spacing.xs,
      paddingVertical: spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.separator,
    },
    faqQuestion: { ...typography.subheadlineMedium, color: colors.text },
    faqAnswer: { ...typography.footnote, color: colors.textSecondary, lineHeight: 20 },
    actions: { gap: spacing.sm, paddingBottom: spacing.xl },
    footnote: {
      ...typography.caption1,
      color: colors.textTertiary,
      textAlign: 'center',
    },
  }));
}
