import { router, type Href } from 'expo-router';
import type { ViewStyle } from 'react-native';

import { FloatingActionButton } from '@/components/ui/floating-action-button';

export type AddClientFabProps = {
  onPress?: () => void;
  label?: string;
  style?: ViewStyle;
  testID?: string;
};

export function AddClientFab({
  onPress,
  label = 'Ajouter un client',
  style,
  testID,
}: AddClientFabProps) {
  return (
    <FloatingActionButton
      label={label}
      onPress={onPress ?? (() => router.push('/clients/new' as Href))}
      style={style}
      testID={testID}
    />
  );
}
