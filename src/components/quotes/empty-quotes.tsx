import { router, type Href } from 'expo-router';
import { type ViewStyle } from 'react-native';

import { EmptyState } from '@/components/ui/empty-state';

export type EmptyQuotesProps = {
  isSearching?: boolean;
  style?: ViewStyle;
  testID?: string;
};

export function EmptyQuotes({ isSearching = false, style, testID }: EmptyQuotesProps) {
  return (
    <EmptyState
      actionLabel={isSearching ? undefined : 'Créer un devis'}
      description={
        isSearching
          ? 'Aucun devis ne correspond à votre recherche. Essayez un autre numéro.'
          : 'Créez un devis en quelques minutes. La fois suivante : « Comme la dernière fois ».'
      }
      icon={{
        ios: isSearching ? 'magnifyingglass' : 'doc.text',
        android: isSearching ? 'search' : 'description',
        web: isSearching ? 'search' : 'description',
      }}
      onAction={isSearching ? undefined : () => router.push('/quotes/new' as Href)}
      style={style}
      testID={testID}
      title={isSearching ? 'Aucun résultat' : 'Vos devis apparaîtront ici'}
    />
  );
}
