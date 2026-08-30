import type { Href } from 'expo-router';

import { NavigationHeader } from '@/components/ui/navigation-header';

type SettingsScreenHeaderProps = {
  title: string;
  backLabel?: string;
  fallbackHref?: Href;
};

export function SettingsScreenHeader({
  title,
  backLabel = 'Réglages',
  fallbackHref = '/settings',
}: SettingsScreenHeaderProps) {
  return (
    <NavigationHeader backLabel={backLabel} fallbackHref={fallbackHref} title={title} />
  );
}
