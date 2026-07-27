import { DocumentListCard } from '@/components/ui/document-list-card';
import { formatDate } from '@/lib/format/date';
import { formatPriceHT } from '@/lib/format/currency';
import type { Quote } from '@/types/quote';
import type { ViewStyle } from 'react-native';

import { QuoteStatusBadge } from './quote-status-badge';

export type QuoteCardProps = {
  quote: Quote;
  onPress?: (quote: Quote) => void;
  index?: number;
  style?: ViewStyle;
  testID?: string;
};

export function QuoteCard({ quote, onPress, index = 0, style, testID }: QuoteCardProps) {
  const displayDate = formatDate(quote.issuedAt ?? quote.createdAt);

  return (
    <DocumentListCard
      accessibilityLabel={`Devis ${quote.number}, ${quote.clientName}, ${formatPriceHT(quote.totalTtc)}`}
      amountLabel={formatPriceHT(quote.totalTtc)}
      clientName={quote.clientName || 'Client'}
      dateLabel={displayDate}
      index={index}
      number={quote.number}
      onPress={onPress ? () => onPress(quote) : undefined}
      status={<QuoteStatusBadge status={quote.status} />}
      style={style}
      testID={testID}
    />
  );
}
