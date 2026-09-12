import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useThemedStyles } from '@/hooks/use-colors';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { formatMoney } from '@/lib/integrations/money';
import {
  describeFulfillmentStatus,
  describePaymentStatus,
  type ExternalOrder,
} from '@/types/integrations';

function formatDate(value: string | null): string {
  if (!value) return '—';
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? new Date(timestamp).toLocaleDateString('fr-FR') : '—';
}

function buyerLabel(order: ExternalOrder): string {
  return (
    order.buyer.companyName ??
    order.buyer.fullName ??
    order.buyerUsername ??
    'Acheteur non communiqué par eBay'
  );
}

export function EbayOrderCard({
  order,
  onPress,
}: {
  order: ExternalOrder;
  onPress: () => void;
}) {
  const styles = useStyles();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.headerRow}>
        <Text numberOfLines={1} style={styles.buyer}>
          {buyerLabel(order)}
        </Text>
        <Text style={styles.total}>{formatMoney(order.totalAmount, order.currency)}</Text>
      </View>

      <Text numberOfLines={1} style={styles.reference}>
        Commande {order.externalOrderId} · {formatDate(order.orderCreatedAt)}
      </Text>

      <View style={styles.badges}>
        <Text style={styles.badge}>{describePaymentStatus(order.paymentStatus)}</Text>
        <Text style={styles.badge}>{describeFulfillmentStatus(order.fulfillmentStatus)}</Text>
        {order.environment === 'sandbox' ? <Text style={styles.badge}>Sandbox</Text> : null}
      </View>

      <Text style={order.invoiceId ? styles.invoiced : styles.pending}>
        {order.invoiceId ? 'Facture créée' : 'Pas encore facturée'}
        {order.collectAndRemit ? ' · TVA collectée par eBay' : ''}
      </Text>
    </Pressable>
  );
}

function useStyles() {
  return useThemedStyles((colors) =>
    StyleSheet.create({
      card: {
        backgroundColor: colors.surface,
        borderRadius: radius.card,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.border,
        padding: spacing.md,
        gap: 6,
      },
      pressed: {
        opacity: 0.7,
      },
      headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        gap: spacing.sm,
      },
      buyer: {
        ...typography.bodySemibold,
        color: colors.text,
        flexShrink: 1,
      },
      total: {
        ...typography.bodySemibold,
        color: colors.text,
      },
      reference: {
        ...typography.footnote,
        color: colors.textSecondary,
      },
      badges: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.xs,
        marginTop: 2,
      },
      badge: {
        ...typography.footnote,
        color: colors.textSecondary,
        backgroundColor: colors.surfaceSecondary,
        borderRadius: radius.badge,
        paddingHorizontal: spacing.sm,
        paddingVertical: 3,
        overflow: 'hidden',
      },
      invoiced: {
        ...typography.footnoteMedium,
        color: colors.success,
      },
      pending: {
        ...typography.footnoteMedium,
        color: colors.textSecondary,
      },
    }),
  );
}
