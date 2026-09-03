/**
 * Toolbar Prev/Next/OK volontairement désactivée.
 *
 * `KeyboardToolbar` (react-native-keyboard-controller) montée à la racine
 * a été identifiée comme cause probable du crash immédiat TestFlight 1.0.4 (57) :
 * vue native attachée avant le premier TextInput / avant la fin du layout.
 *
 * Le clavier reste géré par KeyboardProvider + KeyboardAwareScrollView +
 * KeyboardStickyView (déjà en production App Store).
 */
export function AppKeyboardToolbar() {
  return null;
}
