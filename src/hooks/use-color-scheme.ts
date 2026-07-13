import { useThemePreference } from '@/providers/theme-preference-provider';

export function useColorScheme(): 'light' | 'dark' | null {
  const { colorScheme } = useThemePreference();
  return colorScheme;
}
