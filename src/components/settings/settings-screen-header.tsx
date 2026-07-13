import { NavigationHeader } from '@/components/ui/navigation-header';

type SettingsScreenHeaderProps = {
  title: string;
};

export function SettingsScreenHeader({ title }: SettingsScreenHeaderProps) {
  return <NavigationHeader title={title} />;
}
