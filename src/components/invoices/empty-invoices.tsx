import { router, type Href } from 'expo-router';
import { type ViewStyle } from 'react-native';

import { EmptyState } from '@/components/ui/empty-state';

export type EmptyInvoicesProps = {
  isSearching?: boolean;
  showCreateAction?: boolean;
  style?: ViewStyle;
  testID?: string;
};

export function EmptyInvoices({
  isSearching = false,
  showCreateAction = true,
  style,
  testID,
}: EmptyInvoicesProps) {
  const canCreate = showCreateAction && !isSearching;

  return (
    <EmptyState
      actionLabel={canCreate ? 'Créer une facture' : undefined}
      description={
        isSearching
          ? 'Essayez un autre numéro de facture.'
          : 'Créez votre première facture pour vos clients.'
      }
      icon={{
        ios: isSearching ? 'magnifyingglass' : 'doc.plaintext',
        android: isSearching ? 'search' : 'receipt_long',
        web: isSearching ? 'search' : 'receipt_long',
      }}
      onAction={canCreate ? () => router.push('/invoices/new' as Href) : undefined}
      style={style}
      testID={testID}
      title={isSearching ? 'Aucun résultat' : 'Aucune facture'}
    />
  );
}
