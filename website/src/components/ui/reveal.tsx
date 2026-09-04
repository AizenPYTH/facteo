'use client';

import { motion, useReducedMotion, type MotionProps } from 'framer-motion';
import type { ReactNode } from 'react';

import {
  RISE,
  STAGGER,
  VIEWPORT,
  revealVariants,
  revealVariantsReduced,
  transition,
} from '@/lib/motion';

/**
 * Table statique des balises animables.
 *
 * `motion.create(tag)` appelé pendant le rendu fabriquerait un composant neuf à
 * chaque passage — donc un remontage complet du sous-arbre — et fait perdre le
 * typage des props intrinsèques. Une table couvre les cas réels du site.
 */
const TAGS = {
  div: motion.div,
  section: motion.section,
  ul: motion.ul,
  li: motion.li,
  span: motion.span,
  p: motion.p,
} as const;

type Tag = keyof typeof TAGS;

type RevealProps = {
  children: ReactNode;
  className?: string;
  /** Décalage manuel, en secondes. À réserver aux cas hors série. */
  delay?: number;
  /** Translation d'entrée. `none` pour un simple fondu. */
  from?: 'up' | 'down' | 'none';
  as?: Tag;
};

/**
 * Apparition d'un bloc au scroll.
 *
 * Se déclenche une seule fois : un élément qui rejoue son animation à chaque
 * passage attire l'attention sur l'effet plutôt que sur le contenu.
 */
export function Reveal({ children, className, delay = 0, from = 'up', as = 'div' }: RevealProps) {
  const reduce = useReducedMotion();
  const Component = TAGS[as];
  const offset = from === 'up' ? RISE : from === 'down' ? -RISE : 0;

  return (
    <Component
      className={className}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: offset }}
      transition={{ ...transition.base, delay }}
      viewport={VIEWPORT}
      whileInView={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}>
      {children}
    </Component>
  );
}

/** Conteneur d'une série : ses `RevealItem` entrent l'un après l'autre. */
export function RevealGroup({
  children,
  className,
  delay = 0,
  as = 'div',
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: Tag;
}) {
  const Component = TAGS[as];

  return (
    <Component
      className={className}
      initial="hidden"
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: STAGGER, delayChildren: delay } },
      }}
      viewport={VIEWPORT}
      whileInView="show">
      {children}
    </Component>
  );
}

export function RevealItem({
  children,
  className,
  as = 'div',
  ...rest
}: {
  children: ReactNode;
  className?: string;
  as?: Tag;
} & MotionProps) {
  const reduce = useReducedMotion();
  const Component = TAGS[as];

  return (
    <Component
      className={className}
      variants={reduce ? revealVariantsReduced : revealVariants}
      {...rest}>
      {children}
    </Component>
  );
}
