import { router, type Href } from 'expo-router';
import type { ViewStyle } from 'react-native';

import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';

export type EmptyInvoicesProps = {
  title?: string;
  description?: string;
  /** Masque l'action quand l'écran en propose déjà une plus haut. */
  showAction?: boolean;
  style?: ViewStyle;
  testID?: string;
};

const DEFAULT_TITLE = 'Aucune facture';
const DEFAULT_DESCRIPTION = 'Vos dernières factures apparaîtront ici.';

/**
 * Vide de la section « Factures récentes ». Délègue à `EmptyState` : c'était
 * jusqu'ici une troisième mise en page d'état vide, avec ses propres marges.
 */
export function EmptyInvoices({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  showAction = true,
  style,
  testID,
}: EmptyInvoicesProps) {
  return (
    <Card style={style} testID={testID} variant="subtle">
      <EmptyState
        actionLabel={showAction ? 'Créer une facture' : undefined}
        description={description}
        icon={{ ios: 'doc.plaintext', android: 'receipt', web: 'receipt' }}
        onAction={showAction ? () => router.push('/invoices/new' as Href) : undefined}
        title={title}
      />
    </Card>
  );
}
