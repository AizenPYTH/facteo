import { Stack } from 'expo-router';

import { stackScreenOptions } from '@/lib/navigation/screen-options';

export default function CompanyLayout() {
  return <Stack screenOptions={stackScreenOptions} />;
}
