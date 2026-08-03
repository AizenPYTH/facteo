import { Pressable, View, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { radius } from '@/constants/theme/radius';
import { shadows } from '@/constants/theme/theme';
import { spacing } from '@/constants/theme/spacing';
import { useThemedStyles } from '@/hooks/use-colors';
import { formatDate } from '@/lib/format/date';
import { formatPriceHT } from '@/lib/format/currency';
import { springs } from '@/lib/motion/springs';
import type { Quote } from '@/types/quote';

import { QuoteField } from './quote-field';
import { QuoteStatusBadge } from './quote-status-badge';

export type QuoteCardProps = {
  quote: Quote;
  onPress?: (quote: Quote) => void;
  style?: ViewStyle;
  testID?: string;
};

export function QuoteCard({ quote, onPress, style, testID }: QuoteCardProps) {
  const styles = useStyles();
  const scale = useSharedValue(1);
  const pressStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const displayDate = formatDate(quote.issuedAt ?? quote.createdAt);

  const content = (
    <View style={[styles.card, style]}>
      <View style={styles.header}>
        <QuoteField emphasize label="Numéro" value={quote.number} />
        <QuoteStatusBadge status={quote.status} />
      </View>

      <View style={styles.row}>
        <QuoteField label="Client" value={quote.clientName} />
        <QuoteField label="Date" value={displayDate} />
      </View>

      <View style={styles.row}>
        <QuoteField label="Montant TTC" value={formatPriceHT(quote.totalTtc)} />
      </View>
    </View>
  );

  if (!onPress) {
    return <View testID={testID}>{content}</View>;
  }

  return (
    <Animated.View style={pressStyle}>
      <Pressable
        accessibilityLabel={`Devis ${quote.number}`}
        accessibilityRole="button"
        onPress={() => onPress(quote)}
        onPressIn={() => {
          // eslint-disable-next-line react-hooks/immutability -- Reanimated SharedValue mutation is safe here.
          scale.value = withSpring(0.98, springs.snappy);
        }}
        onPressOut={() => {
          // eslint-disable-next-line react-hooks/immutability
          scale.value = withSpring(1, springs.snappy);
        }}
        testID={testID}>
        {content}
      </Pressable>
    </Animated.View>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.md,
    ...shadows.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
}));
}
