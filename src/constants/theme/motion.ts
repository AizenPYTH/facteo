/**
 * INVEQ Motion — durées, courbes et ressorts partagés.
 *
 * Règle : rapide et discret. Une animation ne doit jamais retarder l'utilisateur.
 * Toute animation de l'app passe par ces tokens ; aucune valeur en dur ailleurs.
 */
import { Easing } from 'react-native-reanimated';

/** Durées en millisecondes. */
export const duration = {
  /** Retour tactile immédiat : press, ripple, changement d'état d'un contrôle. */
  instant: 90,
  /** Micro-transitions : opacité, couleur, petites translations. */
  fast: 160,
  /** Transition standard : apparition de contenu, changement de section. */
  base: 240,
  /** Transitions amples : feuilles, overlays, entrées d'écran. */
  slow: 320,
} as const;

/**
 * Courbes. `standard` couvre la majorité des cas.
 * `decelerate` pour ce qui entre, `accelerate` pour ce qui sort.
 */
export const easing = {
  standard: Easing.bezier(0.2, 0, 0, 1),
  decelerate: Easing.out(Easing.cubic),
  accelerate: Easing.in(Easing.cubic),
  linear: Easing.linear,
} as const;

/**
 * Ressorts. Volontairement peu nombreux : deux suffisent à couvrir l'app.
 * `snappy` pour les contrôles, `gentle` pour les surfaces qui portent du contenu.
 */
export const spring = {
  snappy: { damping: 22, stiffness: 320, mass: 0.7 },
  gentle: { damping: 26, stiffness: 180, mass: 1 },
} as const;

/** Échelles de press. Au-delà de 0.98 l'effet devient visible et bon marché. */
export const pressScale = {
  subtle: 0.99,
  default: 0.975,
  strong: 0.96,
} as const;

/** Décalage entre éléments d'une liste qui apparaît. Court : au-delà, ça traîne. */
export const stagger = 28;

export const motionTokens = { duration, easing, spring, pressScale, stagger } as const;
