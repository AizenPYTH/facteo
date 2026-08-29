import { router, type Href } from 'expo-router';
import { type ViewStyle } from 'react-native';

import { EmptyState } from '@/components/ui/empty-state';
import type { InvoiceStatusFilter } from '@/types/invoices-list';

export type EmptyInvoicesProps = {
  isSearching?: boolean;
  statusFilter?: InvoiceStatusFilter;
  showCreateAction?: boolean;
  style?: ViewStyle;
  testID?: string;
};

const STATUS_EMPTY: Partial<Record<InvoiceStatusFilter, { title: string; description: string }>> = {
  paid: {
    title: 'Aucune facture payée sur cette période',
    description: 'Changez le filtre ou créez une facture pour commencer.',
  },
  overdue: {
    title: 'Aucune facture en retard',
    description: 'Tout est à jour. Revenez au filtre « Toutes » pour voir le reste.',
  },
  sent: {
    title: 'Aucune facture envoyée',
    description: 'Les factures marquées comme envoyées apparaîtront ici.',
  },
  draft: {
    title: 'Aucun brouillon',
    description: 'Créez une facture pour la retrouver ici avant envoi.',
  },
  canceled: {
    title: 'Aucune facture annulée',
    description: 'Les factures annulées resteront visibles dans ce filtre.',
  },
  partially_paid: {
    title: 'Aucune facture partiellement payée',
    description: 'Les paiements partiels apparaîtront dans ce filtre.',
  },
};

export function EmptyInvoices({
  isSearching = false,
  statusFilter = 'all',
  showCreateAction = true,
  style,
  testID,
}: EmptyInvoicesProps) {
  const canCreate = showCreateAction && !isSearching && statusFilter === 'all';
  const statusCopy = statusFilter !== 'all' ? STATUS_EMPTY[statusFilter] : undefined;

  return (
    <EmptyState
      actionLabel={
        canCreate
          ? 'Créer une facture'
          : statusFilter !== 'all' && !isSearching
            ? 'Voir toutes les factures'
            : undefined
      }
      description={
        isSearching
          ? 'Essayez un autre numéro de facture.'
          : (statusCopy?.description ?? 'Créez votre première facture pour vos clients.')
      }
      fill
      icon={{
        ios: isSearching ? 'magnifyingglass' : 'doc.plaintext',
        android: isSearching ? 'search' : 'receipt_long',
        web: isSearching ? 'search' : 'receipt_long',
      }}
      onAction={
        canCreate
          ? () => router.push('/invoices/new' as Href)
          : statusFilter !== 'all' && !isSearching
            ? () => router.replace('/invoices' as Href)
            : undefined
      }
      style={style}
      testID={testID}
      title={
        isSearching
          ? 'Aucun résultat pour cette recherche'
          : (statusCopy?.title ?? 'Aucune facture')
      }
    />
  );
}
