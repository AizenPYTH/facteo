import { NavigationHeader } from '@/components/ui/navigation-header';
import type { ViewStyle } from 'react-native';

import type { ReactNode } from 'react';

type InvoiceScreenHeaderProps = {
  title: string;
  onBack?: () => void;
  backLabel?: string;
  showBackButton?: boolean;
  style?: ViewStyle;
  trailing?: ReactNode;
};

export function InvoiceScreenHeader({
  title,
  onBack,
  backLabel,
  showBackButton,
  style,
  trailing,
}: InvoiceScreenHeaderProps) {
  return (
    <NavigationHeader
      backLabel={backLabel}
      onBack={onBack}
      showBackButton={showBackButton}
      style={style}
      title={title}
      trailing={trailing}
    />
  );
}
