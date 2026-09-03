import { Text, View, type ViewStyle } from 'react-native';

import { Badge } from '@/components/ui/badge';
import { PressableScale } from '@/components/ui/pressable-scale';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { quoteStatusTone } from '@/lib/documents/status-tone';
import { formatPriceHT } from '@/lib/format/currency';
import { formatDate } from '@/lib/format/date';
import { QUOTE_STATUS_LABELS, type Quote } from '@/types/quote';

export type QuoteCardProps = {
  quote: Quote;
  onPress?: (quote: Quote) => void;
  style?: ViewStyle;
  testID?: string;
};

/** Vrai quand la validité est dépassée mais que le statut ne le dit pas encore. */
function isExpiringSoon(quote: Quote): boolean {
  if (!quote.validUntil || quote.status !== 'sent') {
    return false;
  }
  return new Date(quote.validUntil).getTime() < Date.now();
}

/**
 * Ligne de la liste des devis — même grammaire que `InvoiceCard` : numéro et
 * montant portent la lecture, le statut qualifie, la validité n'apparaît que
 * lorsqu'elle informe.
 */
export function QuoteCard({ quote, onPress, style, testID }: QuoteCardProps) {
  const styles = useStyles();
  const colors = useColors();

  const displayDate = formatDate(quote.issuedAt ?? quote.createdAt);
  const expired = isExpiringSoon(quote);
  const validityLabel = quote.validUntil
    ? `${expired ? 'Expiré le' : 'Valable jusqu’au'} ${formatDate(quote.validUntil)}`
    : null;

  const content = (
    <View style={[styles.row, style]}>
      <View style={styles.leading}>
        <View style={styles.titleRow}>
          <Text maxFontSizeMultiplier={1.4} numberOfLines={1} style={styles.number}>
            {quote.number}
          </Text>
          <Badge
            label={QUOTE_STATUS_LABELS[quote.status]}
            size="sm"
            tone={quoteStatusTone[quote.status]}
          />
        </View>

        <Text maxFontSizeMultiplier={1.4} numberOfLines={1} style={styles.client}>
          {quote.clientName}
        </Text>

        <Text maxFontSizeMultiplier={1.4} numberOfLines={1} style={styles.meta}>
          {displayDate}
        </Text>
      </View>

      <View style={styles.trailing}>
        <Text
          adjustsFontSizeToFit
          maxFontSizeMultiplier={1.3}
          numberOfLines={1}
          style={styles.amount}>
          {formatPriceHT(quote.totalTtc)}
        </Text>
        {validityLabel ? (
          <Text
            maxFontSizeMultiplier={1.3}
            numberOfLines={1}
            style={[styles.validity, expired && { color: colors.warning }]}>
            {validityLabel}
          </Text>
        ) : null}
      </View>
    </View>
  );

  if (!onPress) {
    return (
      <View style={styles.wrapper} testID={testID}>
        {content}
      </View>
    );
  }

  return (
    <PressableScale
      accessibilityHint="Ouvre le devis"
      accessibilityLabel={`Devis ${quote.number}, ${quote.clientName}, ${formatPriceHT(quote.totalTtc)}, ${QUOTE_STATUS_LABELS[quote.status]}`}
      accessibilityRole="button"
      intensity="subtle"
      onPress={() => onPress(quote)}
      style={styles.wrapper}
      testID={testID}>
      {content}
    </PressableScale>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
    wrapper: {
      backgroundColor: colors.surface,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing[3],
      minHeight: 72,
    },
    leading: {
      flex: 1,
      minWidth: 0,
      gap: spacing[0.5],
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing[2],
    },
    number: {
      ...typography.bodySemibold,
      color: colors.text,
      flexShrink: 1,
    },
    client: {
      ...typography.subheadline,
      color: colors.textSecondary,
    },
    meta: {
      ...typography.caption1,
      color: colors.textSecondary,
    },
    trailing: {
      alignItems: 'flex-end',
      gap: spacing[0.5],
      maxWidth: '46%',
    },
    amount: {
      ...typography.bodySemibold,
      color: colors.text,
    },
    validity: {
      ...typography.caption1,
      color: colors.textSecondary,
      textAlign: 'right',
    },
  }));
}
