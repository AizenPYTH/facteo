import { createContext, useContext, useMemo, type PropsWithChildren } from 'react';
import { StyleSheet, type ImageStyle, type TextStyle, type ViewStyle } from 'react-native';

import {
  colors as lightColors,
  colorsDark,
  gradients,
  gradientsDark,
  type ColorToken,
  type GradientTokens,
} from '@/constants/theme/colors';
import { useThemePreference } from '@/providers/theme-preference-provider';

export type AppColors = {
  [K in ColorToken]: string;
};

const ColorsContext = createContext<AppColors>(lightColors);

export function ColorsProvider({ children }: PropsWithChildren) {
  const { colorScheme } = useThemePreference();
  const palette = colorScheme === 'dark' ? colorsDark : lightColors;

  const value = useMemo(() => palette, [palette]);

  return <ColorsContext.Provider value={value}>{children}</ColorsContext.Provider>;
}

export function useColors(): AppColors {
  return useContext(ColorsContext);
}

/** Theme-aware brand gradients — mirrors `useColors()` but for gradient stops. */
export function useGradients(): GradientTokens {
  const { colorScheme } = useThemePreference();
  return colorScheme === 'dark' ? gradientsDark : gradients;
}

type NamedStyles<T> = {
  [P in keyof T]: ViewStyle | TextStyle | ImageStyle;
};

export function useThemedStyles<T extends NamedStyles<T>>(
  factory: (palette: AppColors) => T,
): T {
  const palette = useColors();
  return useMemo(() => StyleSheet.create(factory(palette)), [factory, palette]);
}
