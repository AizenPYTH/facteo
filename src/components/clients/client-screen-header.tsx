import type { Href } from 'expo-router';
import type { ViewStyle } from 'react-native';

import { NavigationHeader } from '@/components/ui/navigation-header';

type ClientScreenHeaderProps = {
  title: string;
  onBack?: () => void;
  backLabel?: string;
  fallbackHref?: Href;
  style?: ViewStyle;
  trailing?: React.ReactNode;
};

export function ClientScreenHeader({
  title,
  onBack,
  backLabel = 'Clients',
  fallbackHref = '/clients',
  style,
  trailing,
}: ClientScreenHeaderProps) {
  return (
    <NavigationHeader
      backLabel={backLabel}
      fallbackHref={fallbackHref}
      onBack={onBack}
      style={style}
      title={title}
      trailing={trailing}
    />
  );
}
