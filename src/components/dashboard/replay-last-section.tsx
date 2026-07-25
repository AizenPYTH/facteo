import { router } from 'expo-router';
import { View } from 'react-native';

import { CommeLaDerniereFoisCard } from '@/components/documents/comme-la-derniere-fois-card';
import { spacing } from '@/constants/theme/spacing';
import { useThemedStyles } from '@/hooks/use-colors';
import { newInvoiceHref } from '@/lib/navigation/new-document';
import type { Invoice } from '@/types/dashboard';

import { SectionHeader } from './section-header';

type ReplayLastSectionProps = {
  invoices: Invoice[];
  /** Hide section title when embedded in a panel that already has one. */
  hideTitle?: boolean;
};

/**
 * Accueil signature — one tap to re-invoice a recent client.
 * Dedupes by client, keeps the most recent invoice per client.
 */
export function ReplayLastSection({ invoices, hideTitle = false }: ReplayLastSectionProps) {
  const styles = useStyles();
  const opportunities = pickReplayOpportunities(invoices);

  if (opportunities.length === 0) {
    return null;
  }

  return (
    <View style={styles.section}>
      {hideTitle ? null : <SectionHeader title="Comme la dernière fois" />}
      <View style={styles.list}>
        {opportunities.map((invoice) => (
          <CommeLaDerniereFoisCard
            key={invoice.clientId}
            onPress={() =>
              router.push(newInvoiceHref(invoice.clientId, { replay: true }))
            }
            subtitle={`${invoice.clientName} · ${invoice.number}`}
          />
        ))}
      </View>
    </View>
  );
}

function pickReplayOpportunities(invoices: Invoice[]): Array<
  Invoice & { clientId: string }
> {
  const seen = new Set<string>();
  const result: Array<Invoice & { clientId: string }> = [];

  for (const invoice of invoices) {
    if (!invoice.clientId || seen.has(invoice.clientId)) {
      continue;
    }
    seen.add(invoice.clientId);
    result.push({ ...invoice, clientId: invoice.clientId });
    if (result.length >= 3) {
      break;
    }
  }

  return result;
}

function useStyles() {
  return useThemedStyles(() => ({
    section: {
      gap: spacing.md,
    },
    list: {
      gap: spacing.sm,
    },
  }));
}
