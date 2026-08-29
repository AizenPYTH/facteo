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
          ? 'Aucun client ne correspond à ce filtre. Essayez un autre nom, e-mail ou entreprise.'
          : 'Ajoutez votre premier client pour commencer.'
      }
      fill
      icon={{
        ios: isSearching ? 'magnifyingglass' : 'person.2',
        android: isSearching ? 'search' : 'group',
        web: isSearching ? 'search' : 'group',
      }}
      onAction={isSearching ? undefined : () => router.push('/clients/new' as Href)}
      style={style}
      testID={testID}
      title={isSearching ? 'Aucun client pour cette recherche' : 'Aucun client'}
    />
  );
}
