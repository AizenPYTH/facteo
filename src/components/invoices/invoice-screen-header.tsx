import type { ReactNode } from 'react';
import type { Href } from 'expo-router';
import type { ViewStyle } from 'react-native';

import { NavigationHeader } from '@/components/ui/navigation-header';

type InvoiceScreenHeaderProps = {
  title: string;
  onBack?: () => void;
  backLabel?: string;
  fallbackHref?: Href;
  showBackButton?: boolean;
  style?: ViewStyle;
  trailing?: ReactNode;
};

export function InvoiceScreenHeader({
  title,
  onBack,
  backLabel = 'Documents',
  fallbackHref = '/invoices',
  showBackButton,
  style,
  trailing,
}: InvoiceScreenHeaderProps) {
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
