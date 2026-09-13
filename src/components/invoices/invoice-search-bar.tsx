import type { StyleProp, ViewStyle } from 'react-native';

import { SearchField } from '@/components/ui/search-field';

export type InvoiceSearchBarProps = {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/** Recherche de factures. Délègue au champ de recherche du socle. */
export function InvoiceSearchBar({
  value,
  onChangeText,
  placeholder = 'Rechercher une facture',
  style,
  testID,
}: InvoiceSearchBarProps) {
  return (
    <SearchField
      accessibilityLabel="Rechercher une facture par numéro ou client"
      onChangeText={onChangeText}
      placeholder={placeholder}
      style={style}
      testID={testID}
      value={value}
    />
  );
}
