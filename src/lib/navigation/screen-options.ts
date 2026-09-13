import { Platform } from 'react-native';

/**
 * Options de navigation partagées.
 *
 * Chaque `_layout` déclarait jusqu'ici ses propres `animation` et
 * `presentation` : une pile glissait, une autre héritait du défaut. Un seul jeu
 * d'options pour toute l'app, appliqué au `Stack` parent plutôt qu'écran par
 * écran.
 */

/** Pile standard : en-tête maison, poussée latérale, retour par geste. */
export const stackScreenOptions = {
  headerShown: false,
  animation: 'slide_from_right',
  gestureEnabled: true,
  // Le geste de retour plein écran n'existe que sur iOS.
  fullScreenGestureEnabled: Platform.OS === 'ios',
} as const;

/** Écran présenté par-dessus la pile : création, sélecteur, prévisualisation. */
export const modalScreenOptions = {
  ...stackScreenOptions,
  presentation: 'modal',
  animation: 'slide_from_bottom',
} as const;

/**
 * Écran de saisie plein cadre atteint depuis un onglet (assistant de création).
 * Reste une carte : l'utilisateur doit voir qu'il est toujours dans la pile.
 */
export const formScreenOptions = {
  ...stackScreenOptions,
  presentation: 'card',
} as const;
