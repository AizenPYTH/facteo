import { router, type Href } from 'expo-router';
import { type ViewStyle } from 'react-native';

import { EmptyState } from '@/components/ui/empty-state';
import type { QuoteStatusFilter } from '@/types/quotes-list';

export type EmptyQuotesProps = {
  isSearching?: boolean;
  statusFilter?: QuoteStatusFilter;
  style?: ViewStyle;
  testID?: string;
};

const STATUS_EMPTY: Partial<Record<QuoteStatusFilter, { title: string; description: string }>> = {
  accepted: {
    title: 'Aucun devis accepté',
    description: 'Les devis acceptés par vos clients apparaîtront ici.',
  },
  rejected: {
    title: 'Aucun devis refusé',
    description: 'Les devis refusés restent visibles dans ce filtre.',
  },
  sent: {
    title: 'Aucun devis envoyé',
    description: 'Les devis marqués comme envoyés apparaîtront ici.',
  },
  draft: {
    title: 'Aucun brouillon de devis',
    description: 'Créez un devis pour le retrouver ici avant envoi.',
  },
  expired: {
    title: 'Aucun devis expiré',
    description: 'Les devis arrivés à échéance apparaîtront ici.',
  },
  converted: {
    title: 'Aucun devis converti',
    description: 'Les devis transformés en facture apparaîtront ici.',
  },
};

export function EmptyQuotes({
  isSearching = false,
  statusFilter = 'all',
  style,
  testID,
}: EmptyQuotesProps) {
  const statusCopy = statusFilter !== 'all' ? STATUS_EMPTY[statusFilter] : undefined;
  const canCreate = !isSearching && statusFilter === 'all';

  return (
    <EmptyState
      actionLabel={
        canCreate
          ? 'Créer un devis'
          : statusFilter !== 'all' && !isSearching
            ? 'Voir tous les devis'
            : undefined
      }
      description={
        isSearching
          ? 'Essayez un autre numéro de devis.'
          : (statusCopy?.description ?? 'Créez votre premier devis pour vos clients.')
      }
      fill
      icon={{
        ios: isSearching ? 'magnifyingglass' : 'doc.text',
        android: isSearching ? 'search' : 'description',
        web: isSearching ? 'search' : 'description',
      }}
      onAction={
        canCreate
          ? () => router.push('/quotes/new' as Href)
          : statusFilter !== 'all' && !isSearching
            ? () => router.replace('/quotes' as Href)
            : undefined
      }
      style={style}
      testID={testID}
      title={
        isSearching
          ? 'Aucun résultat pour cette recherche'
          : (statusCopy?.title ?? 'Aucun devis')
      }
    />
  );
}
