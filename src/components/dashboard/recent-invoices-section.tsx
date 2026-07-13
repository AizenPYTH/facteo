import { StyleSheet, View } from 'react-native';

import { useColors, useThemedStyles } from '@/hooks/use-colors';
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
  const styles = useStyles();
  const colors = useColors();
  return (
    <View style={styles.section}>
      <SectionHeader title="Factures récentes" />
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

function useStyles() {
  return useThemedStyles((colors) => ({
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
}));
}
