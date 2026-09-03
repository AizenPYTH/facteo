import type { StyleProp, ViewStyle } from 'react-native';

import { SearchField } from '@/components/ui/search-field';

export type ClientSearchBarProps = {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/** Recherche de clients. Délègue au champ de recherche du socle. */
export function ClientSearchBar({
  value,
  onChangeText,
  placeholder = 'Rechercher un client',
  style,
  testID,
}: ClientSearchBarProps) {
  return (
    <SearchField
      accessibilityLabel="Rechercher un client par société, contact, téléphone ou e-mail"
      onChangeText={onChangeText}
      placeholder={placeholder}
      style={style}
      testID={testID}
      value={value}
    />
  );
}
