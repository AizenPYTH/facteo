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
import type { Invoice } from '@/types/invoice';

import { InvoiceStatusBadge } from './invoice-status-badge';

export type InvoiceCardProps = {
  invoice: Invoice;
  onPress?: (invoice: Invoice) => void;
  onShare?: (invoice: Invoice) => void;
  onMarkPaid?: (invoice: Invoice) => void;
  onRemind?: (invoice: Invoice) => void;
  selected?: boolean;
  style?: ViewStyle;
  testID?: string;
};

/**
 * Ligne facture — DESIGN §3.4 (liste Documents).
 */
export function InvoiceCard({
  invoice,
  onPress,
  onShare,
  onMarkPaid,
  onRemind,
  selected = false,
  style,
  testID,
}: InvoiceCardProps) {
  const styles = useStyles();
  const colors = useColors();
  const displayDate = formatDate(invoice.issuedAt ?? invoice.createdAt);
  const meta = [invoice.clientName, displayDate].filter(Boolean).join(' · ');
  const isOverdue = invoice.status === 'overdue';

  const row = (
    <View style={[styles.wrapper, selected && styles.selected, style]} testID={testID}>
      <ListRow
        accessibilityLabel={`Facture ${invoice.number}, ${formatSpokenEuros(invoice.totalTtc)}`}
        leading={
          <View style={styles.iconWrap}>
            <SymbolView
              name={{ ios: 'doc.text.fill', android: 'description', web: 'description' }}
              size={18}
              tintColor={colors.iconSecondary}
              type="hierarchical"
            />
          </View>
        }
        meta={meta}
        onPress={onPress ? () => onPress(invoice) : undefined}
        overdue={isOverdue}
        showChevron
        title={invoice.number}
        trailing={<InvoiceStatusBadge status={invoice.status} />}
        value={formatPriceHT(invoice.totalTtc)}
        valueAccessibilityLabel={formatSpokenEuros(invoice.totalTtc)}
      />
    </View>
  );

  const canSwipe =
    Boolean(onShare) ||
    (Boolean(onMarkPaid) && invoice.status !== 'paid' && invoice.status !== 'draft') ||
    (Boolean(onRemind) && (invoice.status === 'sent' || invoice.status === 'overdue'));

  if (!canSwipe) {
    return row;
  }

  return (
    <Swipeable
      friction={2}
      overshootRight={false}
      renderRightActions={() => (
        <View style={styles.actions}>
          {onRemind && (invoice.status === 'sent' || invoice.status === 'overdue') ? (
            <RectButton
              onPress={() => onRemind(invoice)}
              style={[styles.action, styles.actionRemind]}>
              <Text style={styles.actionLabel}>Relancer</Text>
            </RectButton>
          ) : null}
          {onMarkPaid && invoice.status !== 'paid' && invoice.status !== 'draft' ? (
            <RectButton
              onPress={() => onMarkPaid(invoice)}
              style={[styles.action, styles.actionPaid]}>
              <Text style={styles.actionLabel}>Payée</Text>
            </RectButton>
          ) : null}
          {onShare ? (
            <RectButton onPress={() => onShare(invoice)} style={[styles.action, styles.actionShare]}>
              <Text style={styles.actionLabel}>Partager</Text>
            </RectButton>
          ) : null}
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
    actionRemind: {
      backgroundColor: colors.statusPending,
    },
    actionPaid: {
      backgroundColor: colors.statusPaid,
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
