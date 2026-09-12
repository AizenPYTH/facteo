import { Platform } from 'react-native';
import { useKeyboardState } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { KEYBOARD_OPENED_FOOTER_PADDING } from '@/components/ui/keyboard/constants';
import { spacing } from '@/constants/theme/spacing';

function useClosedFooterPadding(): number {
  const insets = useSafeAreaInsets();
  const closedMin = Platform.OS === 'ios' ? spacing.sm : spacing.md;

  return Math.max(insets.bottom, closedMin);
}

/**
 * Padding bas du pied d'action, qui est collé au clavier (`KeyboardStickyView`).
 *
 * Clavier ouvert → petit padding : le pied est déjà remonté au-dessus du clavier,
 * conserver `insets.bottom` (home indicator) le décalerait une seconde fois.
 * Clavier fermé → safe area.
 */
export function useKeyboardAwareFooterPadding(): number {
  const closed = useClosedFooterPadding();
  const isVisible = useKeyboardState((state) => state.isVisible);

  return isVisible ? KEYBOARD_OPENED_FOOTER_PADDING : closed;
}

/**
 * Même valeur, mais **figée sur l'état « clavier fermé »**.
 *
 * À utiliser pour tout ce qui dimensionne le contenu scrollable
 * (`contentContainerStyle.paddingBottom`, `bottomOffset`).
 *
 * C'est la cause réelle des « éléments qui se déplacent bizarrement » : le
 * padding réservé sous la liste était recalculé à l'ouverture du clavier
 * (safe area → 8 px). La hauteur du contenu changeait donc pendant que
 * `KeyboardAwareScrollView` animait déjà le défilement vers le champ actif, et
 * les deux ajustements se combinaient. Un inset constant supprime le conflit.
 */
export function useStableFooterPadding(): number {
  return useClosedFooterPadding();
}
