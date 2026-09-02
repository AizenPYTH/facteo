import { Platform } from 'react-native';
import { useKeyboardState } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { KEYBOARD_OPENED_FOOTER_PADDING } from '@/components/ui/keyboard/constants';
import { spacing } from '@/constants/theme/spacing';

/**
 * Padding bas d’un pied d’action collé au clavier.
 *
 * Cause historique des boutons qui « sautent » : on gardait `insets.bottom`
 * (home indicator) alors que le clavier est ouvert — le pied était poussé
 * deux fois (safe area + hauteur clavier).
 *
 * Clavier ouvert → petit padding. Clavier fermé → safe area.
 */
export function useKeyboardAwareFooterPadding(): number {
  const insets = useSafeAreaInsets();
  const isVisible = useKeyboardState((state) => state.isVisible);
  const closedMin = Platform.OS === 'ios' ? spacing.sm : spacing.md;

  if (isVisible) {
    return KEYBOARD_OPENED_FOOTER_PADDING;
  }

  return Math.max(insets.bottom, closedMin);
}
