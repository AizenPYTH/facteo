import { StyleSheet, Text, View } from 'react-native';

import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { formatCurrency } from '@/lib/format/currency';
import type { TopPrestation } from '@/types/dashboard';

import { SectionHeader } from './section-header';

type TopPrestationsSectionProps = {
  prestations: TopPrestation[];
  premiumLocked?: boolean;
};

export function TopPrestationsSection({ prestations, premiumLocked = false }: TopPrestationsSectionProps) {
  const styles = useStyles();
  const colors = useColors();
  return (
    <View style={styles.section}>
      <SectionHeader premiumLocked={premiumLocked} title="Prestations les plus facturées" />
      <View style={[styles.card, premiumLocked ? styles.cardLocked : null]}>
        {prestations.length === 0 ? (
          <Text style={styles.empty}>Aucune prestation facturée.</Text>
        ) : (
          prestations.map((prestation, index) => (
            <View key={`${prestation.name}-${index}`}>
              <View style={styles.row}>
                <View style={styles.leading}>
                  <Text style={styles.rank}>{index + 1}</Text>
                  <Text numberOfLines={2} style={styles.name}>
                    {prestation.name}
                  </Text>
                </View>
                <Text style={styles.amount}>{formatCurrency(prestation.revenue)}</Text>
              </View>
              {index < prestations.length - 1 ? <View style={styles.separator} /> : null}
            </View>
          ))
        )}
      </View>
    </View>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
  section: {
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  cardLocked: {
    opacity: 0.88,
  },
  empty: {
    ...typography.subheadline,
    color: colors.textSecondary,
    padding: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  leading: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  rank: {
    ...typography.footnoteMedium,
    color: colors.textSecondary,
    width: 18,
    textAlign: 'center',
    marginTop: 2,
  },
  name: {
    ...typography.bodyMedium,
    color: colors.text,
    flex: 1,
  },
  amount: {
    ...typography.bodySemibold,
    color: colors.text,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.separator,
    marginLeft: spacing.md,
  },
}));
}
