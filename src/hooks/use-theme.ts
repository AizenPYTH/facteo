import { useColors, type AppColors } from '@/hooks/use-colors';

/**
 * @deprecated Prefer `useColors()` from `@/hooks/use-colors`.
 */
export function useTheme(): AppColors {
  return useColors();
}
