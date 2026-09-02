import { Platform } from 'react-native';
import { KeyboardToolbar } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useColors } from '@/hooks/use-colors';

/**
 * Barre globale Précédent / Suivant / OK, collée au clavier.
 * Montée une seule fois dans le layout racine — tous les TextInput y sont reliés.
 */
export function AppKeyboardToolbar() {
  const insets = useSafeAreaInsets();
  const colors = useColors();

  if (Platform.OS === 'web') {
    return null;
  }

  return (
    <KeyboardToolbar
      insets={{ left: insets.left, right: insets.right }}
      theme={{
        light: {
          primary: colors.primary,
          disabled: colors.textTertiary,
          background: colors.surface,
          ripple: colors.primarySubtle,
        },
        dark: {
          primary: colors.primary,
          disabled: colors.textTertiary,
          background: colors.surface,
          ripple: colors.primarySubtle,
        },
      }}>
      <KeyboardToolbar.Prev />
      <KeyboardToolbar.Next />
      <KeyboardToolbar.Done text="OK" />
    </KeyboardToolbar>
  );
}
