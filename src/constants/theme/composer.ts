import { useMemo } from 'react';
import { StyleSheet, type ImageStyle, type TextStyle, type ViewStyle } from 'react-native';

import { useThemePreference } from '@/providers/theme-preference-provider';

/**
 * Palette de l'assistant de création de facture (iPhone).
 *
 * Reprise telle quelle de la maquette « Nouvelle facture » : fond chaud,
 * surfaces blanches sans bordure, accent indigo unique. Elle vit à part de la
 * palette globale pour ne pas déplacer le reste de l'app, mais suit la même
 * préférence clair / sombre.
 */
export const composerLight = {
  bg: '#F3F2EF',
  surface: '#FFFFFF',
  soft: '#F1F0EC',
  line: '#E4E2DC',
  line2: '#ECEAE5',
  ink: '#1C1B22',
  ink2: '#55535D',
  ink3: '#75737D',
  accent: '#4F46E5',
  accentSoft: '#EEEDFC',
  accentInk: '#4338CA',
  onAccent: '#FFFFFF',
  danger: '#C93A32',
  dangerSoft: '#FCEEEC',
  ok: '#1F8A5B',
  okSoft: '#E7F5EE',
  warn: '#B7791F',
  scrim: 'rgba(20, 18, 28, 0.36)',
  bar: 'rgba(255, 255, 255, 0.92)',
  track: '#E4E3E8',
  shadow: 'rgba(28, 24, 40, 0.14)',
  /** La feuille PDF reste blanche, même en mode sombre. */
  paper: '#FFFFFF',
} as const;

export type ComposerColors = { [K in keyof typeof composerLight]: string };

export const composerDark: ComposerColors = {
  bg: '#0F0F12',
  surface: '#1A1A1F',
  soft: '#24242B',
  line: '#2E2E36',
  line2: '#26262D',
  ink: '#F2F1F5',
  ink2: '#BAB8C3',
  ink3: '#8F8D99',
  accent: '#6D66F0',
  accentSoft: 'rgba(109, 102, 240, 0.18)',
  accentInk: '#BAB5FF',
  onAccent: '#FFFFFF',
  danger: '#F0766C',
  dangerSoft: 'rgba(240, 118, 108, 0.13)',
  ok: '#4CC38A',
  okSoft: 'rgba(76, 195, 138, 0.14)',
  warn: '#E0A94A',
  scrim: 'rgba(0, 0, 0, 0.6)',
  bar: 'rgba(26, 26, 31, 0.92)',
  track: '#3A3A42',
  shadow: 'rgba(0, 0, 0, 0.6)',
  paper: '#FFFFFF',
};

/** Rayons iOS de la maquette. */
export const composerRadius = {
  card: 14,
  cardLarge: 16,
  hero: 18,
  button: 15,
  field: 10,
  chip: 6,
  pill: 99,
  sheet: 14,
} as const;

/** Chiffres à chasse fixe : les montants ne « dansent » pas pendant la frappe. */
export const tabularNums: TextStyle = { fontVariant: ['tabular-nums'] };

export function useComposerColors(): ComposerColors & { scheme: 'light' | 'dark' } {
  const { colorScheme } = useThemePreference();

  return useMemo(
    () => ({ ...(colorScheme === 'dark' ? composerDark : composerLight), scheme: colorScheme }),
    [colorScheme],
  );
}

type NamedStyles<T> = {
  [P in keyof T]: ViewStyle | TextStyle | ImageStyle;
};

/** Équivalent de `useThemedStyles` sur la palette de l'assistant. */
export function useComposerStyles<T extends NamedStyles<T>>(
  factory: (palette: ComposerColors) => T,
): T {
  const palette = useComposerColors();
  return useMemo(() => StyleSheet.create(factory(palette)), [factory, palette]);
}
