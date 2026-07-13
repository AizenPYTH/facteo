import { NavigationHeader } from '@/components/ui/navigation-header';
import type { ViewStyle } from 'react-native';

type QuoteScreenHeaderProps = {
  title: string;
  onBack?: () => void;
  backLabel?: string;
  showBackButton?: boolean;
  style?: ViewStyle;
};

export function QuoteScreenHeader({
  title,
  onBack,
  backLabel,
  showBackButton,
  style,
}: QuoteScreenHeaderProps) {
  return (
    <NavigationHeader
      backLabel={backLabel}
      onBack={onBack}
      showBackButton={showBackButton}
      style={style}
      title={title}
    />
  );
}
