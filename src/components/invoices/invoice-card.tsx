import type { ViewStyle } from 'react-native';

import { DocumentListCard } from '@/components/ui/document-list-card';
import { formatDate } from '@/lib/format/date';
import { formatPriceHT } from '@/lib/format/currency';
import type { Invoice } from '@/types/invoice';

import { InvoiceStatusBadge } from './invoice-status-badge';

export type InvoiceCardProps = {
  invoice: Invoice;
  onPress?: (invoice: Invoice) => void;
  onLongPress?: (invoice: Invoice) => void;
  selected?: boolean;
  selectionMode?: boolean;
  index?: number;
  style?: ViewStyle;
  testID?: string;
};

export function InvoiceCard({
  invoice,
  onPress,
  onLongPress,
  selected = false,
  selectionMode = false,
  index = 0,
  style,
  testID,
}: InvoiceCardProps) {
  const displayDate = formatDate(invoice.issuedAt ?? invoice.createdAt);
  const dueLabel = invoice.dueAt ? `Éch. ${formatDate(invoice.dueAt)}` : null;

  return (
    <DocumentListCard
      accessibilityLabel={`Facture ${invoice.number}, ${invoice.clientName}, ${formatPriceHT(invoice.totalTtc)}`}
      amountLabel={formatPriceHT(invoice.totalTtc)}
      clientName={invoice.clientName || 'Client'}
      dateLabel={displayDate}
      index={index}
      metaLabel={dueLabel}
      number={invoice.number}
      onLongPress={onLongPress ? () => onLongPress(invoice) : undefined}
      onPress={onPress ? () => onPress(invoice) : undefined}
      selected={selected}
      selectionMode={selectionMode}
      status={<InvoiceStatusBadge status={invoice.status} />}
      style={style}
      testID={testID}
    />
  );
}
