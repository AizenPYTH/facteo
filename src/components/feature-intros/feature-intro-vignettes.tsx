import { Text, View } from 'react-native';

import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { useIsLargeContentSize } from '@/hooks/use-is-large-content-size';
import type {
  FeatureIntroId,
  FeatureIntroStep,
} from '@/lib/feature-intros/types';

type Vignette = {
  eyebrow: string;
  value: string;
  badge: string;
};

const vignettes: Record<FeatureIntroId, readonly [Vignette, Vignette, Vignette]> = {
  invoice: [
    { eyebrow: 'Client', value: 'Atelier Nord', badge: 'Choisi' },
    { eyebrow: 'Prestations', value: '2 lignes', badge: '920 € HT' },
    { eyebrow: 'Total TTC', value: '1 104 €', badge: 'Prête' },
  ],
  quote: [
    { eyebrow: 'Client', value: 'Maison Verte', badge: 'Devis' },
    { eyebrow: 'Proposition', value: '1 650 €', badge: 'À valider' },
    { eyebrow: 'Conversion', value: 'Facture', badge: 'Brouillon' },
  ],
  scanner: [
    { eyebrow: 'Code produit', value: '8806092', badge: 'Scanné' },
    { eyebrow: 'Vérification', value: '249,99 €', badge: 'TVA 20 %' },
    { eyebrow: 'Document', value: '1 ligne', badge: 'Ajoutée' },
  ],
  ai: [
    { eyebrow: 'Source', value: 'Photo produit', badge: 'À analyser' },
    { eyebrow: 'Extraction', value: '3 champs', badge: 'Proposés' },
    { eyebrow: 'Décision', value: 'Vérifier', badge: 'Vous décidez' },
  ],
  templates: [
    { eyebrow: 'Galerie', value: 'Modèle A', badge: 'Choisir' },
    { eyebrow: 'Sélection', value: 'Modèle B', badge: 'Sélectionné' },
    { eyebrow: 'Aperçu PDF', value: 'Modèle B', badge: 'Prêt' },
  ],
  payments: [
    { eyebrow: 'Facture', value: '#1042', badge: 'Émise' },
    { eyebrow: 'Paiement', value: '1 104 €', badge: 'Enregistré' },
    { eyebrow: 'Statut', value: 'Payée', badge: 'À jour' },
  ],
  statistics: [
    { eyebrow: 'Documents', value: '38 factures', badge: 'Données' },
    { eyebrow: 'Chiffre d’affaires', value: '24,8 k€', badge: 'Graphique' },
    { eyebrow: 'Tendance', value: '+ 12 %', badge: 'À piloter' },
  ],
};

type FeatureIntroVignettesProps = {
  featureId: FeatureIntroId;
  steps: FeatureIntroStep[];
  activeStepIndex?: number;
  prominent?: boolean;
};

/**
 * Three permanently visible, non-animated mini interfaces. They preserve the
 * complete story when the animated scene is skipped for Reduce Motion.
 */
export function FeatureIntroVignettes({
  featureId,
  steps,
  activeStepIndex,
  prominent = false,
}: FeatureIntroVignettesProps) {
  const styles = useStyles();
  const colors = useColors();
  const isLargeContentSize = useIsLargeContentSize();
  const stacked = prominent || isLargeContentSize;
  const featureVignettes = vignettes[featureId];

  return (
    <View style={[styles.row, stacked && styles.column]}>
      {featureVignettes.map((vignette, index) => {
        const step = steps[index];
        const isActive = activeStepIndex === index;

        return (
          <View
            accessibilityLabel={
              step ? `${step.headline}. ${step.body}` : undefined
            }
            accessible
            key={`${featureId}-${vignette.eyebrow}`}
            style={[
              styles.card,
              stacked && styles.cardStacked,
              isActive && { borderColor: colors.primary },
            ]}>
            <View style={styles.preview}>
              <Text style={styles.eyebrow}>{vignette.eyebrow}</Text>
              <View style={styles.rule} />
              <Text style={styles.value}>{vignette.value}</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{vignette.badge}</Text>
              </View>
            </View>
            {step ? <Text style={styles.stepLabel}>{step.headline}</Text> : null}
          </View>
        );
      })}
    </View>
  );
}

const useStyles = () =>
  useThemedStyles((colors) => ({
    row: {
      flexDirection: 'row' as const,
      alignItems: 'stretch' as const,
      gap: spacing.xs,
    },
    column: {
      flexDirection: 'column' as const,
      gap: spacing.sm,
    },
    card: {
      flex: 1,
      minWidth: 0,
      gap: spacing.xs,
      padding: spacing.xs,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.backgroundGrouped,
    },
    cardStacked: {
      flex: 0,
      width: '100%' as const,
      padding: spacing.sm,
    },
    preview: {
      gap: spacing.xs,
      padding: spacing.xs,
      borderRadius: radius.sm,
      backgroundColor: colors.surface,
    },
    eyebrow: {
      ...typography.caption2,
      color: colors.textTertiary,
      textTransform: 'uppercase' as const,
      letterSpacing: 0.4,
    },
    rule: {
      width: spacing.xl,
      height: spacing.xs,
      borderRadius: radius.full,
      backgroundColor: colors.primary,
    },
    value: {
      ...typography.footnoteMedium,
      color: colors.text,
      fontVariant: ['tabular-nums'] as const,
    },
    badge: {
      alignSelf: 'flex-start' as const,
      paddingHorizontal: spacing.xs,
      paddingVertical: spacing.xs,
      borderRadius: radius.chip,
      backgroundColor: colors.primarySubtle,
    },
    badgeText: {
      ...typography.caption2,
      color: colors.primary,
    },
    stepLabel: {
      ...typography.caption2,
      color: colors.textSecondary,
    },
  }));
