import { SymbolView } from 'expo-symbols';
import { Text, View, type ViewStyle } from 'react-native';
import { RectButton, Swipeable } from 'react-native-gesture-handler';

import { ListRow } from '@/components/ui/list-row';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { components } from '@/constants/theme/design-system';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { formatDate } from '@/lib/format/date';
import { formatPriceHT, formatSpokenEuros } from '@/lib/format/currency';
import type { Quote } from '@/types/quote';

import { QuoteStatusBadge } from './quote-status-badge';

export type QuoteCardProps = {
  quote: Quote;
  onPress?: (quote: Quote) => void;
  onShare?: (quote: Quote) => void;
  selected?: boolean;
  style?: ViewStyle;
  testID?: string;
};

/**
 * Ligne devis — DESIGN §3.4 (liste Documents).
 */
export function QuoteCard({
  quote,
  onPress,
  onShare,
  selected = false,
  style,
  testID,
}: QuoteCardProps) {
  const styles = useStyles();
  const colors = useColors();
  const displayDate = formatDate(quote.issuedAt ?? quote.createdAt);
  const meta = [quote.clientName, displayDate].filter(Boolean).join(' · ');
  const isExpired = quote.status === 'expired';

  const row = (
    <View style={[styles.wrapper, selected && styles.selected, style]} testID={testID}>
      <ListRow
        accessibilityLabel={`Devis ${quote.number}, ${formatSpokenEuros(quote.totalTtc)}`}
        leading={
          <View style={styles.iconWrap}>
            <SymbolView
              name={{ ios: 'doc.plaintext', android: 'article', web: 'article' }}
              size={18}
              tintColor={colors.iconSecondary}
              type="hierarchical"
            />
          </View>
        }
        meta={meta}
        onPress={onPress ? () => onPress(quote) : undefined}
        overdue={isExpired}
        showChevron
        title={quote.number}
        trailing={<QuoteStatusBadge status={quote.status} />}
        value={formatPriceHT(quote.totalTtc)}
        valueAccessibilityLabel={formatSpokenEuros(quote.totalTtc)}
      />
    </View>
  );

  if (!onShare) {
    return row;
  }

  return (
    <Swipeable
      friction={2}
      overshootRight={false}
      renderRightActions={() => (
        <View style={styles.actions}>
          <RectButton onPress={() => onShare(quote)} style={[styles.action, styles.actionShare]}>
            <Text style={styles.actionLabel}>Partager</Text>
          </RectButton>
        </View>
      )}>
      {row}
    </Swipeable>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
    wrapper: {
      backgroundColor: colors.surface,
    },
    selected: {
      backgroundColor: colors.primarySubtle,
    },
    iconWrap: {
      width: components.listRowIconSize,
      height: components.listRowIconSize,
      borderRadius: radius.sm,
      backgroundColor: colors.surfaceSecondary,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    actions: {
      flexDirection: 'row' as const,
      alignItems: 'stretch' as const,
    },
    action: {
      width: 80,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      paddingHorizontal: spacing.sm,
    },
    actionShare: {
      backgroundColor: colors.primary,
    },
    actionLabel: {
      ...typography.caption2,
      color: colors.onPrimary,
      textAlign: 'center' as const,
    },
  }));
}
