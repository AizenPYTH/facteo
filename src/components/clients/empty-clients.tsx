import { router, type Href } from 'expo-router';
import { View, type ViewStyle } from 'react-native';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { spacing } from '@/constants/theme/spacing';
import { useThemedStyles } from '@/hooks/use-colors';

export type EmptyClientsProps = {
  isSearching?: boolean;
  style?: ViewStyle;
  testID?: string;
};

export function EmptyClients({ isSearching = false, style, testID }: EmptyClientsProps) {
  const styles = useStyles();

  return (
    <View style={[styles.wrap, style]} testID={testID}>
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
        title={isSearching ? 'Aucun résultat' : 'Vos clients apparaîtront ici'}
      />
      {!isSearching ? (
        <View style={styles.aiAction}>
          <Button
            onPress={() => router.push('/clients/new?ai=1' as Href)}
            title="Ajouter par IA"
            variant="ghost"
          />
        </View>
      ) : null}
    </View>
  );
}

function useStyles() {
  return useThemedStyles(() => ({
    wrap: {
      alignItems: 'center',
    },
    aiAction: {
      marginTop: -spacing.sm,
      alignSelf: 'stretch',
      maxWidth: 280,
    },
  }));
}
