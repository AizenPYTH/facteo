import type { StyleProp, ViewStyle } from 'react-native';

import { SearchField } from '@/components/ui/search-field';

export type QuoteSearchBarProps = {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/** Recherche de devis. Délègue au champ de recherche du socle. */
export function QuoteSearchBar({
  value,
  onChangeText,
  placeholder = 'Rechercher un devis',
  style,
  testID,
}: QuoteSearchBarProps) {
  return (
    <SearchField
      accessibilityLabel="Rechercher un devis par numéro ou client"
      onChangeText={onChangeText}
      placeholder={placeholder}
      style={style}
      testID={testID}
      value={value}
    />
  );
}
