import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { PressableScale } from '@/components/ui/pressable-scale';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import type { DocumentTotals } from '@/lib/calculations/totals';
import { formatPriceHT } from '@/lib/format/currency';

export type DocumentTotalsBarProps = {
  totals: DocumentTotals;
  /** Nombre de lignes, affiché en légende. */
  lineCount: number;
};

/**
 * Récapitulatif collé au-dessus des actions du composer.
 *
 * Le total n'apparaissait qu'à la dernière étape : on saisissait des lignes
 * sans jamais voir où en était le document. Il est désormais visible en
 * permanence, y compris clavier ouvert, et se déplie sur le détail HT / remise
 * / TVA d'un seul appui.
 */
export function DocumentTotalsBar({ totals, lineCount }: DocumentTotalsBarProps) {
  const styles = useStyles();
  const colors = useColors();
  const [expanded, setExpanded] = useState(false);

  const lineLabel = lineCount > 1 ? `${lineCount} prestations` : `${lineCount} prestation`;

  return (
    <View style={styles.container}>
      <PressableScale
        accessibilityHint={expanded ? 'Masque le détail' : 'Affiche le détail HT, remise et TVA'}
        accessibilityLabel={`Total TTC ${formatPriceHT(totals.totalTtc)}`}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        intensity="subtle"
        onPress={() => setExpanded((current) => !current)}
        style={styles.summaryRow}>
        <View style={styles.summaryText}>
          <Text maxFontSizeMultiplier={1.3} style={styles.caption}>
            {lineLabel}
          </Text>
          <Text maxFontSizeMultiplier={1.3} style={styles.label}>
            Total TTC
          </Text>
        </View>

        <Text
          adjustsFontSizeToFit
          maxFontSizeMultiplier={1.3}
          numberOfLines={1}
          style={styles.total}>
          {formatPriceHT(totals.totalTtc)}
        </Text>

        <SymbolView
          name={
            expanded
              ? { ios: 'chevron.down', android: 'expand_more', web: 'expand_more' }
              : { ios: 'chevron.up', android: 'expand_less', web: 'expand_less' }
          }
          size={13}
          tintColor={colors.iconTertiary}
          type="hierarchical"
        />
      </PressableScale>

      {expanded ? (
        <View style={styles.detail}>
          <DetailRow label="Total HT" value={formatPriceHT(totals.subtotalHt)} />
          {totals.totalDiscount > 0 ? (
            <DetailRow
              label="Remises"
              tone={colors.success}
              value={`− ${formatPriceHT(totals.totalDiscount)}`}
            />
          ) : null}
          <DetailRow label="TVA" value={formatPriceHT(totals.totalVat)} />
        </View>
      ) : null}
    </View>
  );
}

function DetailRow({ label, value, tone }: { label: string; value: string; tone?: string }) {
  const styles = useStyles();

  return (
    <View style={styles.detailRow}>
      <Text maxFontSizeMultiplier={1.3} style={styles.detailLabel}>
        {label}
      </Text>
      <Text maxFontSizeMultiplier={1.3} style={[styles.detailValue, tone ? { color: tone } : null]}>
        {value}
      </Text>
    </View>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
    container: {
      backgroundColor: colors.surface,
      borderRadius: radius.card,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing[2],
      marginBottom: spacing[2],
    },
    summaryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing[2],
      minHeight: 44,
    },
    summaryText: {
      flex: 1,
      minWidth: 0,
    },
    caption: {
      ...typography.caption2,
      color: colors.textSecondary,
    },
    label: {
      ...typography.footnoteMedium,
      color: colors.textSecondary,
    },
    total: {
      ...typography.title3,
      color: colors.text,
      flexShrink: 1,
    },
    detail: {
      gap: spacing[1],
      paddingTop: spacing[2],
      paddingBottom: spacing[1],
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    detailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.md,
    },
    detailLabel: {
      ...typography.footnote,
      color: colors.textSecondary,
    },
    detailValue: {
      ...typography.footnoteMedium,
      color: colors.text,
    },
  }));
}
