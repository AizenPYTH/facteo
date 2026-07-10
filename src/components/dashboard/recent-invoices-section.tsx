import { StyleSheet, View } from 'react-native';

import { colors } from '@/constants/theme/colors';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import type { Invoice } from '@/types/dashboard';

import { EmptyInvoices } from './empty-invoices';
import { RecentInvoiceCard } from './recent-invoice-card';
import { SectionHeader } from './section-header';

type RecentInvoicesSectionProps = {
  invoices: Invoice[];
  onInvoicePress?: (invoice: Invoice) => void;
};

export function RecentInvoicesSection({ invoices, onInvoicePress }: RecentInvoicesSectionProps) {
  return (
    <View style={styles.section}>
      <SectionHeader title="Recent invoices" />
      {invoices.length === 0 ? (
        <EmptyInvoices />
      ) : (
        <View style={styles.list}>
          {invoices.map((invoice, index) => (
            <RecentInvoiceCard
              invoice={invoice}
              key={invoice.id}
              onPress={onInvoicePress ? () => onInvoicePress(invoice) : undefined}
              showSeparator={index < invoices.length - 1}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.md,
  },
  list: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
});
