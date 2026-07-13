import { NavigationHeader } from '@/components/ui/navigation-header';
import type { ViewStyle } from 'react-native';

type ClientScreenHeaderProps = {
  title: string;
  onBack?: () => void;
  backLabel?: string;
  style?: ViewStyle;
};

export function ClientScreenHeader({ title, onBack, backLabel, style }: ClientScreenHeaderProps) {
  return (
    <NavigationHeader backLabel={backLabel} onBack={onBack} style={style} title={title} />
  );
}
