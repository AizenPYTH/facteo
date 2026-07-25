import { router, type Href } from 'expo-router';
import { type ViewStyle } from 'react-native';

import { EmptyState } from '@/components/ui/empty-state';

export type EmptyClientsProps = {
  isSearching?: boolean;
  style?: ViewStyle;
  testID?: string;
};

export function EmptyClients({ isSearching = false, style, testID }: EmptyClientsProps) {
  return (
    <EmptyState
      actionLabel={isSearching ? undefined : 'Créer un client'}
      description={
        isSearching
          ? 'Aucun client ne correspond. Essayez un autre nom ou e-mail.'
          : 'Ajoutez un client — puis facturez. Ensuite, plus jamais la même saisie.'
      }
      icon={{
        ios: isSearching ? 'magnifyingglass' : 'person.2',
        android: isSearching ? 'search' : 'group',
        web: isSearching ? 'search' : 'group',
      }}
      onAction={
        isSearching
          ? undefined
          : () => router.push('/clients/new?next=invoice' as Href)
      }
      style={style}
      testID={testID}
      title={isSearching ? 'Aucun résultat' : 'Vos clients apparaîtront ici'}
    />
  );
}
