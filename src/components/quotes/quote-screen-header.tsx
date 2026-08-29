import type { Href } from 'expo-router';
import type { ViewStyle } from 'react-native';

import { NavigationHeader } from '@/components/ui/navigation-header';

type QuoteScreenHeaderProps = {
  title: string;
  onBack?: () => void;
  backLabel?: string;
  fallbackHref?: Href;
  showBackButton?: boolean;
  style?: ViewStyle;
  trailing?: React.ReactNode;
};

export function QuoteScreenHeader({
  title,
  onBack,
  backLabel = 'Documents',
  fallbackHref = '/quotes',
  showBackButton,
  style,
  trailing,
}: QuoteScreenHeaderProps) {
  return (
    <NavigationHeader
      backLabel={backLabel}
      fallbackHref={fallbackHref}
      onBack={onBack}
      showBackButton={showBackButton}
      style={style}
      title={title}
      trailing={trailing}
    />
  );
}
