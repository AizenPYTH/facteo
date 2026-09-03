import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomTabInset } from '@/constants/theme';
import { spacing } from '@/constants/theme/spacing';

export type ScreenInsets = {
  /** Marge haute sûre. */
  top: number;
  /** Marge basse sûre, hors barre d'onglets. */
  bottom: number;
  /** Marge basse pour un contenu affiché DANS un écran à onglets. */
  bottomWithTabBar: number;
  /** Padding bas d'une liste défilante sous la barre d'onglets. */
  scrollBottom: number;
  /** Décalage d'un élément flottant (FAB) au-dessus de la barre d'onglets. */
  floatingBottom: number;
};

/**
 * Source unique pour les marges sûres.
 *
 * Centralise la règle safe-area + barre d'onglets, jusque-là recopiée écran par
 * écran autour de la constante `BottomTabInset` codée en dur. Les écrans ne
 * calculent plus rien : ils consomment la valeur qui correspond à leur contexte.
 */
export function useScreenInsets(): ScreenInsets {
  const insets = useSafeAreaInsets();
  const bottom = Math.max(insets.bottom, spacing[2]);

  return {
    top: insets.top,
    bottom,
    bottomWithTabBar: bottom + BottomTabInset,
    scrollBottom: bottom + BottomTabInset + spacing.lg,
    floatingBottom: bottom + BottomTabInset + spacing.md,
  };
}
