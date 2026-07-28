import { router, type Href } from 'expo-router';
import { View, type ViewStyle } from 'react-native';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { spacing } from '@/constants/theme/spacing';
import { useThemedStyles } from '@/hooks/use-colors';

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
  const styles = useStyles();
  const canCreate = showCreateAction && !isSearching;

  return (
    <View style={[styles.wrap, style]} testID={testID}>
      <EmptyState
        actionLabel={canCreate ? 'Créer une facture' : undefined}
        description={
          isSearching
            ? 'Aucune facture ne correspond à votre recherche.'
            : 'Émettez votre première facture. Ajoutez d’abord un client (manuel ou IA), puis facturez en quelques taps.'
        }
        icon={{
          ios: isSearching ? 'magnifyingglass' : 'doc.plaintext',
          android: isSearching ? 'search' : 'receipt_long',
          web: isSearching ? 'search' : 'receipt_long',
        }}
        onAction={canCreate ? () => router.push('/invoices/new' as Href) : undefined}
        title={isSearching ? 'Aucun résultat' : 'Vos factures apparaîtront ici'}
      />
      {canCreate ? (
        <View style={styles.secondary}>
          <Button
            onPress={() => router.push('/clients/new?ai=1&next=invoice' as Href)}
            title="Commencer par un client IA"
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
    secondary: {
      marginTop: -spacing.sm,
      alignSelf: 'stretch',
      maxWidth: 280,
    },
  }));
}
