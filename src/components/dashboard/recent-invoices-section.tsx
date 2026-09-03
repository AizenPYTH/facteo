import { router, type Href } from 'expo-router';
import { View } from 'react-native';

import { Card } from '@/components/ui/card';
import { ListRowSeparator } from '@/components/ui/list-row';
import { spacing } from '@/constants/theme/spacing';
import { useThemedStyles } from '@/hooks/use-colors';
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
  const hasInvoices = invoices.length > 0;

  return (
    <View style={styles.section}>
      <SectionHeader
        actionLabel={hasInvoices ? 'Tout voir' : undefined}
        onAction={hasInvoices ? () => router.push('/invoices' as Href) : undefined}
        title="Factures récentes"
      />

      {hasInvoices ? (
        <Card flush variant="surface">
          {invoices.map((invoice, index) => (
            <View key={invoice.id}>
              {index > 0 ? <ListRowSeparator /> : null}
              <RecentInvoiceCard
                invoice={invoice}
                onPress={onInvoicePress ? () => onInvoicePress(invoice) : undefined}
              />
            </View>
          ))}
        </Card>
      ) : (
        <EmptyInvoices />
      )}
    </View>
  );
}

function useStyles() {
  return useThemedStyles(() => ({
    section: {
      gap: spacing.md,
    },
  }));
}
