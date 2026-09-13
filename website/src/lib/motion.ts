/**
 * Motion INVEQ — jetons partagés par tout le site.
 *
 * Une seule courbe signature et quatre durées. Au-delà, la cohérence se perd :
 * chaque section finit par avoir son propre timing et l'ensemble donne
 * l'impression d'un assemblage de templates.
 *
 * Règle : le mouvement sert à orienter le regard, jamais à décorer. Il porte
 * sur `transform` et `opacity` uniquement — les seules propriétés que le
 * compositeur peut animer sans repasser par la mise en page.
 */
import type { Transition, Variants } from 'framer-motion';

/** Courbe signature — décélération franche, arrivée douce. */
export const EASE = [0.22, 1, 0.36, 1] as const;

/** Pour ce qui sort de l'écran : l'inverse, départ franc. */
export const EASE_IN = [0.64, 0, 0.78, 0] as const;

export const DURATION = {
  /** Retour immédiat : survol, focus, changement d'état d'un contrôle. */
  instant: 0.16,
  /** Micro-transition : couleur, opacité, petite translation. */
  fast: 0.24,
  /** Transition standard : apparition d'un bloc au scroll. */
  base: 0.42,
  /** Séquence ample : scène produit, transformation d'un document. */
  slow: 0.64,
} as const;

/** Décalage entre éléments d'une même série. Court : au-delà, ça traîne. */
export const STAGGER = 0.06;

/** Translation d'entrée. 16 px suffisent à faire lire le mouvement. */
export const RISE = 16;

export const transition = {
  fast: { duration: DURATION.fast, ease: EASE },
  base: { duration: DURATION.base, ease: EASE },
  slow: { duration: DURATION.slow, ease: EASE },
} satisfies Record<string, Transition>;

/**
 * Ressort unique du site, pour ce qui doit sembler physique — un montant qui
 * se pose, une carte qui se replace.
 */
export const spring: Transition = { type: 'spring', stiffness: 260, damping: 30, mass: 0.9 };

/** Fenêtre d'observation commune : l'élément se révèle un peu avant le pli. */
export const VIEWPORT = { once: true, margin: '-12% 0px -8% 0px' } as const;

export const revealVariants: Variants = {
  hidden: { opacity: 0, y: RISE },
  show: { opacity: 1, y: 0, transition: transition.base },
};

export const staggerVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: STAGGER } },
};

/**
 * Variantes équivalentes sans déplacement, pour `prefers-reduced-motion`.
 * On coupe le mouvement, jamais le changement d'état : le contenu doit
 * toujours finir visible.
 */
export const revealVariantsReduced: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: DURATION.fast } },
};
